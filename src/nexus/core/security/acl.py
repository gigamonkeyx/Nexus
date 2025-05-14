#!/usr/bin/env python3
"""
Access Control module for Nexus MCP Hub.

This module provides access control functionality for the Nexus MCP Hub,
including roles, permissions, and access control lists.
"""

import logging
import json
import os
from typing import Dict, List, Optional, Any, Set, Union
from enum import Enum, auto

from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class Permission(Enum):
    """Permission types for access control."""
    
    # Server permissions
    SERVER_VIEW = auto()
    SERVER_CREATE = auto()
    SERVER_MODIFY = auto()
    SERVER_DELETE = auto()
    SERVER_START = auto()
    SERVER_STOP = auto()
    
    # Client permissions
    CLIENT_VIEW = auto()
    CLIENT_CREATE = auto()
    CLIENT_MODIFY = auto()
    CLIENT_DELETE = auto()
    
    # Resource permissions
    RESOURCE_VIEW = auto()
    RESOURCE_CREATE = auto()
    RESOURCE_MODIFY = auto()
    RESOURCE_DELETE = auto()
    
    # Tool permissions
    TOOL_VIEW = auto()
    TOOL_CALL = auto()
    
    # Prompt permissions
    PROMPT_VIEW = auto()
    PROMPT_USE = auto()
    
    # Sampling permissions
    SAMPLING_REQUEST = auto()
    
    # Router permissions
    ROUTER_VIEW = auto()
    ROUTER_MODIFY = auto()
    
    # Admin permissions
    ADMIN_VIEW = auto()
    ADMIN_MODIFY = auto()

class Resource:
    """Resource for access control."""
    
    def __init__(self, resource_type: str, resource_id: Optional[str] = None):
        """
        Initialize a resource.
        
        Args:
            resource_type: Resource type (server, client, etc.)
            resource_id: Resource ID (None for all resources of the type)
        """
        self.resource_type = resource_type
        self.resource_id = resource_id
    
    def __str__(self) -> str:
        """Get string representation of the resource."""
        if self.resource_id:
            return f"{self.resource_type}:{self.resource_id}"
        else:
            return self.resource_type
    
    def __eq__(self, other: object) -> bool:
        """Check if two resources are equal."""
        if not isinstance(other, Resource):
            return False
        
        return (
            self.resource_type == other.resource_type and
            self.resource_id == other.resource_id
        )
    
    def __hash__(self) -> int:
        """Get hash of the resource."""
        return hash((self.resource_type, self.resource_id))
    
    def matches(self, other: 'Resource') -> bool:
        """
        Check if this resource matches another resource.
        
        Args:
            other: Resource to check
            
        Returns:
            True if this resource matches the other resource, False otherwise
        """
        # Check resource type
        if self.resource_type != other.resource_type:
            return False
        
        # If this resource has no ID, it matches all resources of the type
        if self.resource_id is None:
            return True
        
        # If the other resource has no ID, it doesn't match this resource
        if other.resource_id is None:
            return False
        
        # Check resource ID
        return self.resource_id == other.resource_id

class Role:
    """Role for access control."""
    
    def __init__(self, name: str, description: Optional[str] = None):
        """
        Initialize a role.
        
        Args:
            name: Role name
            description: Role description
        """
        self.name = name
        self.description = description
        self.permissions = {}  # Maps resource to set of permissions
    
    def add_permission(self, resource: Resource, permission: Permission) -> None:
        """
        Add a permission to the role.
        
        Args:
            resource: Resource to add permission for
            permission: Permission to add
        """
        if resource not in self.permissions:
            self.permissions[resource] = set()
        
        self.permissions[resource].add(permission)
    
    def remove_permission(self, resource: Resource, permission: Permission) -> None:
        """
        Remove a permission from the role.
        
        Args:
            resource: Resource to remove permission from
            permission: Permission to remove
        """
        if resource in self.permissions:
            self.permissions[resource].discard(permission)
            
            # Remove the resource if it has no permissions
            if not self.permissions[resource]:
                del self.permissions[resource]
    
    def has_permission(self, resource: Resource, permission: Permission) -> bool:
        """
        Check if the role has a permission for a resource.
        
        Args:
            resource: Resource to check permission for
            permission: Permission to check
            
        Returns:
            True if the role has the permission, False otherwise
        """
        # Check each resource in the role
        for role_resource, permissions in self.permissions.items():
            # Check if the resource matches
            if role_resource.matches(resource):
                # Check if the permission is granted
                return permission in permissions
        
        return False
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the role to a dictionary.
        
        Returns:
            Dictionary representation of the role
        """
        # Convert permissions to a serializable format
        permissions_dict = {}
        
        for resource, permissions in self.permissions.items():
            resource_str = str(resource)
            permissions_dict[resource_str] = [perm.name for perm in permissions]
        
        return {
            "name": self.name,
            "description": self.description,
            "permissions": permissions_dict
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Role':
        """
        Create a role from a dictionary.
        
        Args:
            data: Dictionary representation of the role
            
        Returns:
            Role instance
        """
        role = cls(data["name"], data.get("description"))
        
        # Parse permissions
        permissions_dict = data.get("permissions", {})
        
        for resource_str, permission_names in permissions_dict.items():
            # Parse resource
            resource_parts = resource_str.split(":", 1)
            resource_type = resource_parts[0]
            resource_id = resource_parts[1] if len(resource_parts) > 1 else None
            
            resource = Resource(resource_type, resource_id)
            
            # Add permissions
            for permission_name in permission_names:
                try:
                    permission = Permission[permission_name]
                    role.add_permission(resource, permission)
                except KeyError:
                    logger.warning(f"Unknown permission: {permission_name}")
        
        return role

class AccessControlList:
    """Access control list for the Nexus MCP Hub."""
    
    def __init__(self, roles_file: Optional[str] = None):
        """
        Initialize the access control list.
        
        Args:
            roles_file: Path to the roles file (JSON)
        """
        self.config = get_config_manager()
        self.roles_file = roles_file or self.config.get("security.roles_file", "roles.json")
        self.roles = {}  # Maps role name to Role instance
        self.user_roles = {}  # Maps username to set of role names
        
        # Initialize default roles
        self._initialize_default_roles()
        
        # Load roles
        self._load_roles()
    
    def _initialize_default_roles(self) -> None:
        """Initialize default roles."""
        # Admin role
        admin_role = Role("admin", "Administrator with full access")
        admin_role.add_permission(Resource("server"), Permission.SERVER_VIEW)
        admin_role.add_permission(Resource("server"), Permission.SERVER_CREATE)
        admin_role.add_permission(Resource("server"), Permission.SERVER_MODIFY)
        admin_role.add_permission(Resource("server"), Permission.SERVER_DELETE)
        admin_role.add_permission(Resource("server"), Permission.SERVER_START)
        admin_role.add_permission(Resource("server"), Permission.SERVER_STOP)
        admin_role.add_permission(Resource("client"), Permission.CLIENT_VIEW)
        admin_role.add_permission(Resource("client"), Permission.CLIENT_CREATE)
        admin_role.add_permission(Resource("client"), Permission.CLIENT_MODIFY)
        admin_role.add_permission(Resource("client"), Permission.CLIENT_DELETE)
        admin_role.add_permission(Resource("resource"), Permission.RESOURCE_VIEW)
        admin_role.add_permission(Resource("resource"), Permission.RESOURCE_CREATE)
        admin_role.add_permission(Resource("resource"), Permission.RESOURCE_MODIFY)
        admin_role.add_permission(Resource("resource"), Permission.RESOURCE_DELETE)
        admin_role.add_permission(Resource("tool"), Permission.TOOL_VIEW)
        admin_role.add_permission(Resource("tool"), Permission.TOOL_CALL)
        admin_role.add_permission(Resource("prompt"), Permission.PROMPT_VIEW)
        admin_role.add_permission(Resource("prompt"), Permission.PROMPT_USE)
        admin_role.add_permission(Resource("sampling"), Permission.SAMPLING_REQUEST)
        admin_role.add_permission(Resource("router"), Permission.ROUTER_VIEW)
        admin_role.add_permission(Resource("router"), Permission.ROUTER_MODIFY)
        admin_role.add_permission(Resource("admin"), Permission.ADMIN_VIEW)
        admin_role.add_permission(Resource("admin"), Permission.ADMIN_MODIFY)
        
        self.roles["admin"] = admin_role
        
        # User role
        user_role = Role("user", "Regular user with limited access")
        user_role.add_permission(Resource("server"), Permission.SERVER_VIEW)
        user_role.add_permission(Resource("client"), Permission.CLIENT_VIEW)
        user_role.add_permission(Resource("resource"), Permission.RESOURCE_VIEW)
        user_role.add_permission(Resource("tool"), Permission.TOOL_VIEW)
        user_role.add_permission(Resource("tool"), Permission.TOOL_CALL)
        user_role.add_permission(Resource("prompt"), Permission.PROMPT_VIEW)
        user_role.add_permission(Resource("prompt"), Permission.PROMPT_USE)
        user_role.add_permission(Resource("sampling"), Permission.SAMPLING_REQUEST)
        
        self.roles["user"] = user_role
        
        # Guest role
        guest_role = Role("guest", "Guest user with minimal access")
        guest_role.add_permission(Resource("server"), Permission.SERVER_VIEW)
        guest_role.add_permission(Resource("resource"), Permission.RESOURCE_VIEW)
        
        self.roles["guest"] = guest_role
    
    def _load_roles(self) -> None:
        """Load roles from the roles file."""
        if not os.path.exists(self.roles_file):
            logger.warning(f"Roles file not found: {self.roles_file}")
            return
        
        try:
            with open(self.roles_file, "r") as f:
                data = json.load(f)
            
            # Load roles
            roles_data = data.get("roles", {})
            for role_name, role_data in roles_data.items():
                self.roles[role_name] = Role.from_dict(role_data)
            
            # Load user roles
            self.user_roles = data.get("user_roles", {})
            
            logger.info(f"Loaded {len(self.roles)} roles and {len(self.user_roles)} user roles from {self.roles_file}")
        except Exception as e:
            logger.error(f"Failed to load roles from {self.roles_file}: {e}")
    
    def _save_roles(self) -> None:
        """Save roles to the roles file."""
        try:
            # Convert roles to dictionaries
            roles_data = {role_name: role.to_dict() for role_name, role in self.roles.items()}
            
            # Create data to save
            data = {
                "roles": roles_data,
                "user_roles": self.user_roles
            }
            
            with open(self.roles_file, "w") as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(self.roles)} roles and {len(self.user_roles)} user roles to {self.roles_file}")
        except Exception as e:
            logger.error(f"Failed to save roles to {self.roles_file}: {e}")
    
    def add_role(self, role: Role) -> None:
        """
        Add a role to the access control list.
        
        Args:
            role: Role to add
        """
        self.roles[role.name] = role
        logger.info(f"Added role: {role.name}")
        
        # Save roles
        self._save_roles()
    
    def remove_role(self, role_name: str) -> bool:
        """
        Remove a role from the access control list.
        
        Args:
            role_name: Role name
            
        Returns:
            True if the role was removed, False otherwise
        """
        if role_name not in self.roles:
            logger.warning(f"Role not found: {role_name}")
            return False
        
        # Remove the role
        del self.roles[role_name]
        
        # Remove the role from all users
        for username, roles in self.user_roles.items():
            if role_name in roles:
                roles.remove(role_name)
        
        logger.info(f"Removed role: {role_name}")
        
        # Save roles
        self._save_roles()
        
        return True
    
    def assign_role(self, username: str, role_name: str) -> bool:
        """
        Assign a role to a user.
        
        Args:
            username: Username
            role_name: Role name
            
        Returns:
            True if the role was assigned, False otherwise
        """
        if role_name not in self.roles:
            logger.warning(f"Role not found: {role_name}")
            return False
        
        # Initialize user roles if needed
        if username not in self.user_roles:
            self.user_roles[username] = []
        
        # Add the role if not already assigned
        if role_name not in self.user_roles[username]:
            self.user_roles[username].append(role_name)
            logger.info(f"Assigned role {role_name} to user {username}")
            
            # Save roles
            self._save_roles()
        
        return True
    
    def revoke_role(self, username: str, role_name: str) -> bool:
        """
        Revoke a role from a user.
        
        Args:
            username: Username
            role_name: Role name
            
        Returns:
            True if the role was revoked, False otherwise
        """
        if username not in self.user_roles:
            logger.warning(f"User not found: {username}")
            return False
        
        if role_name not in self.user_roles[username]:
            logger.warning(f"Role {role_name} not assigned to user {username}")
            return False
        
        # Remove the role
        self.user_roles[username].remove(role_name)
        
        # Remove the user if they have no roles
        if not self.user_roles[username]:
            del self.user_roles[username]
        
        logger.info(f"Revoked role {role_name} from user {username}")
        
        # Save roles
        self._save_roles()
        
        return True
    
    def get_user_roles(self, username: str) -> List[str]:
        """
        Get the roles assigned to a user.
        
        Args:
            username: Username
            
        Returns:
            List of role names
        """
        return self.user_roles.get(username, [])
    
    def has_permission(self, username: str, resource: Resource, permission: Permission) -> bool:
        """
        Check if a user has a permission for a resource.
        
        Args:
            username: Username
            resource: Resource to check permission for
            permission: Permission to check
            
        Returns:
            True if the user has the permission, False otherwise
        """
        # Get user roles
        role_names = self.get_user_roles(username)
        
        # Check each role
        for role_name in role_names:
            if role_name in self.roles:
                role = self.roles[role_name]
                
                if role.has_permission(resource, permission):
                    return True
        
        return False
