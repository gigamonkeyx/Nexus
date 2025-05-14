#!/usr/bin/env python3
"""
Metrics manager for Nexus MCP Hub.

This module provides metrics collection and reporting for the Nexus MCP Hub.
"""

import time
import logging
import enum
import json
import asyncio
from typing import Dict, List, Optional, Any, Set, Union, Callable
from collections import defaultdict

from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class MetricType(enum.Enum):
    """Type of metric."""
    
    # Counter metrics (monotonically increasing)
    COUNTER = "counter"
    
    # Gauge metrics (can go up and down)
    GAUGE = "gauge"
    
    # Histogram metrics (distribution of values)
    HISTOGRAM = "histogram"
    
    # Summary metrics (similar to histogram but with quantiles)
    SUMMARY = "summary"

class Metric:
    """Metric for monitoring."""
    
    def __init__(self, name: str, description: str, metric_type: MetricType, labels: Optional[Dict[str, str]] = None):
        """
        Initialize a metric.
        
        Args:
            name: Metric name
            description: Metric description
            metric_type: Metric type
            labels: Metric labels
        """
        self.name = name
        self.description = description
        self.metric_type = metric_type
        self.labels = labels or {}
        self.value = 0
        self.values = []  # For histogram and summary
        self.timestamp = time.time()
    
    def __str__(self) -> str:
        """Get string representation of the metric."""
        return f"{self.name}({self.metric_type.value}): {self.value}"
    
    def increment(self, value: float = 1.0) -> None:
        """
        Increment the metric value.
        
        Args:
            value: Value to increment by
        """
        if self.metric_type != MetricType.COUNTER:
            logger.warning(f"Cannot increment non-counter metric: {self.name}")
            return
        
        self.value += value
        self.timestamp = time.time()
    
    def set(self, value: float) -> None:
        """
        Set the metric value.
        
        Args:
            value: Value to set
        """
        if self.metric_type != MetricType.GAUGE:
            logger.warning(f"Cannot set non-gauge metric: {self.name}")
            return
        
        self.value = value
        self.timestamp = time.time()
    
    def observe(self, value: float) -> None:
        """
        Observe a value for histogram or summary metrics.
        
        Args:
            value: Value to observe
        """
        if self.metric_type not in [MetricType.HISTOGRAM, MetricType.SUMMARY]:
            logger.warning(f"Cannot observe non-histogram/summary metric: {self.name}")
            return
        
        self.values.append(value)
        self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the metric to a dictionary.
        
        Returns:
            Dictionary representation of the metric
        """
        result = {
            "name": self.name,
            "description": self.description,
            "type": self.metric_type.value,
            "labels": self.labels,
            "timestamp": self.timestamp
        }
        
        if self.metric_type in [MetricType.COUNTER, MetricType.GAUGE]:
            result["value"] = self.value
        elif self.metric_type == MetricType.HISTOGRAM:
            # Calculate histogram statistics
            if self.values:
                result["count"] = len(self.values)
                result["sum"] = sum(self.values)
                result["min"] = min(self.values)
                result["max"] = max(self.values)
                result["avg"] = result["sum"] / result["count"]
                
                # Calculate percentiles
                sorted_values = sorted(self.values)
                result["p50"] = sorted_values[int(result["count"] * 0.5)]
                result["p90"] = sorted_values[int(result["count"] * 0.9)]
                result["p95"] = sorted_values[int(result["count"] * 0.95)]
                result["p99"] = sorted_values[int(result["count"] * 0.99)]
            else:
                result["count"] = 0
                result["sum"] = 0
                result["min"] = 0
                result["max"] = 0
                result["avg"] = 0
                result["p50"] = 0
                result["p90"] = 0
                result["p95"] = 0
                result["p99"] = 0
        elif self.metric_type == MetricType.SUMMARY:
            # Calculate summary statistics
            if self.values:
                result["count"] = len(self.values)
                result["sum"] = sum(self.values)
                result["min"] = min(self.values)
                result["max"] = max(self.values)
                result["avg"] = result["sum"] / result["count"]
            else:
                result["count"] = 0
                result["sum"] = 0
                result["min"] = 0
                result["max"] = 0
                result["avg"] = 0
        
        return result

class MetricsManager:
    """Metrics manager for the Nexus MCP Hub."""
    
    def __init__(self):
        """Initialize the metrics manager."""
        self.config = get_config_manager()
        self.metrics = {}  # Maps metric name to Metric instance
        self.running = False
        self._export_task = None
        
        # Initialize default metrics
        self._initialize_default_metrics()
        
        logger.info("Metrics Manager initialized")
    
    def _initialize_default_metrics(self) -> None:
        """Initialize default metrics."""
        # Hub metrics
        self.register_metric("hub_uptime", "Hub uptime in seconds", MetricType.GAUGE)
        self.register_metric("hub_server_count", "Number of registered servers", MetricType.GAUGE)
        self.register_metric("hub_client_count", "Number of registered clients", MetricType.GAUGE)
        self.register_metric("hub_mcp_server_count", "Number of connected MCP servers", MetricType.GAUGE)
        self.register_metric("hub_mcp_client_count", "Number of connected MCP clients", MetricType.GAUGE)
        
        # Message metrics
        self.register_metric("message_count", "Number of messages processed", MetricType.COUNTER)
        self.register_metric("message_error_count", "Number of message errors", MetricType.COUNTER)
        self.register_metric("message_processing_time", "Message processing time in milliseconds", MetricType.HISTOGRAM)
        
        # Server metrics
        self.register_metric("server_start_count", "Number of server starts", MetricType.COUNTER)
        self.register_metric("server_stop_count", "Number of server stops", MetricType.COUNTER)
        self.register_metric("server_restart_count", "Number of server restarts", MetricType.COUNTER)
        
        # Client metrics
        self.register_metric("client_connect_count", "Number of client connections", MetricType.COUNTER)
        self.register_metric("client_disconnect_count", "Number of client disconnections", MetricType.COUNTER)
        
        # Authentication metrics
        self.register_metric("auth_success_count", "Number of successful authentications", MetricType.COUNTER)
        self.register_metric("auth_failure_count", "Number of failed authentications", MetricType.COUNTER)
        
        # API metrics
        self.register_metric("api_request_count", "Number of API requests", MetricType.COUNTER)
        self.register_metric("api_error_count", "Number of API errors", MetricType.COUNTER)
        self.register_metric("api_request_time", "API request time in milliseconds", MetricType.HISTOGRAM)
    
    def register_metric(self, name: str, description: str, metric_type: MetricType, labels: Optional[Dict[str, str]] = None) -> Metric:
        """
        Register a metric.
        
        Args:
            name: Metric name
            description: Metric description
            metric_type: Metric type
            labels: Metric labels
            
        Returns:
            Registered metric
        """
        if name in self.metrics:
            logger.warning(f"Metric already exists: {name}")
            return self.metrics[name]
        
        metric = Metric(name, description, metric_type, labels)
        self.metrics[name] = metric
        
        logger.debug(f"Registered metric: {name}")
        
        return metric
    
    def get_metric(self, name: str) -> Optional[Metric]:
        """
        Get a metric by name.
        
        Args:
            name: Metric name
            
        Returns:
            Metric instance, or None if not found
        """
        return self.metrics.get(name)
    
    def increment_counter(self, name: str, value: float = 1.0) -> None:
        """
        Increment a counter metric.
        
        Args:
            name: Metric name
            value: Value to increment by
        """
        metric = self.get_metric(name)
        
        if not metric:
            logger.warning(f"Metric not found: {name}")
            return
        
        metric.increment(value)
    
    def set_gauge(self, name: str, value: float) -> None:
        """
        Set a gauge metric.
        
        Args:
            name: Metric name
            value: Value to set
        """
        metric = self.get_metric(name)
        
        if not metric:
            logger.warning(f"Metric not found: {name}")
            return
        
        metric.set(value)
    
    def observe_histogram(self, name: str, value: float) -> None:
        """
        Observe a value for a histogram metric.
        
        Args:
            name: Metric name
            value: Value to observe
        """
        metric = self.get_metric(name)
        
        if not metric:
            logger.warning(f"Metric not found: {name}")
            return
        
        metric.observe(value)
    
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all metrics.
        
        Returns:
            Dictionary of metrics
        """
        return {name: metric.to_dict() for name, metric in self.metrics.items()}
    
    async def start(self) -> None:
        """Start the metrics manager."""
        if self.running:
            logger.warning("Metrics Manager is already running")
            return
        
        logger.info("Starting Metrics Manager")
        
        # Start metrics export task
        export_interval = self.config.get("monitoring.metrics.export_interval", 60)
        self._export_task = asyncio.create_task(self._export_metrics_task(export_interval))
        
        self.running = True
        logger.info("Metrics Manager started")
    
    async def stop(self) -> None:
        """Stop the metrics manager."""
        if not self.running:
            logger.warning("Metrics Manager is not running")
            return
        
        logger.info("Stopping Metrics Manager")
        
        # Cancel metrics export task
        if self._export_task:
            self._export_task.cancel()
            try:
                await self._export_task
            except asyncio.CancelledError:
                pass
        
        self.running = False
        logger.info("Metrics Manager stopped")
    
    async def _export_metrics_task(self, interval: int) -> None:
        """
        Task to export metrics periodically.
        
        Args:
            interval: Export interval in seconds
        """
        while True:
            try:
                # Export metrics
                await self._export_metrics()
                
                # Wait for the next export
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                logger.debug("Metrics export task cancelled")
                break
            except Exception as e:
                logger.error(f"Error exporting metrics: {e}")
                await asyncio.sleep(10)  # Wait a bit before retrying
    
    async def _export_metrics(self) -> None:
        """Export metrics."""
        # Get all metrics
        metrics = self.get_all_metrics()
        
        # Export to file if configured
        export_file = self.config.get("monitoring.metrics.export_file")
        
        if export_file:
            try:
                with open(export_file, "w") as f:
                    json.dump(metrics, f, indent=2)
                
                logger.debug(f"Exported metrics to file: {export_file}")
            except Exception as e:
                logger.error(f"Error exporting metrics to file: {e}")
        
        # Export to Prometheus if configured
        prometheus_enabled = self.config.get("monitoring.metrics.prometheus.enabled", False)
        
        if prometheus_enabled:
            # Prometheus export would be implemented here
            pass
