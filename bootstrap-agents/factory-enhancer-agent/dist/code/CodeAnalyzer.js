"use strict";
/**
 * Code Analyzer
 *
 * Analyzes code to identify issues, patterns, and opportunities for improvement.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CodeAnalyzer {
    constructor(adapterManager) {
        this.adapterManager = adapterManager;
    }
    /**
     * Analyze code
     */
    async analyzeCode(request) {
        bootstrap_core_1.logger.info(`Analyzing ${request.language} code${request.filePath ? ` in ${request.filePath}` : ''}`);
        try {
            let issues = [];
            let metrics = {};
            // Use Lucidity adapter if available
            const lucidityAdapter = this.adapterManager.getFirstLucidityAdapter();
            if (lucidityAdapter) {
                try {
                    const lucidityResult = await lucidityAdapter.analyzeCode(request.code, request.language);
                    // Convert Lucidity issues to our format
                    issues = this.convertLucidityIssues(lucidityResult.issues || []);
                    // Add metrics
                    metrics = lucidityResult.metrics || {};
                }
                catch (error) {
                    bootstrap_core_1.logger.warn(`Failed to analyze code with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // Use Ollama adapter as fallback or for additional analysis
            const ollamaAdapter = this.adapterManager.getFirstOllamaMCPAdapter();
            if (ollamaAdapter && (issues.length === 0 || request.analysisTypes.includes('maintainability'))) {
                try {
                    const ollamaIssues = await this.analyzeWithOllama(request);
                    // Add Ollama issues to our list
                    issues = [...issues, ...ollamaIssues];
                }
                catch (error) {
                    bootstrap_core_1.logger.warn(`Failed to analyze code with Ollama: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // Generate summary
            const summary = this.generateSummary(issues, metrics);
            return {
                issues,
                metrics,
                summary
            };
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Analyze a file
     */
    async analyzeFile(filePath, analysisTypes = ['quality', 'security', 'performance', 'maintainability']) {
        try {
            // Read file
            const code = fs.readFileSync(filePath, 'utf-8');
            // Determine language
            const extension = path.extname(filePath);
            let language = 'typescript';
            if (extension === '.js') {
                language = 'javascript';
            }
            else if (extension === '.py') {
                language = 'python';
            }
            // Analyze code
            return this.analyzeCode({
                code,
                language,
                analysisTypes,
                filePath
            });
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to analyze file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Analyze code with Ollama
     */
    async analyzeWithOllama(request) {
        const ollamaAdapter = this.adapterManager.getFirstOllamaMCPAdapter();
        if (!ollamaAdapter) {
            return [];
        }
        // Generate prompt
        const prompt = `
Analyze the following ${request.language} code for issues related to ${request.analysisTypes.join(', ')}:

\`\`\`${request.language}
${request.code}
\`\`\`

Identify any issues, problems, or areas for improvement in the code.
For each issue, provide:
1. The type (error, warning, or info)
2. The category (quality, security, performance, or maintainability)
3. A clear description of the issue
4. The line number if applicable
5. The severity (low, medium, high, or critical)
6. A suggestion for how to fix the issue

Format your response as a JSON array of issues:
[
  {
    "type": "error|warning|info",
    "category": "quality|security|performance|maintainability",
    "message": "Description of the issue",
    "line": 123,
    "severity": "low|medium|high|critical",
    "suggestion": "How to fix the issue"
  },
  ...
]

Only return the JSON array, no other text.
`;
        // Generate analysis
        const response = await ollamaAdapter.generateText(prompt, 'llama3', {
            temperature: 0.2,
            max_tokens: 2000
        });
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonMatch) {
                const issues = JSON.parse(jsonMatch[0]);
                return issues;
            }
        }
        catch (error) {
            bootstrap_core_1.logger.warn(`Failed to parse Ollama analysis response: ${error instanceof Error ? error.message : String(error)}`);
        }
        return [];
    }
    /**
     * Convert Lucidity issues to our format
     */
    convertLucidityIssues(lucidityIssues) {
        return lucidityIssues.map(issue => {
            // Map Lucidity issue type to our type
            let type = 'info';
            if (issue.severity === 'error') {
                type = 'error';
            }
            else if (issue.severity === 'warning') {
                type = 'warning';
            }
            // Map Lucidity issue category to our category
            let category = 'quality';
            if (issue.type === 'security') {
                category = 'security';
            }
            else if (issue.type === 'performance') {
                category = 'performance';
            }
            else if (issue.type === 'maintainability') {
                category = 'maintainability';
            }
            // Map Lucidity issue severity to our severity
            let severity = 'medium';
            if (issue.severity === 'info') {
                severity = 'low';
            }
            else if (issue.severity === 'warning') {
                severity = 'medium';
            }
            else if (issue.severity === 'error') {
                severity = 'high';
            }
            else if (issue.severity === 'critical') {
                severity = 'critical';
            }
            return {
                type,
                category,
                message: issue.message,
                line: issue.line,
                column: issue.column,
                severity,
                suggestion: issue.fix
            };
        });
    }
    /**
     * Generate a summary of the analysis
     */
    generateSummary(issues, metrics) {
        // Count issues by type and severity
        const counts = {
            error: 0,
            warning: 0,
            info: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };
        for (const issue of issues) {
            counts[issue.type]++;
            counts[issue.severity]++;
        }
        // Generate summary
        let summary = `Found ${issues.length} issues: ${counts.error} errors, ${counts.warning} warnings, ${counts.info} info items. `;
        summary += `Severity breakdown: ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`;
        // Add metrics if available
        if (Object.keys(metrics).length > 0) {
            summary += ' Metrics: ';
            for (const [key, value] of Object.entries(metrics)) {
                summary += `${key}: ${value}, `;
            }
            // Remove trailing comma and space
            summary = summary.slice(0, -2);
        }
        return summary;
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
