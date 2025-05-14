/**
 * Feedback Analyzer
 * 
 * Analyzes feedback to identify patterns, trends, and insights.
 */

import { logger } from 'bootstrap-core';
import { Feedback } from './FeedbackManager';

export interface FeedbackAnalysis {
  agentId: string;
  feedbackCount: number;
  feedbackByType: Record<string, number>;
  feedbackBySource: Record<string, number>;
  commonTags: { tag: string; count: number }[];
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
    overall: number;
  };
  topIssues: { issue: string; count: number }[];
  topStrengths: { strength: string; count: number }[];
  recommendations: string[];
  timestamp: string;
}

export class FeedbackAnalyzer {
  constructor() {}
  
  /**
   * Analyze feedback
   */
  public async analyzeFeedback(feedbacks: Feedback[]): Promise<FeedbackAnalysis> {
    logger.info(`Analyzing ${feedbacks.length} feedback items`);
    
    try {
      // Group feedback by agent
      const feedbackByAgent = new Map<string, Feedback[]>();
      
      for (const feedback of feedbacks) {
        if (!feedbackByAgent.has(feedback.agentId)) {
          feedbackByAgent.set(feedback.agentId, []);
        }
        
        feedbackByAgent.get(feedback.agentId)!.push(feedback);
      }
      
      // Process each agent's feedback
      const results: FeedbackAnalysis[] = [];
      
      for (const [agentId, agentFeedbacks] of feedbackByAgent.entries()) {
        // Count feedback by type
        const feedbackByType: Record<string, number> = {};
        
        for (const feedback of agentFeedbacks) {
          feedbackByType[feedback.type] = (feedbackByType[feedback.type] || 0) + 1;
        }
        
        // Count feedback by source
        const feedbackBySource: Record<string, number> = {};
        
        for (const feedback of agentFeedbacks) {
          feedbackBySource[feedback.source] = (feedbackBySource[feedback.source] || 0) + 1;
        }
        
        // Count tags
        const tagCounts = new Map<string, number>();
        
        for (const feedback of agentFeedbacks) {
          if (feedback.metadata?.tags) {
            for (const tag of feedback.metadata.tags) {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
          }
        }
        
        // Get common tags
        const commonTags = Array.from(tagCounts.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        // Perform sentiment analysis
        const sentimentAnalysis = {
          positive: feedbackByType['positive'] || 0,
          negative: feedbackByType['negative'] || 0,
          neutral: (feedbackByType['neutral'] || 0) + (feedbackByType['suggestion'] || 0),
          overall: 0
        };
        
        // Calculate overall sentiment
        const totalFeedback = agentFeedbacks.length;
        sentimentAnalysis.overall = totalFeedback > 0
          ? (sentimentAnalysis.positive - sentimentAnalysis.negative) / totalFeedback
          : 0;
        
        // Identify top issues
        const issues = this.extractIssues(agentFeedbacks);
        const topIssues = Array.from(issues.entries())
          .map(([issue, count]) => ({ issue, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Identify top strengths
        const strengths = this.extractStrengths(agentFeedbacks);
        const topStrengths = Array.from(strengths.entries())
          .map(([strength, count]) => ({ strength, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(
          agentFeedbacks,
          topIssues,
          topStrengths,
          sentimentAnalysis
        );
        
        // Create analysis
        const analysis: FeedbackAnalysis = {
          agentId,
          feedbackCount: agentFeedbacks.length,
          feedbackByType,
          feedbackBySource,
          commonTags,
          sentimentAnalysis,
          topIssues,
          topStrengths,
          recommendations,
          timestamp: new Date().toISOString()
        };
        
        results.push(analysis);
      }
      
      // Return the first result (we should only have one agent's feedback)
      return results[0] || {
        agentId: 'unknown',
        feedbackCount: 0,
        feedbackByType: {},
        feedbackBySource: {},
        commonTags: [],
        sentimentAnalysis: {
          positive: 0,
          negative: 0,
          neutral: 0,
          overall: 0
        },
        topIssues: [],
        topStrengths: [],
        recommendations: [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to analyze feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Extract issues from feedback
   */
  private extractIssues(feedbacks: Feedback[]): Map<string, number> {
    const issues = new Map<string, number>();
    
    // This is a placeholder implementation
    // In a real implementation, we would use NLP or other techniques to extract issues
    
    // Look for negative feedback
    const negativeFeedback = feedbacks.filter(f => f.type === 'negative');
    
    for (const feedback of negativeFeedback) {
      // Simple keyword extraction
      const keywords = this.extractKeywords(feedback.content);
      
      for (const keyword of keywords) {
        issues.set(keyword, (issues.get(keyword) || 0) + 1);
      }
    }
    
    return issues;
  }
  
  /**
   * Extract strengths from feedback
   */
  private extractStrengths(feedbacks: Feedback[]): Map<string, number> {
    const strengths = new Map<string, number>();
    
    // This is a placeholder implementation
    // In a real implementation, we would use NLP or other techniques to extract strengths
    
    // Look for positive feedback
    const positiveFeedback = feedbacks.filter(f => f.type === 'positive');
    
    for (const feedback of positiveFeedback) {
      // Simple keyword extraction
      const keywords = this.extractKeywords(feedback.content);
      
      for (const keyword of keywords) {
        strengths.set(keyword, (strengths.get(keyword) || 0) + 1);
      }
    }
    
    return strengths;
  }
  
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // This is a very simple implementation
    // In a real implementation, we would use NLP techniques
    
    // Split text into words
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    // Remove common stop words
    const stopWords = new Set([
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
      'his', 'from', 'they', 'she', 'will', 'would', 'there', 'their', 'what',
      'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take',
      'person', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'than',
      'then', 'look', 'only', 'come', 'over', 'think', 'also', 'back', 'after'
    ]);
    
    return words.filter(w => !stopWords.has(w));
  }
  
  /**
   * Generate recommendations based on feedback analysis
   */
  private generateRecommendations(
    feedbacks: Feedback[],
    topIssues: { issue: string; count: number }[],
    topStrengths: { strength: string; count: number }[],
    sentimentAnalysis: any
  ): string[] {
    const recommendations: string[] = [];
    
    // This is a placeholder implementation
    // In a real implementation, we would use more sophisticated techniques
    
    // Add recommendations based on sentiment
    if (sentimentAnalysis.overall < -0.2) {
      recommendations.push('Focus on addressing negative feedback to improve overall sentiment');
    }
    
    // Add recommendations based on top issues
    if (topIssues.length > 0) {
      recommendations.push(`Address the top issue: ${topIssues[0].issue}`);
    }
    
    // Add recommendations based on top strengths
    if (topStrengths.length > 0) {
      recommendations.push(`Leverage the top strength: ${topStrengths[0].strength}`);
    }
    
    // Add general recommendations
    if (feedbacks.length < 10) {
      recommendations.push('Collect more feedback to improve analysis accuracy');
    }
    
    return recommendations;
  }
}
