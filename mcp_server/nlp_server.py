#!/usr/bin/env python3
"""
Natural Language Processing MCP Server

This server provides tools for natural language processing through the Model Context Protocol.
"""

import os
import sys
import logging
import json
import re
import uuid
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass, field

from mcp.server.fastmcp import FastMCP, Context, Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("nlp_server")

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
class SentimentResult:
    """Result of sentiment analysis."""
    text: str
    sentiment: str  # "positive", "negative", "neutral"
    score: float  # -1.0 to 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "text": self.text,
            "sentiment": self.sentiment,
            "score": self.score,
        }

@dataclass
class TranslationResult:
    """Result of language translation."""
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "original_text": self.original_text,
            "translated_text": self.translated_text,
            "source_language": self.source_language,
            "target_language": self.target_language,
        }

# Initialize the MCP server
mcp = FastMCP()

# Helper functions
def detect_language(text: str) -> str:
    """Detect language of text (simplified for demo)."""
    # In a real implementation, you would use a library like langdetect
    # For this demo, we'll use a simple heuristic
    
    # Check for common English words
    english_words = ["the", "and", "is", "in", "to", "of", "a", "for", "that", "this"]
    english_count = sum(1 for word in text.lower().split() if word in english_words)
    
    # Check for common Spanish words
    spanish_words = ["el", "la", "es", "en", "y", "de", "un", "una", "que", "por"]
    spanish_count = sum(1 for word in text.lower().split() if word in spanish_words)
    
    # Check for common French words
    french_words = ["le", "la", "est", "en", "et", "de", "un", "une", "que", "pour"]
    french_count = sum(1 for word in text.lower().split() if word in french_words)
    
    # Check for common German words
    german_words = ["der", "die", "das", "ist", "in", "und", "zu", "den", "für", "nicht"]
    german_count = sum(1 for word in text.lower().split() if word in german_words)
    
    # Determine language based on word counts
    counts = {
        "en": english_count,
        "es": spanish_count,
        "fr": french_count,
        "de": german_count,
    }
    
    # Default to English if no clear winner
    return max(counts.items(), key=lambda x: x[1])[0] if any(counts.values()) else "en"

def analyze_sentiment(text: str) -> SentimentResult:
    """Analyze sentiment of text (simplified for demo)."""
    # In a real implementation, you would use a proper sentiment analysis model
    # For this demo, we'll use a simple lexicon-based approach
    
    # Simple lexicon of positive and negative words
    positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "happy", "love", "like", "best"]
    negative_words = ["bad", "terrible", "awful", "horrible", "worst", "hate", "dislike", "poor", "disappointing", "sad"]
    
    # Count positive and negative words
    words = text.lower().split()
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    # Calculate sentiment score (-1.0 to 1.0)
    total = positive_count + negative_count
    if total == 0:
        score = 0.0
        sentiment = "neutral"
    else:
        score = (positive_count - negative_count) / total
        if score > 0.1:
            sentiment = "positive"
        elif score < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"
    
    return SentimentResult(
        text=text,
        sentiment=sentiment,
        score=score,
    )

def extract_entities(text: str) -> List[Entity]:
    """Extract named entities from text (simplified for demo)."""
    # In a real implementation, you would use a library like spaCy
    # For this demo, we'll use simple regex patterns
    entities = []
    
    # Extract person names (simplified)
    name_pattern = r'Mr\.\s+[A-Z][a-z]+|Mrs\.\s+[A-Z][a-z]+|Ms\.\s+[A-Z][a-z]+|Dr\.\s+[A-Z][a-z]+|[A-Z][a-z]+\s+[A-Z][a-z]+'
    for match in re.finditer(name_pattern, text):
        entities.append(Entity(
            text=match.group(),
            type="PERSON",
            start=match.start(),
            end=match.end(),
        ))
    
    # Extract locations (simplified)
    location_pattern = r'in\s+([A-Z][a-z]+)|at\s+([A-Z][a-z]+)|from\s+([A-Z][a-z]+)'
    for match in re.finditer(location_pattern, text):
        location = match.group(1) or match.group(2) or match.group(3)
        start = match.start() + match.group(0).index(location)
        entities.append(Entity(
            text=location,
            type="LOCATION",
            start=start,
            end=start + len(location),
        ))
    
    # Extract organizations (simplified)
    org_pattern = r'([A-Z][a-z]*\s+)+(Inc\.|Corp\.|LLC|Company|Organization)'
    for match in re.finditer(org_pattern, text):
        entities.append(Entity(
            text=match.group(),
            type="ORGANIZATION",
            start=match.start(),
            end=match.end(),
        ))
    
    # Extract dates (simplified)
    date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?,\s+\d{4}\b'
    for match in re.finditer(date_pattern, text):
        entities.append(Entity(
            text=match.group(),
            type="DATE",
            start=match.start(),
            end=match.end(),
        ))
    
    return entities

def translate_text(text: str, source_lang: str, target_lang: str) -> TranslationResult:
    """Translate text (simplified for demo)."""
    # In a real implementation, you would use a proper translation service
    # For this demo, we'll use a simple placeholder
    
    # Detect source language if "auto"
    if source_lang == "auto":
        source_lang = detect_language(text)
    
    # Simple translations for demo purposes
    translations = {
        ("en", "es"): {
            "hello": "hola",
            "world": "mundo",
            "good": "bueno",
            "morning": "mañana",
            "evening": "tarde",
            "night": "noche",
            "thank you": "gracias",
            "goodbye": "adiós",
        },
        ("en", "fr"): {
            "hello": "bonjour",
            "world": "monde",
            "good": "bon",
            "morning": "matin",
            "evening": "soir",
            "night": "nuit",
            "thank you": "merci",
            "goodbye": "au revoir",
        },
        ("en", "de"): {
            "hello": "hallo",
            "world": "welt",
            "good": "gut",
            "morning": "morgen",
            "evening": "abend",
            "night": "nacht",
            "thank you": "danke",
            "goodbye": "auf wiedersehen",
        },
    }
    
    # If we have a translation dictionary for the language pair
    if (source_lang, target_lang) in translations:
        trans_dict = translations[(source_lang, target_lang)]
        words = text.lower().split()
        translated_words = [trans_dict.get(word, word) for word in words]
        translated_text = " ".join(translated_words)
    else:
        # For unsupported language pairs, just return the original text
        translated_text = text
    
    return TranslationResult(
        original_text=text,
        translated_text=translated_text,
        source_language=source_lang,
        target_language=target_lang,
    )

# Tools
@mcp.tool("sentiment_analysis")
def sentiment_analysis(text: str) -> Dict[str, Any]:
    """Analyze the sentiment of text."""
    result = analyze_sentiment(text)
    
    return {
        "text": result.text,
        "sentiment": result.sentiment,
        "score": result.score,
        "success": True,
    }

@mcp.tool("named_entity_recognition")
def named_entity_recognition(text: str) -> Dict[str, Any]:
    """Recognize named entities in text."""
    entities = extract_entities(text)
    
    return {
        "entities": [entity.to_dict() for entity in entities],
        "count": len(entities),
        "success": True,
    }

@mcp.tool("language_translation")
def language_translation(text: str, source_lang: str = "auto", target_lang: str = "en") -> Dict[str, Any]:
    """Translate text from one language to another."""
    result = translate_text(text, source_lang, target_lang)
    
    return {
        "original_text": result.original_text,
        "translated_text": result.translated_text,
        "source_language": result.source_language,
        "target_language": result.target_language,
        "success": True,
    }

@mcp.tool("language_detection")
def language_detection(text: str) -> Dict[str, Any]:
    """Detect the language of text."""
    language = detect_language(text)
    
    return {
        "text": text,
        "language": language,
        "success": True,
    }

@mcp.tool("text_summarization")
def text_summarization(text: str, max_length: int = 100) -> Dict[str, Any]:
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
    
    return {
        "original_text": text,
        "summary": summary.strip(),
        "original_length": len(text),
        "summary_length": len(summary),
        "success": True,
    }

# Resources
@mcp.resource("supported_languages")
def get_supported_languages() -> Dict[str, Any]:
    """Get supported languages for translation."""
    return {
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Spanish"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
        ],
    }

@mcp.resource("sentiment_lexicon")
def get_sentiment_lexicon() -> Dict[str, Any]:
    """Get the sentiment lexicon used for analysis."""
    return {
        "positive_words": ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "happy", "love", "like", "best"],
        "negative_words": ["bad", "terrible", "awful", "horrible", "worst", "hate", "dislike", "poor", "disappointing", "sad"],
    }

if __name__ == "__main__":
    # Get port and host from environment variables
    port = int(os.environ.get("PORT", 8005))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info(f"Starting Natural Language Processing MCP Server on {host}:{port}")

    # Run the server
    mcp.run(host=host, port=port)
