#!/usr/bin/env python3
"""
Vector Database MCP Server

This server provides tools for storing, retrieving, and querying vector embeddings
through the Model Context Protocol.
"""

import os
import sys
import logging
import json
import uuid
import numpy as np
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass, field

from mcp.server.fastmcp import FastMCP, Context, Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("vector_database_server")

# Data models
@dataclass
class Embedding:
    """Vector embedding with metadata."""
    id: str
    vector: List[float]
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "vector": self.vector,
            "text": self.text,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Embedding":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            vector=data["vector"],
            text=data["text"],
            metadata=data.get("metadata", {}),
        )

@dataclass
class Collection:
    """Collection of embeddings."""
    name: str
    embeddings: Dict[str, Embedding] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "embeddings": {id: emb.to_dict() for id, emb in self.embeddings.items()},
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Collection":
        """Create from dictionary."""
        collection = cls(name=data["name"])
        for id, emb_data in data.get("embeddings", {}).items():
            collection.embeddings[id] = Embedding.from_dict(emb_data)
        return collection
    
    def add_embedding(self, embedding: Embedding) -> None:
        """Add an embedding to the collection."""
        self.embeddings[embedding.id] = embedding
    
    def delete_embedding(self, id: str) -> bool:
        """Delete an embedding from the collection."""
        if id in self.embeddings:
            del self.embeddings[id]
            return True
        return False
    
    def search(self, query_vector: List[float], top_k: int = 5) -> List[Tuple[str, float, Dict[str, Any]]]:
        """Search for similar embeddings."""
        if not self.embeddings:
            return []
        
        # Convert query vector to numpy array
        query_np = np.array(query_vector)
        
        # Calculate cosine similarity for all embeddings
        results = []
        for id, embedding in self.embeddings.items():
            emb_np = np.array(embedding.vector)
            similarity = np.dot(query_np, emb_np) / (np.linalg.norm(query_np) * np.linalg.norm(emb_np))
            results.append((id, similarity, embedding.text, embedding.metadata))
        
        # Sort by similarity (descending) and return top_k
        results.sort(key=lambda x: x[1], reverse=True)
        return [(id, float(sim), {"text": text, "metadata": meta}) for id, sim, text, meta in results[:top_k]]

@dataclass
class VectorDatabase:
    """Vector database containing collections of embeddings."""
    collections: Dict[str, Collection] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "collections": {name: coll.to_dict() for name, coll in self.collections.items()},
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VectorDatabase":
        """Create from dictionary."""
        db = cls()
        for name, coll_data in data.get("collections", {}).items():
            db.collections[name] = Collection.from_dict(coll_data)
        return db
    
    def save(self, filename: str) -> None:
        """Save to file."""
        with open(filename, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filename: str) -> "VectorDatabase":
        """Load from file."""
        if not os.path.exists(filename):
            return cls()
        with open(filename, "r") as f:
            data = json.load(f)
        return cls.from_dict(data)
    
    def get_or_create_collection(self, name: str) -> Collection:
        """Get or create a collection."""
        if name not in self.collections:
            self.collections[name] = Collection(name=name)
        return self.collections[name]

# Simple embedding model (for demo purposes)
def get_embedding(text: str) -> List[float]:
    """Get embedding for text (simplified for demo)."""
    # This is a very simple embedding function for demonstration
    # In a real implementation, you would use a proper embedding model
    import hashlib
    
    # Create a deterministic "embedding" based on the hash of the text
    hash_obj = hashlib.md5(text.encode())
    hash_bytes = hash_obj.digest()
    
    # Convert hash bytes to a list of floats (normalized to unit length)
    vector = [float(b) / 255.0 for b in hash_bytes]
    
    # Normalize to unit length
    norm = np.sqrt(sum(v*v for v in vector))
    vector = [v/norm for v in vector]
    
    return vector

# Initialize the vector database
DB_FILE = "vector_database.json"
vector_db = VectorDatabase.load(DB_FILE)

# Initialize the MCP server
mcp = FastMCP()

# Tools
@mcp.tool("store_embeddings")
def store_embeddings(texts: List[str], collection: str = "default", metadata: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Store text embeddings in the vector database."""
    if metadata is None:
        metadata = [{} for _ in texts]
    elif len(metadata) != len(texts):
        return {
            "error": "Number of metadata items must match number of texts",
            "success": False,
        }
    
    coll = vector_db.get_or_create_collection(collection)
    ids = []
    
    for i, text in enumerate(texts):
        # Generate embedding
        vector = get_embedding(text)
        
        # Create embedding object
        emb_id = str(uuid.uuid4())
        embedding = Embedding(
            id=emb_id,
            vector=vector,
            text=text,
            metadata=metadata[i],
        )
        
        # Add to collection
        coll.add_embedding(embedding)
        ids.append(emb_id)
    
    # Save the updated database
    vector_db.save(DB_FILE)
    
    return {
        "ids": ids,
        "count": len(ids),
        "collection": collection,
        "success": True,
    }

@mcp.tool("query_embeddings")
def query_embeddings(query: str, collection: str = "default", top_k: int = 5) -> Dict[str, Any]:
    """Query the vector database for similar embeddings."""
    if collection not in vector_db.collections:
        return {
            "error": f"Collection '{collection}' does not exist",
            "success": False,
        }
    
    coll = vector_db.collections[collection]
    
    # Generate query embedding
    query_vector = get_embedding(query)
    
    # Search for similar embeddings
    results = coll.search(query_vector, top_k)
    
    return {
        "results": [
            {
                "id": id,
                "similarity": similarity,
                "text": data["text"],
                "metadata": data["metadata"],
            }
            for id, similarity, data in results
        ],
        "count": len(results),
        "query": query,
        "collection": collection,
        "success": True,
    }

@mcp.tool("delete_embeddings")
def delete_embeddings(ids: List[str], collection: str = "default") -> Dict[str, Any]:
    """Delete embeddings from the vector database."""
    if collection not in vector_db.collections:
        return {
            "error": f"Collection '{collection}' does not exist",
            "success": False,
        }
    
    coll = vector_db.collections[collection]
    deleted = []
    errors = []
    
    for id in ids:
        if coll.delete_embedding(id):
            deleted.append(id)
        else:
            errors.append(f"Embedding '{id}' does not exist in collection '{collection}'")
    
    # Save the updated database
    vector_db.save(DB_FILE)
    
    return {
        "deleted": deleted,
        "errors": errors,
        "count": len(deleted),
        "collection": collection,
        "success": len(errors) == 0,
    }

@mcp.tool("create_collection")
def create_collection(name: str) -> Dict[str, Any]:
    """Create a new collection."""
    if name in vector_db.collections:
        return {
            "error": f"Collection '{name}' already exists",
            "success": False,
        }
    
    vector_db.collections[name] = Collection(name=name)
    
    # Save the updated database
    vector_db.save(DB_FILE)
    
    return {
        "name": name,
        "success": True,
    }

@mcp.tool("delete_collection")
def delete_collection(name: str) -> Dict[str, Any]:
    """Delete a collection."""
    if name not in vector_db.collections:
        return {
            "error": f"Collection '{name}' does not exist",
            "success": False,
        }
    
    del vector_db.collections[name]
    
    # Save the updated database
    vector_db.save(DB_FILE)
    
    return {
        "name": name,
        "success": True,
    }

# Resources
@mcp.resource("collections")
def get_collections() -> Dict[str, Any]:
    """Get all collections."""
    return {
        "collections": [
            {
                "name": name,
                "count": len(coll.embeddings),
            }
            for name, coll in vector_db.collections.items()
        ],
    }

@mcp.resource("collection/{name}")
def get_collection(name: str) -> Dict[str, Any]:
    """Get a specific collection."""
    if name not in vector_db.collections:
        return {"error": f"Collection '{name}' not found"}
    
    coll = vector_db.collections[name]
    
    return {
        "name": name,
        "count": len(coll.embeddings),
        "embeddings": [
            {
                "id": id,
                "text": emb.text,
                "metadata": emb.metadata,
            }
            for id, emb in coll.embeddings.items()
        ],
    }

if __name__ == "__main__":
    # Get port and host from environment variables
    port = int(os.environ.get("PORT", 8002))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info(f"Starting Vector Database MCP Server on {host}:{port}")

    # Run the server
    mcp.run(host=host, port=port)
