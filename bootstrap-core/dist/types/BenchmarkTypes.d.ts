/**
 * Benchmark Types
 *
 * Defines types related to benchmarking and agent evaluation.
 */
/**
 * Benchmark result
 */
export interface BenchmarkResult {
    id: string;
    agentId: string;
    benchmarkType: string;
    score: number;
    metrics: Record<string, any>;
    details: any;
    timestamp: string;
}
/**
 * Benchmark request
 */
export interface BenchmarkRequest {
    agentId: string;
    benchmarkType: string;
    options?: Record<string, any>;
}
/**
 * Benchmark response
 */
export interface BenchmarkResponse {
    benchmarkId: string;
    status: 'success' | 'error';
    message?: string;
}
/**
 * HumanEval benchmark result
 */
export interface HumanEvalBenchmarkResult extends BenchmarkResult {
    metrics: {
        pass_at_k: Record<string, number>;
        average_time_per_problem: number;
        completion_rate: number;
        error_rate: number;
        [key: string]: any;
    };
    details: {
        problems: {
            id: string;
            name: string;
            passed: boolean;
            time_taken: number;
            error?: string;
            solution?: string;
        }[];
        [key: string]: any;
    };
}
/**
 * τ-Bench benchmark result
 */
export interface TauBenchBenchmarkResult extends BenchmarkResult {
    metrics: {
        reasoning_score: number;
        planning_score: number;
        adaptation_score: number;
        overall_score: number;
        [key: string]: any;
    };
    details: {
        scenarios: {
            id: string;
            name: string;
            reasoning_score: number;
            planning_score: number;
            adaptation_score: number;
            overall_score: number;
            notes?: string;
        }[];
        [key: string]: any;
    };
}
/**
 * Agent comparison result
 */
export interface AgentComparisonResult {
    id: string;
    agents: {
        agentId: string;
        name: string;
        type: string;
    }[];
    benchmarks: {
        benchmarkType: string;
        results: {
            agentId: string;
            score: number;
            metrics: Record<string, any>;
        }[];
    }[];
    analysis: {
        strengths: Record<string, string[]>;
        weaknesses: Record<string, string[]>;
        recommendations: Record<string, string[]>;
    };
    timestamp: string;
}
/**
 * Improvement recommendation
 */
export interface ImprovementRecommendation {
    id: string;
    agentId: string;
    benchmarkId: string;
    area: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    implementationSuggestion?: string;
    status: 'pending' | 'in_progress' | 'implemented' | 'rejected';
    timestamp: string;
}
/**
 * Agent performance history
 */
export interface AgentPerformanceHistory {
    agentId: string;
    benchmarks: {
        benchmarkType: string;
        results: {
            benchmarkId: string;
            score: number;
            timestamp: string;
        }[];
    }[];
    improvements: {
        recommendationId: string;
        area: string;
        status: 'pending' | 'in_progress' | 'implemented' | 'rejected';
        timestamp: string;
    }[];
    versions: {
        versionId: string;
        changes: string[];
        timestamp: string;
    }[];
}
/**
 * Benchmark configuration
 */
export interface BenchmarkConfiguration {
    id: string;
    name: string;
    description: string;
    type: string;
    parameters: Record<string, any>;
    evaluationCriteria: {
        name: string;
        description: string;
        weight: number;
        evaluationFunction?: string;
    }[];
    version: string;
    timestamp: string;
}
