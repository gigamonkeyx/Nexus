/**
 * Coding Agent Usage Example
 * 
 * This example demonstrates how to use the CodingAgent to generate, analyze, and manage code.
 */

import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager } from '../src/adapters/AdapterManager';
import { ClaudeAdapter } from '../src/agents/ClaudeAdapter';
import { CodingAgent } from '../src/agents/CodingAgent';
import { ProgrammingLanguage } from '../src/agents/modules/CodingModule';
import { AnalysisDimension } from '../src/agents/modules/AnalysisModule';
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
    
    nexusClient.registerServer('code-enhancement', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });
    
    nexusClient.registerServer('lucidity', {
      type: 'sse',
      url: 'http://localhost:3021/sse'
    });
    
    nexusClient.registerServer('github', {
      type: 'sse',
      url: 'http://localhost:3022/sse'
    });
    
    // Connect to servers
    await nexusClient.connectServer('ollama');
    await nexusClient.connectServer('code-enhancement');
    await nexusClient.connectServer('lucidity');
    await nexusClient.connectServer('github');
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create adapters
    const ollamaAdapter = await adapterManager.createAdapter('ollama', {
      type: 'sse',
      url: 'http://localhost:3011/sse'
    });
    
    // Create ClaudeAdapter
    const claudeAdapter = new ClaudeAdapter({
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229-v1:0',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key'
    });
    
    // Create CodingAgent
    const codingAgent = new CodingAgent(
      nexusClient,
      adapterManager,
      claudeAdapter,
      {
        name: 'Code Wizard',
        description: 'A coding agent that can generate, analyze, and manage code',
        llm: {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229-v1:0'
        },
        ollamaAdapter: ollamaAdapter,
        enhancementServerUrl: 'http://localhost:3020',
        lucidityServerUrl: 'http://localhost:3021',
        githubServerUrl: 'http://localhost:3022',
        defaultLanguage: ProgrammingLanguage.TYPESCRIPT,
        defaultOwner: 'gigamonkeyx',
        maxConcurrentTasks: 3
      }
    );
    
    // Initialize the coding agent
    await codingAgent.initialize();
    
    // Generate code
    logger.info('Generating a TypeScript utility function...');
    const codeResult = await codingAgent.generateCode(
      'Create a utility function that formats a date in various formats (ISO, US, EU) with timezone support',
      ProgrammingLanguage.TYPESCRIPT,
      {
        includeComments: true,
        includeTests: true,
        style: 'verbose'
      }
    );
    logger.info(`Code generated: ${codeResult.code.substring(0, 100)}...`);
    
    // Analyze code
    logger.info('Analyzing the generated code...');
    const analysisResult = await codingAgent.analyzeCode(
      codeResult.code,
      ProgrammingLanguage.TYPESCRIPT,
      [
        AnalysisDimension.COMPLEXITY,
        AnalysisDimension.MAINTAINABILITY,
        AnalysisDimension.PERFORMANCE
      ]
    );
    logger.info(`Analysis completed with overall score: ${analysisResult.overallScore}`);
    
    // Refactor code based on analysis
    logger.info('Refactoring the code for better performance...');
    const refactoredResult = await codingAgent.refactorCode(
      codeResult.code,
      'performance',
      {
        preserveComments: true
      }
    );
    logger.info(`Code refactored: ${refactoredResult.code.substring(0, 100)}...`);
    
    // Generate tests
    logger.info('Generating tests for the refactored code...');
    const testsResult = await codingAgent.generateTests(
      refactoredResult.code,
      ProgrammingLanguage.TYPESCRIPT,
      'jest'
    );
    logger.info(`Tests generated: ${testsResult.tests.substring(0, 100)}...`);
    
    // Create a GitHub repository (this would require GitHub MCP Server to be running)
    try {
      logger.info('Creating a GitHub repository...');
      const repoResult = await codingAgent.getAgent()?.executeCapability('createRepository', {
        options: {
          name: 'date-formatter-utils',
          description: 'Utility functions for formatting dates in various formats',
          visibility: 'public',
          autoInit: true,
          gitignoreTemplate: 'Node'
        }
      });
      logger.info(`Repository created: ${repoResult?.html_url}`);
      
      // Create a branch
      logger.info('Creating a feature branch...');
      const branchResult = await codingAgent.getAgent()?.executeCapability('createBranch', {
        owner: 'gigamonkeyx',
        repo: 'date-formatter-utils',
        branch: 'feature/date-formatter',
        fromBranch: 'main'
      });
      logger.info(`Branch created: ${branchResult?.name}`);
      
      // Create a pull request
      logger.info('Creating a pull request...');
      const prResult = await codingAgent.createPullRequest(
        'gigamonkeyx',
        'date-formatter-utils',
        'Add date formatter utility',
        'This PR adds a utility function for formatting dates in various formats with timezone support.',
        'feature/date-formatter',
        'main'
      );
      logger.info(`Pull request created: ${prResult.html_url}`);
    } catch (error) {
      logger.warn(`GitHub operations skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Execute a general coding task
    logger.info('Executing a general coding task...');
    const taskResult = await codingAgent.executeTask(
      'Create a React component that displays a calendar with the current date highlighted and allows selecting dates'
    );
    logger.info(`Task completed: ${JSON.stringify(taskResult).substring(0, 100)}...`);
    
    logger.info('Coding agent example completed successfully');
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
});
