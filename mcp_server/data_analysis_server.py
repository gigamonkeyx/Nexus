#!/usr/bin/env python3
"""
Data Analysis MCP Server

This server provides tools for analyzing and visualizing data through the Model Context Protocol.
"""

import os
import sys
import logging
import json
import uuid
import base64
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field

from mcp.server.fastmcp import FastMCP, Context, Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("data_analysis_server")

# Data models
@dataclass
class Dataset:
    """Dataset with data and metadata."""
    id: str
    name: str
    data: List[Dict[str, Any]]
    columns: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "data": self.data,
            "columns": self.columns,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Dataset":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            name=data["name"],
            data=data["data"],
            columns=data["columns"],
            metadata=data.get("metadata", {}),
        )

@dataclass
class DatasetStore:
    """Store for datasets."""
    datasets: Dict[str, Dataset] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "datasets": {id: dataset.to_dict() for id, dataset in self.datasets.items()},
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DatasetStore":
        """Create from dictionary."""
        store = cls()
        for id, dataset_data in data.get("datasets", {}).items():
            store.datasets[id] = Dataset.from_dict(dataset_data)
        return store
    
    def save(self, filename: str) -> None:
        """Save to file."""
        with open(filename, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filename: str) -> "DatasetStore":
        """Load from file."""
        if not os.path.exists(filename):
            return cls()
        with open(filename, "r") as f:
            data = json.load(f)
        return cls.from_dict(data)

# Initialize the dataset store
STORE_FILE = "dataset_store.json"
dataset_store = DatasetStore.load(STORE_FILE)

# Initialize the MCP server
mcp = FastMCP()

# Helper functions
def parse_csv(csv_content: str) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Parse CSV content (simplified for demo)."""
    # In a real implementation, you would use a library like pandas
    # For this demo, we'll use a simple parser
    lines = csv_content.strip().split("\n")
    if not lines:
        return [], []
    
    # Parse header
    header = [col.strip() for col in lines[0].split(",")]
    
    # Parse data
    data = []
    for line in lines[1:]:
        values = [val.strip() for val in line.split(",")]
        row = {}
        for i, col in enumerate(header):
            if i < len(values):
                # Try to convert to number if possible
                try:
                    if "." in values[i]:
                        row[col] = float(values[i])
                    else:
                        row[col] = int(values[i])
                except ValueError:
                    row[col] = values[i]
            else:
                row[col] = ""
        data.append(row)
    
    return header, data

def calculate_statistics(data: List[Dict[str, Any]], columns: List[str]) -> Dict[str, Dict[str, Any]]:
    """Calculate statistics for numeric columns."""
    stats = {}
    
    for col in columns:
        # Check if column has numeric values
        values = [row[col] for row in data if col in row and isinstance(row[col], (int, float))]
        if not values:
            continue
        
        # Calculate statistics
        stats[col] = {
            "min": min(values),
            "max": max(values),
            "mean": sum(values) / len(values),
            "count": len(values),
        }
    
    return stats

def generate_chart_ascii(data: List[Dict[str, Any]], x_col: str, y_col: str, chart_type: str = "bar") -> str:
    """Generate an ASCII chart (simplified for demo)."""
    # In a real implementation, you would use a library like matplotlib and return an image
    # For this demo, we'll return a simple ASCII chart
    if chart_type == "bar":
        chart = f"ASCII Bar Chart: {x_col} vs {y_col}\n"
        chart += "-" * 50 + "\n"
        
        # Extract data points
        points = [(row[x_col], row[y_col]) for row in data if x_col in row and y_col in row]
        
        # Sort by x value
        points.sort(key=lambda p: p[0])
        
        # Generate bars
        max_y = max(p[1] for p in points) if points else 0
        for x, y in points:
            bar_length = int((y / max_y) * 40) if max_y > 0 else 0
            chart += f"{x}: {'#' * bar_length} {y}\n"
        
        return chart
    
    elif chart_type == "line":
        chart = f"ASCII Line Chart: {x_col} vs {y_col}\n"
        chart += "-" * 50 + "\n"
        
        # Extract data points
        points = [(row[x_col], row[y_col]) for row in data if x_col in row and y_col in row]
        
        # Sort by x value
        points.sort(key=lambda p: p[0])
        
        # Generate line
        for i, (x, y) in enumerate(points):
            if i > 0:
                chart += f"{x}: {'-' * (i*2)}o {y}\n"
            else:
                chart += f"{x}: o {y}\n"
        
        return chart
    
    else:
        return f"Unsupported chart type: {chart_type}"

def train_simple_model(data: List[Dict[str, Any]], target_col: str, feature_cols: List[str]) -> Dict[str, Any]:
    """Train a simple linear regression model (simplified for demo)."""
    # In a real implementation, you would use a library like scikit-learn
    # For this demo, we'll return a placeholder
    return {
        "model_type": "linear_regression",
        "target": target_col,
        "features": feature_cols,
        "coefficients": {col: 0.5 for col in feature_cols},
        "intercept": 1.0,
        "r_squared": 0.75,
    }

# Tools
@mcp.tool("upload_dataset")
def upload_dataset(name: str, data_csv: str) -> Dict[str, Any]:
    """Upload a dataset from CSV content."""
    try:
        columns, data = parse_csv(data_csv)
        
        if not columns:
            return {
                "error": "Failed to parse CSV: No columns found",
                "success": False,
            }
        
        # Create dataset
        dataset_id = str(uuid.uuid4())
        dataset = Dataset(
            id=dataset_id,
            name=name,
            data=data,
            columns=columns,
            metadata={
                "row_count": len(data),
                "column_count": len(columns),
                "upload_time": "2023-06-15T12:00:00Z",  # In a real implementation, use actual timestamp
            },
        )
        
        # Store dataset
        dataset_store.datasets[dataset_id] = dataset
        
        # Save the updated store
        dataset_store.save(STORE_FILE)
        
        return {
            "id": dataset_id,
            "name": name,
            "columns": columns,
            "row_count": len(data),
            "success": True,
        }
    except Exception as e:
        logger.error(f"Error uploading dataset: {e}")
        return {
            "error": f"Failed to upload dataset: {str(e)}",
            "success": False,
        }

@mcp.tool("analyze_dataset")
def analyze_dataset(dataset_id: str) -> Dict[str, Any]:
    """Analyze a dataset and provide statistics."""
    if dataset_id not in dataset_store.datasets:
        return {
            "error": f"Dataset '{dataset_id}' not found",
            "success": False,
        }
    
    dataset = dataset_store.datasets[dataset_id]
    
    # Calculate statistics
    stats = calculate_statistics(dataset.data, dataset.columns)
    
    # Count unique values for non-numeric columns
    unique_counts = {}
    for col in dataset.columns:
        if col not in stats:
            values = [row[col] for row in dataset.data if col in row]
            unique_values = set(values)
            unique_counts[col] = {
                "count": len(values),
                "unique_count": len(unique_values),
                "most_common": max(unique_values, key=values.count) if unique_values else None,
            }
    
    return {
        "id": dataset_id,
        "name": dataset.name,
        "row_count": len(dataset.data),
        "column_count": len(dataset.columns),
        "columns": dataset.columns,
        "numeric_stats": stats,
        "categorical_stats": unique_counts,
        "success": True,
    }

@mcp.tool("generate_chart")
def generate_chart(dataset_id: str, x_column: str, y_column: str, chart_type: str = "bar") -> Dict[str, Any]:
    """Generate a chart from data."""
    if dataset_id not in dataset_store.datasets:
        return {
            "error": f"Dataset '{dataset_id}' not found",
            "success": False,
        }
    
    dataset = dataset_store.datasets[dataset_id]
    
    # Check if columns exist
    if x_column not in dataset.columns:
        return {
            "error": f"Column '{x_column}' not found in dataset",
            "success": False,
        }
    
    if y_column not in dataset.columns:
        return {
            "error": f"Column '{y_column}' not found in dataset",
            "success": False,
        }
    
    # Generate chart
    chart = generate_chart_ascii(dataset.data, x_column, y_column, chart_type)
    
    return {
        "chart": chart,
        "dataset_id": dataset_id,
        "x_column": x_column,
        "y_column": y_column,
        "chart_type": chart_type,
        "success": True,
    }

@mcp.tool("predict_values")
def predict_values(dataset_id: str, target_column: str, feature_columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """Predict values using machine learning."""
    if dataset_id not in dataset_store.datasets:
        return {
            "error": f"Dataset '{dataset_id}' not found",
            "success": False,
        }
    
    dataset = dataset_store.datasets[dataset_id]
    
    # Check if target column exists
    if target_column not in dataset.columns:
        return {
            "error": f"Target column '{target_column}' not found in dataset",
            "success": False,
        }
    
    # Use all columns except target as features if not specified
    if feature_columns is None:
        feature_columns = [col for col in dataset.columns if col != target_column]
    
    # Check if feature columns exist
    for col in feature_columns:
        if col not in dataset.columns:
            return {
                "error": f"Feature column '{col}' not found in dataset",
                "success": False,
            }
    
    # Train model
    model = train_simple_model(dataset.data, target_column, feature_columns)
    
    return {
        "model": model,
        "dataset_id": dataset_id,
        "target_column": target_column,
        "feature_columns": feature_columns,
        "success": True,
    }

@mcp.tool("delete_dataset")
def delete_dataset(dataset_id: str) -> Dict[str, Any]:
    """Delete a dataset."""
    if dataset_id not in dataset_store.datasets:
        return {
            "error": f"Dataset '{dataset_id}' not found",
            "success": False,
        }
    
    del dataset_store.datasets[dataset_id]
    
    # Save the updated store
    dataset_store.save(STORE_FILE)
    
    return {
        "id": dataset_id,
        "success": True,
    }

# Resources
@mcp.resource("datasets")
def get_datasets() -> Dict[str, Any]:
    """Get all datasets."""
    return {
        "datasets": [
            {
                "id": id,
                "name": dataset.name,
                "row_count": len(dataset.data),
                "column_count": len(dataset.columns),
            }
            for id, dataset in dataset_store.datasets.items()
        ],
    }

@mcp.resource("dataset/{id}")
def get_dataset(id: str) -> Dict[str, Any]:
    """Get a specific dataset."""
    if id not in dataset_store.datasets:
        return {"error": f"Dataset '{id}' not found"}
    
    dataset = dataset_store.datasets[id]
    
    # Limit data to first 10 rows for preview
    preview_data = dataset.data[:10] if len(dataset.data) > 10 else dataset.data
    
    return {
        "id": dataset.id,
        "name": dataset.name,
        "columns": dataset.columns,
        "row_count": len(dataset.data),
        "preview": preview_data,
        "metadata": dataset.metadata,
    }

if __name__ == "__main__":
    # Get port and host from environment variables
    port = int(os.environ.get("PORT", 8004))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info(f"Starting Data Analysis MCP Server on {host}:{port}")

    # Run the server
    mcp.run(host=host, port=port)
