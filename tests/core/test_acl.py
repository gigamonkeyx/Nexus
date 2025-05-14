#!/usr/bin/env python3
"""
Tests for the access control list.

This module contains tests for the Nexus MCP Hub access control list.
"""

import pytest
from src.nexus.core.security import AccessControlList, Permission, Resource, Role

class TestResource:
    """Tests for the Resource class."""
    
    def test_resource_creation(self):
        """Test creating a resource."""
        # Create a resource
        resource = Resource("server", "test-server")
        
        # Check that the resource was created correctly
        assert resource.resource_type == "server"
        assert resource.resource_id == "test-server"
    
    def test_resource_string_representation(self):
        """Test the string representation of a resource."""
        # Create a resource
        resource = Resource("server", "test-server")
        
        # Check the string representation
        assert str(resource) == "server:test-server"
    
    def test_resource_equality(self):
        """Test resource equality."""
        # Create two identical resources
        resource1 = Resource("server", "test-server")
        resource2 = Resource("server", "test-server")
        
        # Check that they are equal
        assert resource1 == resource2
        
        # Create a different resource
        resource3 = Resource("server", "other-server")
        
        # Check that they are not equal
        assert resource1 != resource3
    
    def test_resource_matching(self):
        """Test resource matching."""
        # Create a wildcard resource (all servers)
        wildcard = Resource("server")
        
        # Create a specific resource
        specific = Resource("server", "test-server")
        
        # Check that the wildcard matches the specific resource
        assert wildcard.matches(specific)
        
        # Check that the specific resource doesn't match the wildcard
        assert not specific.matches(wildcard)
        
        # Create a resource of a different type
        different_type = Resource("client", "test-client")
        
        # Check that they don't match
        assert not wildcard.matches(different_type)
        assert not specific.matches(different_type)

class TestRole:
    """Tests for the Role class."""
    
    def test_role_creation(self):
        """Test creating a role."""
        # Create a role
        role = Role("admin", "Administrator role")
        
        # Check that the role was created correctly
        assert role.name == "admin"
        assert role.description == "Administrator role"
        assert role.permissions == {}
    
    def test_add_permission(self):
        """Test adding a permission to a role."""
        # Create a role
        role = Role("admin")
        
        # Create a resource
        resource = Resource("server", "test-server")
        
        # Add a permission
        role.add_permission(resource, Permission.SERVER_VIEW)
        
        # Check that the permission was added
        assert resource in role.permissions
        assert Permission.SERVER_VIEW in role.permissions[resource]
    
    def test_remove_permission(self):
        """Test removing a permission from a role."""
        # Create a role
        role = Role("admin")
        
        # Create a resource
        resource = Resource("server", "test-server")
        
        # Add a permission
        role.add_permission(resource, Permission.SERVER_VIEW)
        
        # Remove the permission
        role.remove_permission(resource, Permission.SERVER_VIEW)
        
        # Check that the permission was removed
        assert resource not in role.permissions
    
    def test_has_permission(self):
        """Test checking if a role has a permission."""
        # Create a role
        role = Role("admin")
        
        # Create resources
        all_servers = Resource("server")
        specific_server = Resource("server", "test-server")
        
        # Add permissions
        role.add_permission(all_servers, Permission.SERVER_VIEW)
        
        # Check permissions
        assert role.has_permission(specific_server, Permission.SERVER_VIEW)
        assert not role.has_permission(specific_server, Permission.SERVER_MODIFY)
    
    def test_to_dict(self):
        """Test converting a role to a dictionary."""
        # Create a role
        role = Role("admin", "Administrator role")
        
        # Add permissions
        role.add_permission(Resource("server"), Permission.SERVER_VIEW)
        role.add_permission(Resource("server"), Permission.SERVER_MODIFY)
        
        # Convert to dictionary
        role_dict = role.to_dict()
        
        # Check the dictionary
        assert role_dict["name"] == "admin"
        assert role_dict["description"] == "Administrator role"
        assert "permissions" in role_dict
        assert "server" in role_dict["permissions"]
        assert "SERVER_VIEW" in role_dict["permissions"]["server"]
        assert "SERVER_MODIFY" in role_dict["permissions"]["server"]
    
    def test_from_dict(self):
        """Test creating a role from a dictionary."""
        # Create a role dictionary
        role_dict = {
            "name": "admin",
            "description": "Administrator role",
            "permissions": {
                "server": ["SERVER_VIEW", "SERVER_MODIFY"],
                "client:test-client": ["CLIENT_VIEW"]
            }
        }
        
        # Create a role from the dictionary
        role = Role.from_dict(role_dict)
        
        # Check the role
        assert role.name == "admin"
        assert role.description == "Administrator role"
        assert role.has_permission(Resource("server"), Permission.SERVER_VIEW)
        assert role.has_permission(Resource("server"), Permission.SERVER_MODIFY)
        assert role.has_permission(Resource("client", "test-client"), Permission.CLIENT_VIEW)

class TestAccessControlList:
    """Tests for the AccessControlList class."""
    
    def test_add_role(self, access_control_list):
        """Test adding a role to the ACL."""
        # Create a role
        role = Role("test-role", "Test role")
        
        # Add the role to the ACL
        access_control_list.add_role(role)
        
        # Check that the role was added
        assert "test-role" in access_control_list.roles
        assert access_control_list.roles["test-role"] is role
    
    def test_remove_role(self, access_control_list):
        """Test removing a role from the ACL."""
        # Create a role
        role = Role("test-role", "Test role")
        
        # Add the role to the ACL
        access_control_list.add_role(role)
        
        # Remove the role
        removed = access_control_list.remove_role("test-role")
        
        # Check that the role was removed
        assert removed is True
        assert "test-role" not in access_control_list.roles
    
    def test_assign_role(self, access_control_list):
        """Test assigning a role to a user."""
        # Create a role
        role = Role("test-role", "Test role")
        
        # Add the role to the ACL
        access_control_list.add_role(role)
        
        # Assign the role to a user
        assigned = access_control_list.assign_role("testuser", "test-role")
        
        # Check that the role was assigned
        assert assigned is True
        assert "testuser" in access_control_list.user_roles
        assert "test-role" in access_control_list.user_roles["testuser"]
    
    def test_revoke_role(self, access_control_list):
        """Test revoking a role from a user."""
        # Create a role
        role = Role("test-role", "Test role")
        
        # Add the role to the ACL
        access_control_list.add_role(role)
        
        # Assign the role to a user
        access_control_list.assign_role("testuser", "test-role")
        
        # Revoke the role
        revoked = access_control_list.revoke_role("testuser", "test-role")
        
        # Check that the role was revoked
        assert revoked is True
        assert "testuser" not in access_control_list.user_roles
    
    def test_get_user_roles(self, access_control_list):
        """Test getting the roles assigned to a user."""
        # Create roles
        role1 = Role("role1", "Role 1")
        role2 = Role("role2", "Role 2")
        
        # Add the roles to the ACL
        access_control_list.add_role(role1)
        access_control_list.add_role(role2)
        
        # Assign the roles to a user
        access_control_list.assign_role("testuser", "role1")
        access_control_list.assign_role("testuser", "role2")
        
        # Get the user's roles
        roles = access_control_list.get_user_roles("testuser")
        
        # Check the roles
        assert len(roles) == 2
        assert "role1" in roles
        assert "role2" in roles
    
    def test_has_permission(self, access_control_list):
        """Test checking if a user has a permission."""
        # Create a role
        role = Role("test-role", "Test role")
        
        # Add permissions to the role
        role.add_permission(Resource("server"), Permission.SERVER_VIEW)
        
        # Add the role to the ACL
        access_control_list.add_role(role)
        
        # Assign the role to a user
        access_control_list.assign_role("testuser", "test-role")
        
        # Check permissions
        assert access_control_list.has_permission("testuser", Resource("server", "test-server"), Permission.SERVER_VIEW)
        assert not access_control_list.has_permission("testuser", Resource("server", "test-server"), Permission.SERVER_MODIFY)
