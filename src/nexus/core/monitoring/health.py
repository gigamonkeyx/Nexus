#!/usr/bin/env python3
"""
Health manager for Nexus MCP Hub.

This module provides health checks and status reporting for the Nexus MCP Hub.
"""

import time
import logging
import enum
import json
import asyncio
from typing import Dict, List, Optional, Any, Set, Union, Callable, Awaitable

from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class HealthStatus(enum.Enum):
    """Health status."""
    
    # System is healthy
    HEALTHY = "healthy"
    
    # System is degraded but still functioning
    DEGRADED = "degraded"
    
    # System is unhealthy and not functioning properly
    UNHEALTHY = "unhealthy"

# Type definitions
HealthCheckFunc = Callable[[], Awaitable[HealthStatus]]

class HealthCheck:
    """Health check for monitoring."""
    
    def __init__(self, name: str, description: str, check_func: HealthCheckFunc):
        """
        Initialize a health check.
        
        Args:
            name: Health check name
            description: Health check description
            check_func: Health check function
        """
        self.name = name
        self.description = description
        self.check_func = check_func
        self.status = HealthStatus.HEALTHY
        self.last_check_time = 0
        self.last_check_duration = 0
        self.error_message = None
    
    def __str__(self) -> str:
        """Get string representation of the health check."""
        return f"{self.name}: {self.status.value}"
    
    async def run(self) -> HealthStatus:
        """
        Run the health check.
        
        Returns:
            Health status
        """
        start_time = time.time()
        
        try:
            # Run the health check function
            self.status = await self.check_func()
            self.error_message = None
        except Exception as e:
            logger.error(f"Error running health check {self.name}: {e}")
            self.status = HealthStatus.UNHEALTHY
            self.error_message = str(e)
        
        # Update check time and duration
        self.last_check_time = time.time()
        self.last_check_duration = self.last_check_time - start_time
        
        return self.status
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the health check to a dictionary.
        
        Returns:
            Dictionary representation of the health check
        """
        return {
            "name": self.name,
            "description": self.description,
            "status": self.status.value,
            "last_check_time": self.last_check_time,
            "last_check_duration": self.last_check_duration,
            "error_message": self.error_message
        }

class HealthManager:
    """Health manager for the Nexus MCP Hub."""
    
    def __init__(self):
        """Initialize the health manager."""
        self.config = get_config_manager()
        self.health_checks = {}  # Maps health check name to HealthCheck instance
        self.overall_status = HealthStatus.HEALTHY
        self.running = False
        self._check_task = None
        
        logger.info("Health Manager initialized")
    
    def register_health_check(self, name: str, description: str, check_func: HealthCheckFunc) -> HealthCheck:
        """
        Register a health check.
        
        Args:
            name: Health check name
            description: Health check description
            check_func: Health check function
            
        Returns:
            Registered health check
        """
        if name in self.health_checks:
            logger.warning(f"Health check already exists: {name}")
            return self.health_checks[name]
        
        health_check = HealthCheck(name, description, check_func)
        self.health_checks[name] = health_check
        
        logger.debug(f"Registered health check: {name}")
        
        return health_check
    
    def get_health_check(self, name: str) -> Optional[HealthCheck]:
        """
        Get a health check by name.
        
        Args:
            name: Health check name
            
        Returns:
            Health check instance, or None if not found
        """
        return self.health_checks.get(name)
    
    def get_all_health_checks(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all health checks.
        
        Returns:
            Dictionary of health checks
        """
        return {name: health_check.to_dict() for name, health_check in self.health_checks.items()}
    
    def get_overall_status(self) -> HealthStatus:
        """
        Get the overall health status.
        
        Returns:
            Overall health status
        """
        return self.overall_status
    
    async def start(self) -> None:
        """Start the health manager."""
        if self.running:
            logger.warning("Health Manager is already running")
            return
        
        logger.info("Starting Health Manager")
        
        # Start health check task
        check_interval = self.config.get("monitoring.health.check_interval", 60)
        self._check_task = asyncio.create_task(self._health_check_task(check_interval))
        
        self.running = True
        logger.info("Health Manager started")
    
    async def stop(self) -> None:
        """Stop the health manager."""
        if not self.running:
            logger.warning("Health Manager is not running")
            return
        
        logger.info("Stopping Health Manager")
        
        # Cancel health check task
        if self._check_task:
            self._check_task.cancel()
            try:
                await self._check_task
            except asyncio.CancelledError:
                pass
        
        self.running = False
        logger.info("Health Manager stopped")
    
    async def _health_check_task(self, interval: int) -> None:
        """
        Task to run health checks periodically.
        
        Args:
            interval: Check interval in seconds
        """
        while True:
            try:
                # Run health checks
                await self._run_health_checks()
                
                # Wait for the next check
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                logger.debug("Health check task cancelled")
                break
            except Exception as e:
                logger.error(f"Error running health checks: {e}")
                await asyncio.sleep(10)  # Wait a bit before retrying
    
    async def _run_health_checks(self) -> None:
        """Run all health checks."""
        # Run all health checks
        tasks = []
        
        for health_check in self.health_checks.values():
            task = asyncio.create_task(health_check.run())
            tasks.append(task)
        
        # Wait for all health checks to complete
        await asyncio.gather(*tasks)
        
        # Update overall status
        if any(health_check.status == HealthStatus.UNHEALTHY for health_check in self.health_checks.values()):
            self.overall_status = HealthStatus.UNHEALTHY
        elif any(health_check.status == HealthStatus.DEGRADED for health_check in self.health_checks.values()):
            self.overall_status = HealthStatus.DEGRADED
        else:
            self.overall_status = HealthStatus.HEALTHY
        
        # Log overall status
        logger.info(f"Overall health status: {self.overall_status.value}")
        
        # Export health status if configured
        export_file = self.config.get("monitoring.health.export_file")
        
        if export_file:
            try:
                health_status = {
                    "overall_status": self.overall_status.value,
                    "health_checks": self.get_all_health_checks(),
                    "timestamp": time.time()
                }
                
                with open(export_file, "w") as f:
                    json.dump(health_status, f, indent=2)
                
                logger.debug(f"Exported health status to file: {export_file}")
            except Exception as e:
                logger.error(f"Error exporting health status to file: {e}")
