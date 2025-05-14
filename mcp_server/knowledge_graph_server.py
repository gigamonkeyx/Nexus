#!/usr/bin/env python3
"""
Knowledge Graph MCP Server

This server provides tools for creating, querying, and manipulating knowledge graphs
through the Model Context Protocol.
"""

import os
import sys
import logging
import json
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field

from mcp.server.fastmcp import FastMCP, Context, Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("knowledge_graph_server")

# Data models
@dataclass
class Entity:
    """Entity in the knowledge graph."""
    name: str
    entity_type: str
    observations: List[str] = field(default_factory=list)
    properties: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "entityType": self.entity_type,
            "observations": self.observations,
            "properties": self.properties,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Entity":
        """Create from dictionary."""
        return cls(
            name=data["name"],
            entity_type=data["entityType"],
            observations=data.get("observations", []),
            properties=data.get("properties", {}),
        )

@dataclass
class Relation:
    """Relation between entities in the knowledge graph."""
    from_entity: str
    to_entity: str
    relation_type: str
    properties: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "from": self.from_entity,
            "to": self.to_entity,
            "relationType": self.relation_type,
            "properties": self.properties,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Relation":
        """Create from dictionary."""
        return cls(
            from_entity=data["from"],
            to_entity=data["to"],
            relation_type=data["relationType"],
            properties=data.get("properties", {}),
        )

@dataclass
class KnowledgeGraph:
    """Knowledge graph containing entities and relations."""
    entities: Dict[str, Entity] = field(default_factory=dict)
    relations: List[Relation] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "entities": {name: entity.to_dict() for name, entity in self.entities.items()},
            "relations": [relation.to_dict() for relation in self.relations],
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "KnowledgeGraph":
        """Create from dictionary."""
        graph = cls()
        for name, entity_data in data.get("entities", {}).items():
            graph.entities[name] = Entity.from_dict(entity_data)
        for relation_data in data.get("relations", []):
            graph.relations.append(Relation.from_dict(relation_data))
        return graph
    
    def save(self, filename: str) -> None:
        """Save to file."""
        with open(filename, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filename: str) -> "KnowledgeGraph":
        """Load from file."""
        if not os.path.exists(filename):
            return cls()
        with open(filename, "r") as f:
            data = json.load(f)
        return cls.from_dict(data)

# Initialize the knowledge graph
GRAPH_FILE = "knowledge_graph.json"
knowledge_graph = KnowledgeGraph.load(GRAPH_FILE)

# Initialize the MCP server
mcp = FastMCP()

# Tools
@mcp.tool("create_entities")
def create_entities(entities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create entities in the knowledge graph."""
    created = []
    for entity_data in entities:
        entity = Entity.from_dict(entity_data)
        knowledge_graph.entities[entity.name] = entity
        created.append(entity.name)
    
    # Save the updated graph
    knowledge_graph.save(GRAPH_FILE)
    
    return {
        "created": created,
        "count": len(created),
        "success": True,
    }

@mcp.tool("create_relations")
def create_relations(relations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create relations between entities in the knowledge graph."""
    created = []
    errors = []
    
    for relation_data in relations:
        # Check if entities exist
        from_entity = relation_data["from"]
        to_entity = relation_data["to"]
        
        if from_entity not in knowledge_graph.entities:
            errors.append(f"Entity '{from_entity}' does not exist")
            continue
        
        if to_entity not in knowledge_graph.entities:
            errors.append(f"Entity '{to_entity}' does not exist")
            continue
        
        # Create the relation
        relation = Relation.from_dict(relation_data)
        knowledge_graph.relations.append(relation)
        created.append(f"{from_entity} -> {to_entity}")
    
    # Save the updated graph
    knowledge_graph.save(GRAPH_FILE)
    
    return {
        "created": created,
        "errors": errors,
        "count": len(created),
        "success": len(errors) == 0,
    }

@mcp.tool("search_nodes")
def search_nodes(query: str) -> Dict[str, Any]:
    """Search for nodes in the knowledge graph."""
    results = []
    
    # Search in entity names and types
    for name, entity in knowledge_graph.entities.items():
        if query.lower() in name.lower() or query.lower() in entity.entity_type.lower():
            results.append(entity.to_dict())
            continue
        
        # Search in observations
        for observation in entity.observations:
            if query.lower() in observation.lower():
                results.append(entity.to_dict())
                break
    
    return {
        "results": results,
        "count": len(results),
        "query": query,
    }

@mcp.tool("delete_entities")
def delete_entities(entity_names: List[str]) -> Dict[str, Any]:
    """Delete entities from the knowledge graph."""
    deleted = []
    errors = []
    
    for name in entity_names:
        if name in knowledge_graph.entities:
            del knowledge_graph.entities[name]
            deleted.append(name)
            
            # Also delete relations involving this entity
            knowledge_graph.relations = [
                r for r in knowledge_graph.relations 
                if r.from_entity != name and r.to_entity != name
            ]
        else:
            errors.append(f"Entity '{name}' does not exist")
    
    # Save the updated graph
    knowledge_graph.save(GRAPH_FILE)
    
    return {
        "deleted": deleted,
        "errors": errors,
        "count": len(deleted),
        "success": len(errors) == 0,
    }

@mcp.tool("delete_relations")
def delete_relations(relations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Delete relations from the knowledge graph."""
    deleted = []
    errors = []
    
    for relation_data in relations:
        from_entity = relation_data["from"]
        to_entity = relation_data["to"]
        relation_type = relation_data["relationType"]
        
        # Find and delete matching relations
        original_count = len(knowledge_graph.relations)
        knowledge_graph.relations = [
            r for r in knowledge_graph.relations 
            if not (r.from_entity == from_entity and 
                   r.to_entity == to_entity and 
                   r.relation_type == relation_type)
        ]
        
        if len(knowledge_graph.relations) < original_count:
            deleted.append(f"{from_entity} -> {to_entity}")
        else:
            errors.append(f"Relation '{from_entity} -> {to_entity}' does not exist")
    
    # Save the updated graph
    knowledge_graph.save(GRAPH_FILE)
    
    return {
        "deleted": deleted,
        "errors": errors,
        "count": len(deleted),
        "success": len(errors) == 0,
    }

@mcp.tool("add_observations")
def add_observations(observations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Add observations to entities in the knowledge graph."""
    updated = []
    errors = []
    
    for observation_data in observations:
        entity_name = observation_data["entityName"]
        contents = observation_data["contents"]
        
        if entity_name in knowledge_graph.entities:
            entity = knowledge_graph.entities[entity_name]
            for content in contents:
                if content not in entity.observations:
                    entity.observations.append(content)
            updated.append(entity_name)
        else:
            errors.append(f"Entity '{entity_name}' does not exist")
    
    # Save the updated graph
    knowledge_graph.save(GRAPH_FILE)
    
    return {
        "updated": updated,
        "errors": errors,
        "count": len(updated),
        "success": len(errors) == 0,
    }

# Resources
@mcp.resource("knowledge_graph")
def get_knowledge_graph() -> Dict[str, Any]:
    """Get the entire knowledge graph."""
    return knowledge_graph.to_dict()

@mcp.resource("entity/{name}")
def get_entity(name: str) -> Dict[str, Any]:
    """Get a specific entity by name."""
    if name in knowledge_graph.entities:
        return knowledge_graph.entities[name].to_dict()
    return {"error": f"Entity '{name}' not found"}

@mcp.resource("relations/{entity_name}")
def get_entity_relations(entity_name: str) -> Dict[str, Any]:
    """Get all relations for a specific entity."""
    if entity_name not in knowledge_graph.entities:
        return {"error": f"Entity '{entity_name}' not found"}
    
    outgoing = [r.to_dict() for r in knowledge_graph.relations if r.from_entity == entity_name]
    incoming = [r.to_dict() for r in knowledge_graph.relations if r.to_entity == entity_name]
    
    return {
        "entity": entity_name,
        "outgoing": outgoing,
        "incoming": incoming,
    }

if __name__ == "__main__":
    # Get port and host from environment variables
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info(f"Starting Knowledge Graph MCP Server on {host}:{port}")

    # Run the server
    mcp.run(host=host, port=port)
