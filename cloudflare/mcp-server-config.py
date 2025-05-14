"""
MCP Server configuration for Cloudflare integration.
This file contains the essential configuration for connecting your MCP server to Cloudflare.
"""
import os

# Cloudflare configuration
CLOUDFLARE_TUNNEL_URL = os.environ.get("CLOUDFLARE_TUNNEL_URL", "https://docs-library.yourdomain.com")
API_KEY = os.environ.get("API_KEY", "your-secret-api-key")

# CORS configuration for Cloudflare Pages
ALLOWED_ORIGINS = [
    "https://documentation-library-ui.pages.dev",  # Replace with your actual Cloudflare Pages domain
    CLOUDFLARE_TUNNEL_URL,
    "http://localhost:3000"  # For local development
]

# Configure CORS middleware for MCP server
def configure_cors_middleware(mcp_app):
    """
    Configure CORS middleware for the MCP server to work with Cloudflare Pages.
    
    Args:
        mcp_app: The MCP server application instance
    """
    @mcp_app.middleware
    async def cors_middleware(request, call_next):
        response = await call_next(request)
        
        # Get origin from request
        origin = request.headers.get("Origin", "")
        
        # Check if origin is allowed
        if origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
        else:
            response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]
            
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response

# Configure authentication middleware for MCP server
def configure_auth_middleware(mcp_app):
    """
    Configure authentication middleware for the MCP server.
    
    Args:
        mcp_app: The MCP server application instance
    """
    @mcp_app.middleware
    async def auth_middleware(request, call_next):
        # Skip authentication for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Check if request has valid API key
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return {"error": "Unauthorized"}, 401
        
        token = auth_header.split(" ")[1]
        if token != API_KEY:
            return {"error": "Invalid API key"}, 401
        
        return await call_next(request)
