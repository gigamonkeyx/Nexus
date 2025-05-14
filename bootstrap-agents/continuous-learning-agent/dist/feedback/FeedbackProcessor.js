"use strict";
/**
 * Feedback Processor
 *
 * Processes feedback to extract insights and generate learning data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackProcessor = void 0;
const bootstrap_core_1 = require("bootstrap-core");
class FeedbackProcessor {
    constructor() { }
    /**
     * Process feedback
     */
    async processFeedback(feedback) {
        bootstrap_core_1.logger.debug(`Processing feedback ${feedback.id} for agent ${feedback.agentId}`);
        try {
            // Extract insights from feedback
            const insights = await this.extractInsights(feedback);
            // Log insights
            bootstrap_core_1.logger.debug(`Extracted insights from feedback ${feedback.id}: ${JSON.stringify(insights)}`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to process feedback ${feedback.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Extract insights from feedback
     */
    async extractInsights(feedback) {
        // This is a placeholder implementation
        // In a real implementation, we would use NLP or other techniques to extract insights
        const insights = {
            feedbackId: feedback.id,
            agentId: feedback.agentId,
            type: feedback.type,
            source: feedback.source,
            timestamp: feedback.timestamp,
            insights: []
        };
        // Extract insights based on feedback type
        if (feedback.type === 'positive') {
            insights.insights.push({
                type: 'strength',
                description: 'Positive feedback indicates a strength',
                confidence: 0.8
            });
        }
        else if (feedback.type === 'negative') {
            insights.insights.push({
                type: 'weakness',
                description: 'Negative feedback indicates a weakness',
                confidence: 0.8
            });
        }
        else if (feedback.type === 'suggestion') {
            insights.insights.push({
                type: 'improvement',
                description: 'Suggestion feedback indicates an area for improvement',
                confidence: 0.8
            });
        }
        // Extract insights from content
        if (feedback.content.includes('error')) {
            insights.insights.push({
                type: 'issue',
                description: 'Feedback mentions errors',
                confidence: 0.9
            });
        }
        if (feedback.content.includes('slow') || feedback.content.includes('performance')) {
            insights.insights.push({
                type: 'performance',
                description: 'Feedback mentions performance issues',
                confidence: 0.7
            });
        }
        return insights;
    }
    /**
     * Generate learning data from feedback
     */
    async generateLearningData(feedbacks) {
        bootstrap_core_1.logger.info(`Generating learning data from ${feedbacks.length} feedback items`);
        try {
            // Group feedback by agent
            const feedbackByAgent = new Map();
            for (const feedback of feedbacks) {
                if (!feedbackByAgent.has(feedback.agentId)) {
                    feedbackByAgent.set(feedback.agentId, []);
                }
                feedbackByAgent.get(feedback.agentId).push(feedback);
            }
            // Process each agent's feedback
            const results = [];
            for (const [agentId, agentFeedbacks] of feedbackByAgent.entries()) {
                const examples = await this.generateExamplesFromFeedback(agentFeedbacks);
                results.push({
                    agentId,
                    examples,
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        feedbackCount: agentFeedbacks.length
                    }
                });
            }
            // Return the first result (we should only have one agent's feedback)
            return results[0] || {
                agentId: 'unknown',
                examples: [],
                metadata: {
                    generatedAt: new Date().toISOString(),
                    feedbackCount: 0
                }
            };
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to generate learning data: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Generate examples from feedback
     */
    async generateExamplesFromFeedback(feedbacks) {
        const examples = [];
        for (const feedback of feedbacks) {
            // Only process feedback with context
            if (!feedback.context) {
                continue;
            }
            // Extract input and output from context
            const input = feedback.context.input;
            const output = feedback.context.output;
            if (!input || !output) {
                continue;
            }
            // Create example
            const example = {
                input,
                expectedOutput: output,
                context: {
                    task: feedback.context.task,
                    timestamp: feedback.context.timestamp
                },
                metadata: {
                    feedbackId: feedback.id,
                    feedbackType: feedback.type,
                    feedbackSource: feedback.source,
                    tags: feedback.metadata?.tags || []
                }
            };
            examples.push(example);
        }
        return examples;
    }
}
exports.FeedbackProcessor = FeedbackProcessor;
