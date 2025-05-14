"""Core functionality for Nexus MCP Hub."""

from .config import ConfigManager, get_config_manager, initialize_config_manager
from .hub import HubManager, ServerManager, ClientManager, ServerRegistry
from .protocol import (
    Protocol, Request, Response, Notification, Error,
    ClientProtocol, ServerProtocol,
    Transport, StdioTransport, HttpSseTransport
)
from .server import McpServerInterface, McpServerConnection
from .client import McpClientInterface, McpClientConnection
from .router import MessageRouter, Route, RouteType, RouteTarget
from .security import (
    AuthManager, AuthProvider, BasicAuthProvider, TokenAuthProvider,
    AccessControlList, Permission, Resource, Role
)
from .monitoring import (
    MetricsManager, Metric, MetricType,
    HealthManager, HealthCheck, HealthStatus,
    setup_logging, get_logger
)

__all__ = [
    "ConfigManager", "get_config_manager", "initialize_config_manager",
    "HubManager", "ServerManager", "ClientManager", "ServerRegistry",
    "Protocol", "Request", "Response", "Notification", "Error",
    "ClientProtocol", "ServerProtocol",
    "Transport", "StdioTransport", "HttpSseTransport",
    "McpServerInterface", "McpServerConnection",
    "McpClientInterface", "McpClientConnection",
    "MessageRouter", "Route", "RouteType", "RouteTarget",
    "AuthManager", "AuthProvider", "BasicAuthProvider", "TokenAuthProvider",
    "AccessControlList", "Permission", "Resource", "Role",
    "MetricsManager", "Metric", "MetricType",
    "HealthManager", "HealthCheck", "HealthStatus",
    "setup_logging", "get_logger"
]
