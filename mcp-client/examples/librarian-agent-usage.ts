/**
 * Librarian Agent Usage Example
 * 
 * This example demonstrates how to use the LibrarianAgent to perform research,
 * manage knowledge, and present information in a beautiful UI.
 */

import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager } from '../src/adapters/AdapterManager';
import { ClaudeAdapter } from '../src/agents/ClaudeAdapter';
import { LibrarianAgent } from '../src/agents/LibrarianAgent';
import { PresentationFormat, PresentationStyle } from '../src/agents/modules/PresentationModule';
import { logger, LogLevel } from '../src/utils/logger';

// Set log level to debug for more detailed logging
logger.setLevel(LogLevel.DEBUG);

/**
 * Main function
 */
async function main() {
  try {
    // Create NexusClient
    const nexusClient = new NexusClient();
    
    // Register servers
    nexusClient.registerServer('ollama', {
      type: 'sse',
      url: 'http://localhost:3011/sse'
    });
    
    nexusClient.registerServer('comfyui', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });
    
    // Connect to servers
    await nexusClient.connectServer('ollama');
    await nexusClient.connectServer('comfyui');
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create adapters
    const ollamaAdapter = await adapterManager.createAdapter('ollama', {
      type: 'sse',
      url: 'http://localhost:3011/sse'
    });
    
    const comfyuiAdapter = await adapterManager.createAdapter('comfyui', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });
    
    // Create ClaudeAdapter
    const claudeAdapter = new ClaudeAdapter({
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229-v1:0',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key'
    });
    
    // Create LibrarianAgent
    const librarianAgent = new LibrarianAgent(
      nexusClient,
      adapterManager,
      claudeAdapter,
      {
        name: 'Research Librarian',
        description: 'A librarian agent that can perform exhaustive research, access public databases, and present quality data in a beautiful UI',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229-v1:0'
        },
        ollamaAdapter: ollamaAdapter,
        comfyuiAdapter: comfyuiAdapter,
        presentationFormat: PresentationFormat.HTML,
        presentationStyle: PresentationStyle.ACADEMIC,
        maxSearchResults: 10,
        maxWebFetchDepth: 3
      }
    );
    
    // Initialize the librarian agent
    await librarianAgent.initialize();
    
    // Perform research on a topic
    logger.info('Performing research on quantum computing...');
    const researchResult = await librarianAgent.research('quantum computing');
    logger.info(`Research completed with ${researchResult.data?.fetchResults?.length || 0} sources`);
    
    // Create a knowledge graph from the research
    logger.info('Creating knowledge graph...');
    const entities = [
      {
        name: 'Quantum Computing',
        entityType: 'Technology',
        observations: ['Uses quantum mechanics principles', 'Operates on qubits instead of bits', 'Can solve certain problems exponentially faster than classical computers']
      },
      {
        name: 'Qubit',
        entityType: 'Concept',
        observations: ['Quantum bit', 'Can exist in superposition', 'Basic unit of quantum information']
      },
      {
        name: 'Quantum Supremacy',
        entityType: 'Concept',
        observations: ['When quantum computers outperform classical computers', 'Demonstrated by Google in 2019', 'Controversial term']
      }
    ];
    
    const relations = [
      {
        from: 'Quantum Computing',
        relationType: 'uses',
        to: 'Qubit'
      },
      {
        from: 'Quantum Computing',
        relationType: 'demonstrates',
        to: 'Quantum Supremacy'
      }
    ];
    
    const knowledgeGraphResult = await librarianAgent.createKnowledgeGraph('quantum computing', entities, relations);
    logger.info(`Knowledge graph created with ${knowledgeGraphResult.entities} entities and ${knowledgeGraphResult.relations} relations`);
    
    // Generate an image for the research topic
    logger.info('Generating image for quantum computing...');
    const imageResult = await librarianAgent.generateImage('quantum computing');
    logger.info(`Image generated: ${imageResult.image_url}`);
    
    // Create content for presentation
    const content = `
# Quantum Computing: An Overview

## Introduction

Quantum computing is a rapidly evolving field that leverages the principles of quantum mechanics to process information. Unlike classical computers that use bits (0s and 1s), quantum computers use quantum bits or "qubits" that can exist in multiple states simultaneously due to a property called superposition.

## Key Concepts

### Qubits

Qubits are the fundamental building blocks of quantum computers. While classical bits can only be in one of two states (0 or 1), qubits can exist in a superposition of both states simultaneously. This property allows quantum computers to process a vast number of possibilities simultaneously.

### Superposition

Superposition is a principle of quantum mechanics that allows quantum systems to exist in multiple states at once. In the context of quantum computing, it enables qubits to represent both 0 and 1 simultaneously, exponentially increasing computational power with each additional qubit.

### Entanglement

Quantum entanglement is a phenomenon where pairs or groups of particles become correlated in such a way that the quantum state of each particle cannot be described independently. This property is essential for quantum computing as it allows qubits to be interconnected in ways that classical bits cannot.

### Quantum Supremacy

Quantum supremacy refers to the point at which a quantum computer can solve a problem that classical computers cannot solve in a reasonable amount of time. Google claimed to have achieved quantum supremacy in 2019 with its 53-qubit Sycamore processor.

## Applications

Quantum computing has potential applications in various fields:

1. **Cryptography**: Quantum computers could break many of the encryption systems currently in use, but also enable new, more secure encryption methods.

2. **Drug Discovery**: Quantum computers could simulate molecular structures more accurately, accelerating drug discovery and development.

3. **Optimization Problems**: Quantum algorithms could solve complex optimization problems in logistics, finance, and machine learning more efficiently.

4. **Material Science**: Quantum computers could help design new materials with specific properties for various applications.

## Challenges

Despite its potential, quantum computing faces several challenges:

1. **Decoherence**: Quantum states are fragile and can collapse due to interaction with the environment, leading to errors.

2. **Error Correction**: Developing effective error correction methods for quantum computations is crucial but challenging.

3. **Scalability**: Building large-scale, stable quantum computers with many qubits remains a significant engineering challenge.

## Conclusion

Quantum computing represents a paradigm shift in computational capabilities. While still in its early stages, the field is advancing rapidly, with potential to revolutionize various industries and solve problems that are currently intractable for classical computers.
`;
    
    // Format and save the presentation
    logger.info('Creating and saving presentation...');
    const presentationResult = await librarianAgent.savePresentation(
      content,
      'Quantum Computing: An Overview',
      PresentationFormat.HTML,
      PresentationStyle.ACADEMIC,
      {
        author: 'Research Librarian Agent',
        abstract: 'This document provides an overview of quantum computing, its key concepts, applications, and challenges.',
        references: `
1. Nielsen, M. A., & Chuang, I. L. (2010). Quantum Computation and Quantum Information. Cambridge University Press.
2. Preskill, J. (2018). Quantum Computing in the NISQ era and beyond. Quantum, 2, 79.
3. Arute, F., Arya, K., Babbush, R., et al. (2019). Quantum supremacy using a programmable superconducting processor. Nature, 574, 505-510.
`
      },
      'quantum_computing_overview'
    );
    
    logger.info(`Presentation saved: ${presentationResult.filename}`);
    
    // Execute a general task
    logger.info('Executing general task...');
    const taskResult = await librarianAgent.executeTask('Create a comparison between quantum computing and classical computing, focusing on their fundamental differences and relative advantages.');
    logger.info(`Task completed: ${taskResult.text.substring(0, 100)}...`);
    
    logger.info('Librarian agent example completed successfully');
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
});
