# τ-Bench Integration: Technical Implementation Plan

This document outlines the technical implementation plan for integrating the τ-bench framework into our AI Agent Factory to enhance benchmarking and continuous learning capabilities.

## 1. Overview of τ-Bench

τ-bench (Tau-bench) is a comprehensive benchmarking framework designed to evaluate AI agents in dynamic real-world settings with user and tool interactions. Key features include:

- Testing agents on completing complex tasks while interacting with simulated users and tools
- Measuring reliability through pass^k metrics (consistency across multiple runs)
- Evaluating both task completion and adherence to domain-specific policies

## 2. Integration Architecture

### 2.1 High-Level Architecture

```
                  +----------------+
                  |   Meta-Agent   |
                  +----------------+
                          |
                          v
              +------------------------+
              | τ-Bench Adapter Module |
              +------------------------+
                          |
          +---------------+---------------+
          |               |               |
+-----------------+ +-----------------+ +-----------------+
| User Simulator  | | Tool APIs       | | Policy Engine  |
+-----------------+ +-----------------+ +-----------------+
          |               |               |
          +---------------+---------------+
                          |
                          v
                  +----------------+
                  | Test Scenarios |
                  +----------------+
                          |
                          v
                  +----------------+
                  | Results Analysis|
                  +----------------+
```

### 2.2 Component Descriptions

1. **τ-Bench Adapter Module**: Core component that interfaces between our AI Agent Factory and the τ-bench framework.

2. **User Simulator**: LLM-based component that simulates realistic user interactions with agents.

3. **Tool APIs**: Simulated APIs that agents can interact with to complete tasks.

4. **Policy Engine**: Component that defines and enforces domain-specific policies and guidelines.

5. **Test Scenarios**: Collection of predefined test cases across different domains.

6. **Results Analysis**: Component for analyzing test results and calculating metrics like pass^k.

## 3. Implementation Details

### 3.1 τ-Bench Adapter Module

```typescript
// src/benchmarks/tau-bench/TauBenchAdapter.ts

import { NexusClient } from '../../core/NexusClient';
import { UserSimulator } from './UserSimulator';
import { ToolAPIManager } from './ToolAPIManager';
import { PolicyEngine } from './PolicyEngine';
import { TestScenarioManager } from './TestScenarioManager';
import { ResultsAnalyzer } from './ResultsAnalyzer';

export interface TauBenchConfig {
  domain: 'retail' | 'airline' | 'finance' | 'healthcare';
  numRuns: number; // For pass^k calculation
  maxTurns: number; // Maximum conversation turns
  policyStrictness: 'low' | 'medium' | 'high';
}

export class TauBenchAdapter {
  private nexusClient: NexusClient;
  private userSimulator: UserSimulator;
  private toolAPIManager: ToolAPIManager;
  private policyEngine: PolicyEngine;
  private testScenarioManager: TestScenarioManager;
  private resultsAnalyzer: ResultsAnalyzer;
  
  constructor(nexusClient: NexusClient, config: TauBenchConfig) {
    this.nexusClient = nexusClient;
    this.userSimulator = new UserSimulator(config);
    this.toolAPIManager = new ToolAPIManager(config.domain);
    this.policyEngine = new PolicyEngine(config.domain, config.policyStrictness);
    this.testScenarioManager = new TestScenarioManager(config.domain);
    this.resultsAnalyzer = new ResultsAnalyzer();
  }
  
  async runBenchmark(agentId: string, scenarioId?: string): Promise<BenchmarkResult> {
    // Get scenarios to run
    const scenarios = scenarioId 
      ? [await this.testScenarioManager.getScenario(scenarioId)]
      : await this.testScenarioManager.getAllScenarios();
    
    const results: ScenarioResult[] = [];
    
    // Run each scenario k times
    for (const scenario of scenarios) {
      const scenarioResults: RunResult[] = [];
      
      for (let i = 0; i < this.config.numRuns; i++) {
        // Run the scenario
        const result = await this.runScenario(agentId, scenario);
        scenarioResults.push(result);
      }
      
      // Calculate pass^k for this scenario
      const passK = this.resultsAnalyzer.calculatePassK(scenarioResults);
      
      results.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passK,
        runs: scenarioResults
      });
    }
    
    // Calculate overall benchmark results
    return this.resultsAnalyzer.analyzeBenchmarkResults(results);
  }
  
  private async runScenario(agentId: string, scenario: TestScenario): Promise<RunResult> {
    // Initialize the scenario
    const initialState = await this.toolAPIManager.initializeState(scenario.initialState);
    const expectedFinalState = scenario.expectedFinalState;
    
    // Initialize conversation
    let currentTurn = 0;
    let conversationHistory: Message[] = [];
    
    // Add initial user message
    const userInstruction = await this.userSimulator.generateInitialMessage(scenario);
    conversationHistory.push({
      role: 'user',
      content: userInstruction
    });
    
    // Run conversation until completion or max turns
    while (currentTurn < this.config.maxTurns) {
      // Get agent response
      const agentResponse = await this.getAgentResponse(agentId, conversationHistory);
      conversationHistory.push({
        role: 'assistant',
        content: agentResponse.message
      });
      
      // Process tool calls if any
      if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
        for (const toolCall of agentResponse.toolCalls) {
          const toolResult = await this.toolAPIManager.executeToolCall(toolCall);
          conversationHistory.push({
            role: 'tool',
            toolName: toolCall.name,
            content: JSON.stringify(toolResult)
          });
        }
      }
      
      // Check if task is complete
      const currentState = await this.toolAPIManager.getCurrentState();
      if (this.isTaskComplete(currentState, expectedFinalState)) {
        break;
      }
      
      // Generate next user message
      const nextUserMessage = await this.userSimulator.generateNextMessage(
        scenario, 
        conversationHistory,
        currentState
      );
      
      conversationHistory.push({
        role: 'user',
        content: nextUserMessage
      });
      
      currentTurn++;
    }
    
    // Evaluate the final state
    const finalState = await this.toolAPIManager.getCurrentState();
    const stateMatch = this.compareStates(finalState, expectedFinalState);
    
    // Evaluate policy adherence
    const policyAdherence = await this.policyEngine.evaluateConversation(
      conversationHistory,
      scenario.policies
    );
    
    // Return results
    return {
      success: stateMatch.success,
      stateMatchScore: stateMatch.score,
      policyAdherenceScore: policyAdherence.score,
      policyViolations: policyAdherence.violations,
      conversationLength: currentTurn + 1,
      conversation: conversationHistory
    };
  }
  
  private async getAgentResponse(agentId: string, conversation: Message[]): Promise<AgentResponse> {
    // Call the agent through Nexus
    return await this.nexusClient.callAgent(agentId, {
      conversation
    });
  }
  
  private isTaskComplete(currentState: any, expectedState: any): boolean {
    const comparison = this.compareStates(currentState, expectedState);
    return comparison.success;
  }
  
  private compareStates(currentState: any, expectedState: any): StateComparison {
    // Compare the current state with the expected state
    // Return success and a similarity score
    // Implementation depends on the specific domain
    return this.resultsAnalyzer.compareStates(currentState, expectedState);
  }
}
```

### 3.2 User Simulator

```typescript
// src/benchmarks/tau-bench/UserSimulator.ts

import { OllamaMCPAdapter } from '../../adapters/OllamaMCPAdapter';

export class UserSimulator {
  private ollamaAdapter: OllamaMCPAdapter;
  private config: TauBenchConfig;
  
  constructor(config: TauBenchConfig) {
    this.config = config;
    // Initialize Ollama adapter for LLM-based user simulation
  }
  
  async generateInitialMessage(scenario: TestScenario): Promise<string> {
    const prompt = `
You are simulating a user interacting with an AI assistant for the following scenario:
${scenario.description}

The user's goal is: ${scenario.userGoal}
The user's persona is: ${scenario.userPersona}

Generate the initial message from the user to the assistant that starts this conversation.
The message should be natural and conversational, as if a real person is talking.
Do not explicitly state all details at once - the assistant should need to ask follow-up questions.
`;
    
    const response = await this.ollamaAdapter.generateText(prompt, 'llama3', {
      temperature: 0.7,
      max_tokens: 200
    });
    
    return response;
  }
  
  async generateNextMessage(
    scenario: TestScenario,
    conversationHistory: Message[],
    currentState: any
  ): Promise<string> {
    const prompt = `
You are simulating a user interacting with an AI assistant for the following scenario:
${scenario.description}

The user's goal is: ${scenario.userGoal}
The user's persona is: ${scenario.userPersona}

Here is the conversation so far:
${this.formatConversation(conversationHistory)}

Current state of the system:
${JSON.stringify(currentState, null, 2)}

Generate the next message from the user to the assistant.
The message should be natural and conversational, as if a real person is talking.
Respond to what the assistant just said, and provide information if asked.
If the assistant has successfully completed the task, express satisfaction.
If the assistant is making errors, express confusion or frustration appropriately.
`;
    
    const response = await this.ollamaAdapter.generateText(prompt, 'llama3', {
      temperature: 0.7,
      max_tokens: 200
    });
    
    return response;
  }
  
  private formatConversation(conversation: Message[]): string {
    return conversation.map(msg => {
      if (msg.role === 'user') {
        return `User: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        return `Assistant: ${msg.content}`;
      } else if (msg.role === 'tool') {
        return `[Tool ${msg.toolName}]: ${msg.content}`;
      }
      return '';
    }).join('\n\n');
  }
}
```

### 3.3 Tool API Manager

```typescript
// src/benchmarks/tau-bench/ToolAPIManager.ts

export class ToolAPIManager {
  private domain: string;
  private currentState: any;
  
  constructor(domain: string) {
    this.domain = domain;
    this.currentState = {};
  }
  
  async initializeState(initialState: any): Promise<any> {
    // Initialize the state for the current scenario
    this.currentState = JSON.parse(JSON.stringify(initialState));
    return this.currentState;
  }
  
  async executeToolCall(toolCall: ToolCall): Promise<any> {
    // Execute the tool call and update the state
    const { name, parameters } = toolCall;
    
    // Handle different tools based on domain
    switch (this.domain) {
      case 'retail':
        return this.executeRetailTool(name, parameters);
      case 'airline':
        return this.executeAirlineTool(name, parameters);
      case 'finance':
        return this.executeFinanceTool(name, parameters);
      case 'healthcare':
        return this.executeHealthcareTool(name, parameters);
      default:
        throw new Error(`Unsupported domain: ${this.domain}`);
    }
  }
  
  async getCurrentState(): Promise<any> {
    return this.currentState;
  }
  
  // Domain-specific tool implementations
  private async executeRetailTool(name: string, parameters: any): Promise<any> {
    switch (name) {
      case 'search_products':
        return this.searchProducts(parameters);
      case 'get_product_details':
        return this.getProductDetails(parameters);
      case 'check_inventory':
        return this.checkInventory(parameters);
      case 'place_order':
        return this.placeOrder(parameters);
      case 'process_return':
        return this.processReturn(parameters);
      default:
        throw new Error(`Unsupported retail tool: ${name}`);
    }
  }
  
  // Implement specific tool functions for each domain
  private searchProducts(parameters: any): any {
    // Implementation for searching products
    // Update state and return results
  }
  
  // Additional tool implementations...
}
```

### 3.4 Policy Engine

```typescript
// src/benchmarks/tau-bench/PolicyEngine.ts

export class PolicyEngine {
  private domain: string;
  private strictness: 'low' | 'medium' | 'high';
  
  constructor(domain: string, strictness: 'low' | 'medium' | 'high') {
    this.domain = domain;
    this.strictness = strictness;
  }
  
  async evaluateConversation(
    conversation: Message[],
    policies: Policy[]
  ): Promise<PolicyEvaluation> {
    const violations: PolicyViolation[] = [];
    
    // Evaluate each policy
    for (const policy of policies) {
      const policyViolations = await this.evaluatePolicy(conversation, policy);
      violations.push(...policyViolations);
    }
    
    // Calculate overall score
    const score = this.calculatePolicyScore(violations, policies.length);
    
    return {
      score,
      violations
    };
  }
  
  private async evaluatePolicy(
    conversation: Message[],
    policy: Policy
  ): Promise<PolicyViolation[]> {
    // Evaluate a specific policy against the conversation
    // Implementation depends on the policy type
    
    const violations: PolicyViolation[] = [];
    
    // Check for policy violations in assistant messages
    for (let i = 0; i < conversation.length; i++) {
      const message = conversation[i];
      
      if (message.role !== 'assistant') {
        continue;
      }
      
      // Check if the message violates the policy
      const violates = await this.checkPolicyViolation(message.content, policy);
      
      if (violates) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          messageIndex: i,
          severity: policy.severity,
          description: `Violated policy: ${policy.description}`
        });
      }
    }
    
    return violations;
  }
  
  private async checkPolicyViolation(
    message: string,
    policy: Policy
  ): Promise<boolean> {
    // Check if a message violates a specific policy
    // Implementation depends on the policy type
    
    switch (policy.type) {
      case 'regex':
        return this.checkRegexPolicy(message, policy);
      case 'semantic':
        return this.checkSemanticPolicy(message, policy);
      case 'llm':
        return this.checkLLMPolicy(message, policy);
      default:
        throw new Error(`Unsupported policy type: ${policy.type}`);
    }
  }
  
  private checkRegexPolicy(message: string, policy: Policy): boolean {
    // Check if the message matches the regex pattern
    const regex = new RegExp(policy.pattern);
    return regex.test(message);
  }
  
  private async checkSemanticPolicy(message: string, policy: Policy): Promise<boolean> {
    // Check if the message semantically violates the policy
    // Implementation using embeddings or other semantic analysis
  }
  
  private async checkLLMPolicy(message: string, policy: Policy): Promise<boolean> {
    // Use an LLM to check if the message violates the policy
    // Implementation using Ollama or other LLM
  }
  
  private calculatePolicyScore(violations: PolicyViolation[], totalPolicies: number): number {
    // Calculate a score based on the number and severity of violations
    if (violations.length === 0) {
      return 1.0; // Perfect score
    }
    
    // Calculate weighted score based on severity
    let totalSeverity = 0;
    for (const violation of violations) {
      switch (violation.severity) {
        case 'low':
          totalSeverity += 1;
          break;
        case 'medium':
          totalSeverity += 2;
          break;
        case 'high':
          totalSeverity += 3;
          break;
        case 'critical':
          totalSeverity += 5;
          break;
      }
    }
    
    // Normalize score between 0 and 1
    const maxPossibleSeverity = totalPolicies * 5; // Assuming all policies could be critical
    const score = Math.max(0, 1 - (totalSeverity / maxPossibleSeverity));
    
    return score;
  }
}
```

## 4. Integration with Agent Tester

To integrate τ-bench with our existing AgentTester component:

```typescript
// src/agents/meta/AgentTester.ts

// Add τ-bench imports
import { TauBenchAdapter, TauBenchConfig } from '../../benchmarks/tau-bench/TauBenchAdapter';

export class AgentTester {
  // Existing code...
  
  // Add τ-bench adapter
  private tauBenchAdapter?: TauBenchAdapter;
  
  // Update initialize method
  public async initialize(): Promise<void> {
    logger.info('Initializing AgentTester...');
    
    try {
      // Existing initialization code...
      
      // Initialize τ-bench adapter if benchmark server is available
      try {
        const tauBenchConfig: TauBenchConfig = {
          domain: 'retail', // Default domain
          numRuns: 8, // For pass^8 calculation
          maxTurns: 20, // Maximum conversation turns
          policyStrictness: 'medium'
        };
        
        this.tauBenchAdapter = new TauBenchAdapter(this.nexusClient, tauBenchConfig);
        logger.info('τ-bench adapter initialized successfully');
      } catch (error) {
        logger.warn(`Failed to initialize τ-bench adapter: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      logger.info('AgentTester initialized successfully');
    } catch (error) {
      // Error handling...
    }
  }
  
  // Add method to run τ-bench
  public async runTauBench(
    implementation: AgentImplementation,
    domain: 'retail' | 'airline' | 'finance' | 'healthcare' = 'retail',
    numRuns: number = 8
  ): Promise<TauBenchResult> {
    logger.info(`Running τ-bench for agent: ${implementation.name} (${implementation.agentId})`);
    
    if (!this.tauBenchAdapter) {
      throw new Error('τ-bench adapter not initialized');
    }
    
    // Update configuration
    this.tauBenchAdapter.updateConfig({
      domain,
      numRuns,
      maxTurns: 20,
      policyStrictness: 'medium'
    });
    
    // Run the benchmark
    const result = await this.tauBenchAdapter.runBenchmark(implementation.agentId);
    
    logger.info(`τ-bench completed for ${implementation.name}`);
    logger.info(`Overall pass^${numRuns}: ${result.passK}`);
    
    return result;
  }
  
  // Update testAgent method to include τ-bench
  public async testAgent(implementation: AgentImplementation): Promise<AgentTestResults> {
    // Existing testing code...
    
    // Run τ-bench if available
    let tauBenchResults: TauBenchResult | undefined;
    if (this.tauBenchAdapter) {
      try {
        logger.info('Running τ-bench...');
        tauBenchResults = await this.runTauBench(implementation);
      } catch (error) {
        logger.error(`Error running τ-bench: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Create test results including τ-bench
    const testResults: AgentTestResults = {
      // Existing fields...
      tauBenchResults
    };
    
    return testResults;
  }
}
```

## 5. Implementation Timeline

### 5.1 Week 1: Core Components

1. Implement TauBenchAdapter
2. Implement UserSimulator
3. Create basic test scenarios

### 5.2 Week 2: Tool APIs and Policy Engine

1. Implement ToolAPIManager for retail domain
2. Implement PolicyEngine
3. Create retail-specific policies

### 5.3 Week 3: Integration and Testing

1. Integrate with AgentTester
2. Implement ResultsAnalyzer
3. Test with existing agents
4. Create documentation

## 6. Expected Outcomes

Implementing τ-bench integration will provide:

1. **Realistic Evaluation**: Testing agents in dynamic, interactive scenarios
2. **Reliability Metrics**: Measuring consistency through pass^k
3. **Policy Adherence**: Evaluating agents' ability to follow domain-specific policies
4. **Continuous Learning**: Providing detailed feedback for agent improvement

This implementation will significantly enhance our ability to evaluate and improve agents created by our AI Agent Factory.
