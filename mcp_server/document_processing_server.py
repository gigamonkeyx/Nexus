#!/usr/bin/env python3
"""
Document Processing MCP Server

This server provides tools for processing and analyzing documents through the Model Context Protocol.
"""

import os
import sys
import logging
import json
import re
import base64
import uuid
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field

from mcp.server.fastmcp import FastMCP, Context, Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("document_processing_server")

# Data models
@dataclass
class Entity:
    """Named entity extracted from text."""
    text: str
    type: str
    start: int
    end: int
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "text": self.text,
            "type": self.type,
            "start": self.start,
            "end": self.end,
        }

@dataclass
class Document:
    """Document with text and metadata."""
    id: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "text": self.text,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Document":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            text=data["text"],
            metadata=data.get("metadata", {}),
        )

@dataclass
class DocumentStore:
    """Store for documents."""
    documents: Dict[str, Document] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "documents": {id: doc.to_dict() for id, doc in self.documents.items()},
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DocumentStore":
        """Create from dictionary."""
        store = cls()
        for id, doc_data in data.get("documents", {}).items():
            store.documents[id] = Document.from_dict(doc_data)
        return store
    
    def save(self, filename: str) -> None:
        """Save to file."""
        with open(filename, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filename: str) -> "DocumentStore":
        """Load from file."""
        if not os.path.exists(filename):
            return cls()
        with open(filename, "r") as f:
            data = json.load(f)
        return cls.from_dict(data)

# Initialize the document store
STORE_FILE = "document_store.json"
document_store = DocumentStore.load(STORE_FILE)

# Initialize the MCP server
mcp = FastMCP()

# Helper functions
def extract_text_from_pdf(pdf_base64: str) -> str:
    """Extract text from a PDF (simplified for demo)."""
    # In a real implementation, you would use a library like PyPDF2 or pdfminer
    # For this demo, we'll just return a placeholder
    return "This is extracted text from a PDF document. It would contain the actual content in a real implementation."

def extract_text_from_docx(docx_base64: str) -> str:
    """Extract text from a DOCX (simplified for demo)."""
    # In a real implementation, you would use a library like python-docx
    # For this demo, we'll just return a placeholder
    return "This is extracted text from a DOCX document. It would contain the actual content in a real implementation."

def extract_text_from_image(image_base64: str) -> str:
    """Extract text from an image using OCR (simplified for demo)."""
    # In a real implementation, you would use a library like pytesseract
    # For this demo, we'll just return a placeholder
    return "This is extracted text from an image using OCR. It would contain the actual content in a real implementation."

def extract_entities_from_text(text: str) -> List[Entity]:
    """Extract entities from text (simplified for demo)."""
    # In a real implementation, you would use a library like spaCy or a custom NER model
    # For this demo, we'll use simple regex patterns
    entities = []
    
    # Extract email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    for match in re.finditer(email_pattern, text):
        entities.append(Entity(
            text=match.group(),
            type="EMAIL",
            start=match.start(),
            end=match.end(),
        ))
    
    # Extract URLs
    url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
    for match in re.finditer(url_pattern, text):
        entities.append(Entity(
            text=match.group(),
            type="URL",
            start=match.start(),
            end=match.end(),
        ))
    
    # Extract dates (simple pattern)
    date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    for match in re.finditer(date_pattern, text):
        entities.append(Entity(
            text=match.group(),
            type="DATE",
            start=match.start(),
            end=match.end(),
        ))
    
    # Extract phone numbers (simple pattern)
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    for match in re.finditer(phone_pattern, text):
        entities.append(Entity(
            text=match.group(),
            type="PHONE",
            start=match.start(),
            end=match.end(),
        ))
    
    return entities

def summarize_text(text: str, max_length: int = 200) -> str:
    """Summarize text (simplified for demo)."""
    # In a real implementation, you would use a proper summarization model
    # For this demo, we'll just return the first few sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    summary = ""
    
    for sentence in sentences:
        if len(summary) + len(sentence) <= max_length:
            summary += sentence + " "
        else:
            break
    
    return summary.strip()

# Tools
@mcp.tool("extract_text")
def extract_text(document: Dict[str, Any]) -> Dict[str, Any]:
    """Extract text from a document."""
    doc_type = document.get("type", "").lower()
    content = document.get("content", "")
    
    if not content:
        return {
            "error": "Document content is empty",
            "success": False,
        }
    
    text = ""
    if doc_type == "pdf":
        text = extract_text_from_pdf(content)
    elif doc_type == "docx":
        text = extract_text_from_docx(content)
    elif doc_type == "image":
        text = extract_text_from_image(content)
    elif doc_type == "text":
        text = content
    else:
        return {
            "error": f"Unsupported document type: {doc_type}",
            "success": False,
        }
    
    # Store the document
    doc_id = str(uuid.uuid4())
    doc = Document(
        id=doc_id,
        text=text,
        metadata={
            "original_type": doc_type,
            "extraction_time": "2023-06-15T12:00:00Z",  # In a real implementation, use actual timestamp
        },
    )
    document_store.documents[doc_id] = doc
    
    # Save the updated store
    document_store.save(STORE_FILE)
    
    return {
        "id": doc_id,
        "text": text,
        "success": True,
    }

@mcp.tool("extract_entities")
def extract_entities(text: str) -> Dict[str, Any]:
    """Extract entities from text."""
    entities = extract_entities_from_text(text)
    
    return {
        "entities": [entity.to_dict() for entity in entities],
        "count": len(entities),
        "success": True,
    }

@mcp.tool("summarize_document")
def summarize_document(document_id: str, max_length: int = 200) -> Dict[str, Any]:
    """Summarize a document."""
    if document_id not in document_store.documents:
        return {
            "error": f"Document '{document_id}' not found",
            "success": False,
        }
    
    doc = document_store.documents[document_id]
    summary = summarize_text(doc.text, max_length)
    
    return {
        "id": document_id,
        "summary": summary,
        "original_length": len(doc.text),
        "summary_length": len(summary),
        "success": True,
    }

@mcp.tool("analyze_document")
def analyze_document(document_id: str) -> Dict[str, Any]:
    """Analyze a document for entities, sentiment, and key information."""
    if document_id not in document_store.documents:
        return {
            "error": f"Document '{document_id}' not found",
            "success": False,
        }
    
    doc = document_store.documents[document_id]
    
    # Extract entities
    entities = extract_entities_from_text(doc.text)
    
    # Calculate basic statistics
    word_count = len(doc.text.split())
    sentence_count = len(re.split(r'(?<=[.!?])\s+', doc.text))
    
    # Generate summary
    summary = summarize_text(doc.text, 200)
    
    return {
        "id": document_id,
        "entities": [entity.to_dict() for entity in entities],
        "statistics": {
            "word_count": word_count,
            "sentence_count": sentence_count,
            "character_count": len(doc.text),
        },
        "summary": summary,
        "success": True,
    }

@mcp.tool("delete_document")
def delete_document(document_id: str) -> Dict[str, Any]:
    """Delete a document."""
    if document_id not in document_store.documents:
        return {
            "error": f"Document '{document_id}' not found",
            "success": False,
        }
    
    del document_store.documents[document_id]
    
    # Save the updated store
    document_store.save(STORE_FILE)
    
    return {
        "id": document_id,
        "success": True,
    }

# Resources
@mcp.resource("documents")
def get_documents() -> Dict[str, Any]:
    """Get all documents."""
    return {
        "documents": [
            {
                "id": id,
                "metadata": doc.metadata,
                "preview": doc.text[:100] + "..." if len(doc.text) > 100 else doc.text,
            }
            for id, doc in document_store.documents.items()
        ],
    }

@mcp.resource("document/{id}")
def get_document(id: str) -> Dict[str, Any]:
    """Get a specific document."""
    if id not in document_store.documents:
        return {"error": f"Document '{id}' not found"}
    
    doc = document_store.documents[id]
    
    return doc.to_dict()

if __name__ == "__main__":
    # Get port and host from environment variables
    port = int(os.environ.get("PORT", 8003))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info(f"Starting Document Processing MCP Server on {host}:{port}")

    # Run the server
    mcp.run(host=host, port=port)
