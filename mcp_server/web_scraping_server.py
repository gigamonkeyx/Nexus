#!/usr/bin/env python3
"""
Web Scraping MCP Server

This server provides tools for scraping and processing web content through the Model Context Protocol.
"""

import os
import sys
import logging
import json
import re
import uuid
import time
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime

from mcp.server.fastmcp import FastMCP, Context, Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("web_scraping_server")

# Data models
@dataclass
class WebPage:
    """Web page with content and metadata."""
    id: str
    url: str
    title: str
    content: str
    html: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "url": self.url,
            "title": self.title,
            "content": self.content,
            "html": self.html,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WebPage":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            url=data["url"],
            title=data["title"],
            content=data["content"],
            html=data["html"],
            metadata=data.get("metadata", {}),
        )

@dataclass
class WebPageStore:
    """Store for web pages."""
    pages: Dict[str, WebPage] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "pages": {id: page.to_dict() for id, page in self.pages.items()},
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WebPageStore":
        """Create from dictionary."""
        store = cls()
        for id, page_data in data.get("pages", {}).items():
            store.pages[id] = WebPage.from_dict(page_data)
        return store
    
    def save(self, filename: str) -> None:
        """Save to file."""
        with open(filename, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filename: str) -> "WebPageStore":
        """Load from file."""
        if not os.path.exists(filename):
            return cls()
        with open(filename, "r") as f:
            data = json.load(f)
        return cls.from_dict(data)

@dataclass
class MonitoredPage:
    """Web page being monitored for changes."""
    id: str
    url: str
    frequency: str  # "hourly", "daily", "weekly"
    last_checked: str  # ISO format datetime
    last_content: str
    last_hash: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "url": self.url,
            "frequency": self.frequency,
            "last_checked": self.last_checked,
            "last_content": self.last_content,
            "last_hash": self.last_hash,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MonitoredPage":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            url=data["url"],
            frequency=data["frequency"],
            last_checked=data["last_checked"],
            last_content=data["last_content"],
            last_hash=data["last_hash"],
        )

@dataclass
class MonitorStore:
    """Store for monitored pages."""
    pages: Dict[str, MonitoredPage] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "pages": {id: page.to_dict() for id, page in self.pages.items()},
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MonitorStore":
        """Create from dictionary."""
        store = cls()
        for id, page_data in data.get("pages", {}).items():
            store.pages[id] = MonitoredPage.from_dict(page_data)
        return store
    
    def save(self, filename: str) -> None:
        """Save to file."""
        with open(filename, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filename: str) -> "MonitorStore":
        """Load from file."""
        if not os.path.exists(filename):
            return cls()
        with open(filename, "r") as f:
            data = json.load(f)
        return cls.from_dict(data)

# Initialize the stores
PAGE_STORE_FILE = "web_page_store.json"
MONITOR_STORE_FILE = "monitor_store.json"
page_store = WebPageStore.load(PAGE_STORE_FILE)
monitor_store = MonitorStore.load(MONITOR_STORE_FILE)

# Initialize the MCP server
mcp = FastMCP()

# Helper functions
def scrape_webpage(url: str) -> Dict[str, Any]:
    """Scrape a webpage (simplified for demo)."""
    # In a real implementation, you would use a library like requests and BeautifulSoup
    # For this demo, we'll return a placeholder
    
    # Generate a simple hash of the URL for demo purposes
    import hashlib
    url_hash = hashlib.md5(url.encode()).hexdigest()
    
    # Generate a title based on the URL
    title = url.split("//")[-1].split("/")[0].capitalize() + " - Demo Page"
    
    # Generate some content based on the URL
    content = f"This is a demo page for {url}. In a real implementation, this would contain the actual content scraped from the webpage."
    
    # Generate some HTML based on the URL
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
</head>
<body>
    <h1>{title}</h1>
    <p>{content}</p>
    <p>URL: {url}</p>
    <p>Generated for demo purposes.</p>
</body>
</html>"""
    
    return {
        "url": url,
        "title": title,
        "content": content,
        "html": html,
        "metadata": {
            "scrape_time": datetime.now().isoformat(),
            "hash": url_hash,
        },
    }

def extract_structured_data(html: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    """Extract structured data from HTML (simplified for demo)."""
    # In a real implementation, you would use a library like BeautifulSoup
    # For this demo, we'll use simple regex patterns based on the schema
    
    data = {}
    
    for field, pattern in schema.items():
        match = re.search(pattern, html)
        if match:
            data[field] = match.group(1)
        else:
            data[field] = None
    
    return data

def calculate_content_hash(content: str) -> str:
    """Calculate a hash of the content."""
    import hashlib
    return hashlib.md5(content.encode()).hexdigest()

# Tools
@mcp.tool("scrape_webpage")
def scrape_webpage_tool(url: str) -> Dict[str, Any]:
    """Scrape content from a webpage."""
    try:
        # Scrape the webpage
        result = scrape_webpage(url)
        
        # Store the page
        page_id = str(uuid.uuid4())
        page = WebPage(
            id=page_id,
            url=url,
            title=result["title"],
            content=result["content"],
            html=result["html"],
            metadata=result["metadata"],
        )
        page_store.pages[page_id] = page
        
        # Save the updated store
        page_store.save(PAGE_STORE_FILE)
        
        return {
            "id": page_id,
            "url": url,
            "title": result["title"],
            "content_preview": result["content"][:100] + "..." if len(result["content"]) > 100 else result["content"],
            "success": True,
        }
    except Exception as e:
        logger.error(f"Error scraping webpage: {e}")
        return {
            "error": f"Failed to scrape webpage: {str(e)}",
            "success": False,
        }

@mcp.tool("extract_structured_data")
def extract_structured_data_tool(page_id: str, schema: Dict[str, str]) -> Dict[str, Any]:
    """Extract structured data from HTML."""
    if page_id not in page_store.pages:
        return {
            "error": f"Page '{page_id}' not found",
            "success": False,
        }
    
    page = page_store.pages[page_id]
    
    try:
        # Extract structured data
        data = extract_structured_data(page.html, schema)
        
        return {
            "page_id": page_id,
            "url": page.url,
            "data": data,
            "success": True,
        }
    except Exception as e:
        logger.error(f"Error extracting structured data: {e}")
        return {
            "error": f"Failed to extract structured data: {str(e)}",
            "success": False,
        }

@mcp.tool("monitor_webpage")
def monitor_webpage_tool(url: str, frequency: str = "daily") -> Dict[str, Any]:
    """Monitor a webpage for changes."""
    try:
        # Validate frequency
        if frequency not in ["hourly", "daily", "weekly"]:
            return {
                "error": f"Invalid frequency: {frequency}. Must be one of: hourly, daily, weekly",
                "success": False,
            }
        
        # Scrape the webpage
        result = scrape_webpage(url)
        
        # Calculate hash of content
        content_hash = calculate_content_hash(result["content"])
        
        # Create or update monitored page
        page_id = str(uuid.uuid4())
        for id, page in monitor_store.pages.items():
            if page.url == url:
                page_id = id
                break
        
        monitored_page = MonitoredPage(
            id=page_id,
            url=url,
            frequency=frequency,
            last_checked=datetime.now().isoformat(),
            last_content=result["content"],
            last_hash=content_hash,
        )
        
        monitor_store.pages[page_id] = monitored_page
        
        # Save the updated store
        monitor_store.save(MONITOR_STORE_FILE)
        
        return {
            "id": page_id,
            "url": url,
            "frequency": frequency,
            "success": True,
        }
    except Exception as e:
        logger.error(f"Error monitoring webpage: {e}")
        return {
            "error": f"Failed to monitor webpage: {str(e)}",
            "success": False,
        }

@mcp.tool("check_monitored_pages")
def check_monitored_pages_tool() -> Dict[str, Any]:
    """Check all monitored pages for changes."""
    try:
        changes = []
        errors = []
        
        for id, page in monitor_store.pages.items():
            try:
                # Determine if we should check this page
                last_checked = datetime.fromisoformat(page.last_checked)
                now = datetime.now()
                
                should_check = False
                if page.frequency == "hourly":
                    should_check = (now - last_checked).total_seconds() >= 3600
                elif page.frequency == "daily":
                    should_check = (now - last_checked).total_seconds() >= 86400
                elif page.frequency == "weekly":
                    should_check = (now - last_checked).total_seconds() >= 604800
                
                if should_check:
                    # Scrape the webpage
                    result = scrape_webpage(page.url)
                    
                    # Calculate hash of content
                    content_hash = calculate_content_hash(result["content"])
                    
                    # Check if content has changed
                    if content_hash != page.last_hash:
                        changes.append({
                            "id": id,
                            "url": page.url,
                            "old_content": page.last_content,
                            "new_content": result["content"],
                        })
                        
                        # Update monitored page
                        page.last_checked = now.isoformat()
                        page.last_content = result["content"]
                        page.last_hash = content_hash
                    else:
                        # Update last checked time
                        page.last_checked = now.isoformat()
            except Exception as e:
                errors.append({
                    "id": id,
                    "url": page.url,
                    "error": str(e),
                })
        
        # Save the updated store
        monitor_store.save(MONITOR_STORE_FILE)
        
        return {
            "changes": changes,
            "errors": errors,
            "success": True,
        }
    except Exception as e:
        logger.error(f"Error checking monitored pages: {e}")
        return {
            "error": f"Failed to check monitored pages: {str(e)}",
            "success": False,
        }

@mcp.tool("delete_monitored_page")
def delete_monitored_page_tool(page_id: str) -> Dict[str, Any]:
    """Delete a monitored page."""
    if page_id not in monitor_store.pages:
        return {
            "error": f"Monitored page '{page_id}' not found",
            "success": False,
        }
    
    url = monitor_store.pages[page_id].url
    del monitor_store.pages[page_id]
    
    # Save the updated store
    monitor_store.save(MONITOR_STORE_FILE)
    
    return {
        "id": page_id,
        "url": url,
        "success": True,
    }

# Resources
@mcp.resource("pages")
def get_pages() -> Dict[str, Any]:
    """Get all scraped pages."""
    return {
        "pages": [
            {
                "id": id,
                "url": page.url,
                "title": page.title,
                "content_preview": page.content[:100] + "..." if len(page.content) > 100 else page.content,
            }
            for id, page in page_store.pages.items()
        ],
    }

@mcp.resource("page/{id}")
def get_page(id: str) -> Dict[str, Any]:
    """Get a specific scraped page."""
    if id not in page_store.pages:
        return {"error": f"Page '{id}' not found"}
    
    page = page_store.pages[id]
    
    return {
        "id": page.id,
        "url": page.url,
        "title": page.title,
        "content": page.content,
        "html": page.html,
        "metadata": page.metadata,
    }

@mcp.resource("monitored_pages")
def get_monitored_pages() -> Dict[str, Any]:
    """Get all monitored pages."""
    return {
        "pages": [
            {
                "id": id,
                "url": page.url,
                "frequency": page.frequency,
                "last_checked": page.last_checked,
            }
            for id, page in monitor_store.pages.items()
        ],
    }

@mcp.resource("monitored_page/{id}")
def get_monitored_page(id: str) -> Dict[str, Any]:
    """Get a specific monitored page."""
    if id not in monitor_store.pages:
        return {"error": f"Monitored page '{id}' not found"}
    
    page = monitor_store.pages[id]
    
    return {
        "id": page.id,
        "url": page.url,
        "frequency": page.frequency,
        "last_checked": page.last_checked,
        "last_content": page.last_content,
        "last_hash": page.last_hash,
    }

if __name__ == "__main__":
    # Get port and host from environment variables
    port = int(os.environ.get("PORT", 8006))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info(f"Starting Web Scraping MCP Server on {host}:{port}")

    # Run the server
    mcp.run(host=host, port=port)
