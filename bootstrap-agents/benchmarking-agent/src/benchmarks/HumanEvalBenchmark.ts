/**
 * HumanEval Benchmark
 *
 * Implements the HumanEval benchmark for evaluating code generation capabilities.
 */

import {
  AdapterManager,
  OllamaMCPAdapter,
  BenchmarkMCPAdapter,
  logger
} from 'bootstrap-core';
import { BenchmarkResult, BenchmarkOptions } from './BenchmarkFramework';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface HumanEvalProblem {
  task_id: string;
  prompt: string;
  entry_point: string;
  test: string;
  language: string;
}

export interface HumanEvalSolution {
  task_id: string;
  solution: string;
  language: string;
  passed: boolean;
  error?: string;
}

export class HumanEvalBenchmark {
  private adapterManager: AdapterManager;
  private ollamaAdapter?: OllamaMCPAdapter;
  private benchmarkAdapter?: BenchmarkMCPAdapter;
  private problems: Map<string, HumanEvalProblem> = new Map();
  private dataPath: string;

  constructor(adapterManager: AdapterManager) {
    this.adapterManager = adapterManager;
    this.ollamaAdapter = adapterManager.getFirstOllamaMCPAdapter();
    this.benchmarkAdapter = adapterManager.getFirstBenchmarkAdapter();
    this.dataPath = path.join(process.cwd(), 'data', 'humaneval');
  }

  /**
   * Initialize the benchmark
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing HumanEval benchmark...');

    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataPath)) {
        fs.mkdirSync(this.dataPath, { recursive: true });
      }

      // Load problems
      await this.loadProblems();

      logger.info(`HumanEval benchmark initialized with ${this.problems.size} problems`);
    } catch (error) {
      logger.error(`Failed to initialize HumanEval benchmark: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Load HumanEval problems
   */
  private async loadProblems(): Promise<void> {
    try {
      // Check if problems file exists
      const problemsPath = path.join(this.dataPath, 'problems.json');

      if (fs.existsSync(problemsPath)) {
        // Load problems from file
        const problemsData = JSON.parse(fs.readFileSync(problemsPath, 'utf-8'));

        for (const problem of problemsData) {
          this.problems.set(problem.task_id, problem);
        }

        logger.info(`Loaded ${this.problems.size} problems from file`);
      } else {
        // Generate sample problems
        await this.generateSampleProblems();

        logger.info(`Generated ${this.problems.size} sample problems`);
      }
    } catch (error) {
      logger.error(`Failed to load problems: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate sample HumanEval problems
   */
  private async generateSampleProblems(): Promise<void> {
    try {
      // Generate sample problems
      const sampleProblems: HumanEvalProblem[] = [
        {
          task_id: 'HumanEval_0',
          prompt: 'def has_close_elements(numbers: List[float], threshold: float) -> bool:\n    """ Check if in given list of numbers, are any two numbers closer to each other than\n    given threshold.\n    >>> has_close_elements([1.0, 2.0, 3.0], 0.5)\n    False\n    >>> has_close_elements([1.0, 2.8, 3.0, 4.0, 5.0, 2.0], 0.3)\n    True\n    """\n',
          entry_point: 'has_close_elements',
          test: 'def check(candidate):\n    assert candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.3) == True\n    assert candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.05) == False\n    assert candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.95) == True\n    assert candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.8) == False\n    assert candidate([1.0, 2.0, 3.0, 4.0, 5.0, 2.0], 0.1) == True\n    assert candidate([1.1, 2.2, 3.1, 4.1, 5.1], 1.0) == True\n    assert candidate([1.1, 2.2, 3.1, 4.1, 5.1], 0.5) == False\n',
          language: 'python'
        },
        {
          task_id: 'HumanEval_1',
          prompt: 'def separate_paren_groups(paren_string: str) -> List[str]:\n    """ Input to this function is a string containing multiple groups of nested parentheses. Your goal is to\n    separate those group into separate strings and return the list of those.\n    Separate groups are balanced (each open brace is properly closed) and not nested within each other\n    Ignore any spaces in the input string.\n    >>> separate_paren_groups(\'( ) (( )) (( )( ))\')\n    [\'()\', \'(())\', \'(()())\']\n    """\n',
          entry_point: 'separate_paren_groups',
          test: 'def check(candidate):\n    assert candidate("(()()) ((())) () ((())()())") == ["(()())", "((()))", "()", "((())()())"]\n    assert candidate("() (()) ((())) (((())))") == ["()", "(())", "((()))", "(((())))"]\n    assert candidate("(()(())((())))") == ["(()(())((())))"]',
          language: 'python'
        },
        {
          task_id: 'HumanEval_2',
          prompt: 'def truncate_number(number: float) -> float:\n    """ Given a positive floating point number, it can be decomposed into\n    and integer part (largest integer smaller than given number) and decimals\n    (leftover part always smaller than 1).\n\n    Return the decimal part of the number.\n    >>> truncate_number(3.5)\n    0.5\n    """\n',
          entry_point: 'truncate_number',
          test: 'def check(candidate):\n    assert candidate(3.5) == 0.5\n    assert candidate(1.33) == 0.33\n    assert candidate(123.456) == 0.456',
          language: 'python'
        }
      ];

      // Save problems
      for (const problem of sampleProblems) {
        this.problems.set(problem.task_id, problem);
      }

      // Save to file
      const problemsPath = path.join(this.dataPath, 'problems.json');
      fs.writeFileSync(problemsPath, JSON.stringify(Array.from(this.problems.values()), null, 2));
    } catch (error) {
      logger.error(`Failed to generate sample problems: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Run the benchmark
   */
  public async runBenchmark(
    agentId: string,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    logger.info(`Running HumanEval benchmark for agent ${agentId}`);

    try {
      // Set default options
      const benchmarkOptions: BenchmarkOptions = {
        language: options.language || 'python',
        timeout: options.timeout || 30000,
        maxAttempts: options.maxAttempts || 1,
        passAtK: options.passAtK || [1],
        ...options
      };

      // Get problems for the specified language
      const languageProblems = Array.from(this.problems.values())
        .filter(problem => problem.language === benchmarkOptions.language);

      if (languageProblems.length === 0) {
        throw new Error(`No problems found for language: ${benchmarkOptions.language}`);
      }

      // Solve problems
      const solutions: HumanEvalSolution[] = [];

      for (const problem of languageProblems) {
        try {
          const solution = await this.solveProblem(agentId, problem, benchmarkOptions);
          solutions.push(solution);
        } catch (error) {
          logger.error(`Failed to solve problem ${problem.task_id}: ${error instanceof Error ? error.message : String(error)}`);

          // Add failed solution
          solutions.push({
            task_id: problem.task_id,
            solution: '',
            language: problem.language,
            passed: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Calculate pass@k
      const passAtK: Record<string, number> = {};

      for (const k of benchmarkOptions.passAtK!) {
        passAtK[`pass@${k}`] = this.calculatePassAtK(solutions, k);
      }

      // Calculate overall score
      const score = passAtK[`pass@1`] || 0;

      // Create result
      const result: BenchmarkResult = {
        agentId,
        benchmarkType: 'humaneval',
        score,
        metrics: {
          ...passAtK,
          totalProblems: languageProblems.length,
          solvedProblems: solutions.filter(s => s.passed).length
        },
        details: {
          language: benchmarkOptions.language,
          problems: languageProblems.map(p => p.task_id),
          solutions: solutions.map(s => ({
            task_id: s.task_id,
            passed: s.passed,
            error: s.error
          }))
        },
        timestamp: new Date().toISOString()
      };

      logger.info(`HumanEval benchmark completed for agent ${agentId} with score ${score}`);

      return result;
    } catch (error) {
      logger.error(`Failed to run HumanEval benchmark: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Solve a HumanEval problem
   */
  private async solveProblem(
    agentId: string,
    problem: HumanEvalProblem,
    options: BenchmarkOptions
  ): Promise<HumanEvalSolution> {
    logger.info(`Solving problem ${problem.task_id}`);

    try {
      // Generate solution
      const solution = await this.generateSolution(agentId, problem, options);

      // Evaluate solution
      const passed = await this.evaluateSolution(problem, solution);

      return {
        task_id: problem.task_id,
        solution,
        language: problem.language,
        passed
      };
    } catch (error) {
      logger.error(`Failed to solve problem ${problem.task_id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate a solution for a HumanEval problem
   */
  private async generateSolution(
    agentId: string,
    problem: HumanEvalProblem,
    options: BenchmarkOptions
  ): Promise<string> {
    try {
      // Use benchmark adapter if available
      if (this.benchmarkAdapter) {
        return await this.benchmarkAdapter.generateSolution(agentId, problem.prompt, problem.language);
      }

      // Use Ollama adapter as fallback
      if (this.ollamaAdapter) {
        const prompt = `
You are an expert ${problem.language} programmer. Solve the following coding problem:

${problem.prompt}

Provide only the code for the solution, no explanations or comments.
`;

        return await this.ollamaAdapter.generateCode(prompt, problem.language);
      }

      throw new Error('No adapter available for generating solutions');
    } catch (error) {
      logger.error(`Failed to generate solution: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Evaluate a solution for a HumanEval problem
   */
  private async evaluateSolution(
    problem: HumanEvalProblem,
    solution: string
  ): Promise<boolean> {
    try {
      // Create a temporary directory for evaluation
      const evalDir = path.join(this.dataPath, 'eval', crypto.randomBytes(8).toString('hex'));

      if (!fs.existsSync(evalDir)) {
        fs.mkdirSync(evalDir, { recursive: true });
      }

      // Create solution file
      const solutionPath = path.join(evalDir, `solution.${problem.language === 'python' ? 'py' : 'js'}`);
      fs.writeFileSync(solutionPath, solution);

      // Create test file
      const testPath = path.join(evalDir, `test.${problem.language === 'python' ? 'py' : 'js'}`);

      if (problem.language === 'python') {
        const testContent = `
import sys
sys.path.append('${evalDir}')
from solution import ${problem.entry_point}

${problem.test}

if __name__ == '__main__':
    try:
        check(${problem.entry_point})
        print('PASSED')
    except AssertionError as e:
        print(f'FAILED: {e}')
        sys.exit(1)
`;

        fs.writeFileSync(testPath, testContent);

        // Run test
        try {
          await execAsync(`python ${testPath}`, { timeout: 10000 });
          return true;
        } catch (error) {
          logger.debug(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
          return false;
        }
      } else {
        // For JavaScript/TypeScript
        // This is a simplified implementation
        return false;
      }
    } catch (error) {
      logger.error(`Failed to evaluate solution: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Calculate pass@k metric
   */
  private calculatePassAtK(solutions: HumanEvalSolution[], k: number): number {
    // Count passed solutions
    const passedCount = solutions.filter(s => s.passed).length;

    // Calculate pass@k
    // This is a simplified implementation
    // In a real implementation, we would generate k solutions for each problem
    return passedCount / solutions.length;
  }
}
