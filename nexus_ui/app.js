// Nexus Hub UI JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Server status updates
    updateServerStatus();

    // Activity log updates
    updateActivityLog();

    // Initialize charts
    initCharts();

    // Initialize code editor
    initCodeEditor();
});

// Update server status
function updateServerStatus() {
    // In a real implementation, this would fetch data from the API
    console.log('Updating server status...');

    // Simulate API call
    fetch('/api/servers')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Server status updated:', data);
            // Update UI with server status
        })
        .catch(error => {
            console.error('Error updating server status:', error);
        });
}

// Update activity log
function updateActivityLog() {
    // In a real implementation, this would fetch data from the API
    console.log('Updating activity log...');

    // Simulate API call
    fetch('/api/activity')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Activity log updated:', data);
            // Update UI with activity log
        })
        .catch(error => {
            console.error('Error updating activity log:', error);
        });
}

// Initialize charts
function initCharts() {
    // Server usage chart
    const serverUsageCtx = document.getElementById('serverUsageChart');
    if (serverUsageCtx) {
        const serverUsageChart = new Chart(serverUsageCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Server Usage',
                    data: [65, 59, 80, 81, 56, 55],
                    fill: false,
                    borderColor: '#4f46e5',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Tool usage chart
    const toolUsageCtx = document.getElementById('toolUsageChart');
    if (toolUsageCtx) {
        const toolUsageChart = new Chart(toolUsageCtx, {
            type: 'doughnut',
            data: {
                labels: ['Format Code', 'Analyze Code', 'Generate Docstring', 'Visualize Analysis'],
                datasets: [{
                    label: 'Tool Usage',
                    data: [12, 19, 3, 5],
                    backgroundColor: [
                        '#4f46e5',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Connect to server
function connectToServer(serverId) {
    console.log(`Connecting to server: ${serverId}`);

    // Show loading state
    const connectButton = document.querySelector(`#server-${serverId} .connect-button`);
    if (connectButton) {
        connectButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
        connectButton.disabled = true;
    }

    // Simulate API call
    fetch(`/api/servers/${serverId}/connect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Connected to server:', data);

            // Update UI
            if (connectButton) {
                connectButton.innerHTML = 'Connected';
                connectButton.classList.remove('btn-primary');
                connectButton.classList.add('btn-success');
            }

            // Show success message
            showNotification('success', `Connected to ${data.name} server`);
        })
        .catch(error => {
            console.error('Error connecting to server:', error);

            // Reset button
            if (connectButton) {
                connectButton.innerHTML = 'Connect';
                connectButton.disabled = false;
            }

            // Show error message
            showNotification('error', `Failed to connect to server: ${error.message}`);
        });
}

// Initialize code editor
function initCodeEditor() {
    const languageSelector = document.getElementById('language-selector');
    const toolSelector = document.getElementById('tool-selector');
    const codeInput = document.getElementById('code-input');
    const codeOutput = document.getElementById('code-output');
    const runToolButton = document.getElementById('run-tool');

    // Sample code for each language
    const sampleCode = {
        python: `def hello_world():
    print("Hello, world!")

for i in range(10):
    print(i)
    if i % 2 == 0:
        print("Even")
    else:
        print("Odd")`,
        javascript: `function helloWorld() {
    console.log("Hello, world!");
}

for (let i = 0; i < 10; i++) {
    console.log(i);
    if (i % 2 === 0) {
        console.log("Even");
    } else {
        console.log("Odd");
    }
}`,
        typescript: `function helloWorld(): void {
    console.log("Hello, world!");
}

for (let i: number = 0; i < 10; i++) {
    console.log(i);
    if (i % 2 === 0) {
        console.log("Even");
    } else {
        console.log("Odd");
    }
}`,
        java: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, world!");

        for (int i = 0; i < 10; i++) {
            System.out.println(i);
            if (i % 2 == 0) {
                System.out.println("Even");
            } else {
                System.out.println("Odd");
            }
        }
    }
}`
    };

    // Set initial sample code
    codeInput.value = sampleCode[languageSelector.value];

    // Update sample code when language changes
    languageSelector.addEventListener('change', () => {
        codeInput.value = sampleCode[languageSelector.value];
    });

    // Run tool when button is clicked
    runToolButton.addEventListener('click', () => {
        const language = languageSelector.value;
        const tool = toolSelector.value;
        const code = codeInput.value;

        // Show loading state
        codeOutput.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

        // Call the tool
        callTool(tool, language, code)
            .then(result => {
                // Display the result
                displayToolResult(tool, result);
            })
            .catch(error => {
                // Display the error
                codeOutput.innerHTML = `<div class="text-danger">${error.message}</div>`;
            });
    });
}

// Call a tool
async function callTool(tool, language, code) {
    // In a real implementation, this would call the API
    console.log(`Calling tool: ${tool} for language: ${language}`);

    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                let result;

                switch (tool) {
                    case 'format_code':
                        result = {
                            formatted_code: formatCode(code, language),
                            language: language,
                            success: true,
                            message: `Code formatted successfully using ${language} formatter`
                        };
                        break;
                    case 'analyze_code':
                        result = analyzeCode(code, language);
                        break;
                    case 'visualize_code_analysis':
                        result = visualizeCodeAnalysis(code, language);
                        break;
                    case 'generate_docstring':
                        result = generateDocstring(code, language);
                        break;
                    default:
                        reject(new Error(`Unknown tool: ${tool}`));
                        return;
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, 1000);
    });
}

// Display tool result
function displayToolResult(tool, result) {
    const codeOutput = document.getElementById('code-output');

    switch (tool) {
        case 'format_code':
            codeOutput.innerHTML = `<pre>${escapeHtml(result.formatted_code)}</pre>`;
            break;
        case 'analyze_code':
            let issuesHtml = '';

            if (result.issues.length === 0) {
                issuesHtml = '<div class="text-success">No issues found!</div>';
            } else {
                issuesHtml = '<div class="issues">';
                for (const issue of result.issues) {
                    issuesHtml += `
                        <div class="issue ${issue.severity}">
                            <div class="issue-header">
                                <span class="badge bg-${getSeverityColor(issue.severity)}">${issue.severity}</span>
                                <span class="issue-location">Line ${issue.line}, Column ${issue.column}</span>
                            </div>
                            <div class="issue-message">${issue.message}</div>
                            ${issue.suggestion ? `<div class="issue-suggestion">Suggestion: ${issue.suggestion}</div>` : ''}
                        </div>
                    `;
                }
                issuesHtml += '</div>';
            }

            const metricsHtml = `
                <div class="metrics mt-3">
                    <h5>Metrics</h5>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="metric">
                                <div class="metric-name">Lines of Code</div>
                                <div class="metric-value">${result.metrics.lines_of_code}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="metric">
                                <div class="metric-name">Complexity</div>
                                <div class="metric-value">${result.metrics.complexity}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="metric">
                                <div class="metric-name">Maintainability</div>
                                <div class="metric-value">${result.metrics.maintainability}/100</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            codeOutput.innerHTML = `
                <div class="analysis-result">
                    <h5>Issues</h5>
                    ${issuesHtml}
                    ${metricsHtml}
                </div>
            `;
            break;
        case 'visualize_code_analysis':
            codeOutput.innerHTML = `<pre>${result.visualization}</pre>`;
            break;
        case 'generate_docstring':
            codeOutput.innerHTML = `<pre>${escapeHtml(result.docstring)}</pre>`;
            break;
        default:
            codeOutput.innerHTML = `<div class="text-danger">Unknown tool: ${tool}</div>`;
    }
}

// Helper functions for the demo
function formatCode(code, language) {
    // This is a simplified formatter for demo purposes
    const lines = code.split('\n');
    const formattedLines = [];
    let indentLevel = 0;

    for (const line of lines) {
        const stripped = line.trim();

        // Skip empty lines
        if (!stripped) {
            formattedLines.push('');
            continue;
        }

        // Handle indentation based on language
        if (language === 'python') {
            // Python-specific formatting
            if (stripped.endsWith(':')) {
                formattedLines.push('    '.repeat(indentLevel) + stripped);
                indentLevel++;
            } else if (stripped.startsWith(('return', 'break', 'continue', 'pass'))) {
                if (indentLevel > 0) {
                    indentLevel--;
                }
                formattedLines.push('    '.repeat(indentLevel) + stripped);
            } else {
                formattedLines.push('    '.repeat(indentLevel) + stripped);
            }
        } else {
            // JavaScript/TypeScript/Java formatting
            if (stripped.endsWith('{')) {
                formattedLines.push('    '.repeat(indentLevel) + stripped);
                indentLevel++;
            } else if (stripped.startsWith('}')) {
                if (indentLevel > 0) {
                    indentLevel--;
                }
                formattedLines.push('    '.repeat(indentLevel) + stripped);
            } else {
                formattedLines.push('    '.repeat(indentLevel) + stripped);
            }
        }
    }

    return formattedLines.join('\n');
}

function analyzeCode(code, language) {
    // This is a simplified analyzer for demo purposes
    const lines = code.split('\n');
    const issues = [];

    // Check for various issues based on language
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (language === 'python') {
            // Python-specific issues
            if (line.includes('import *')) {
                issues.push({
                    line: lineNum,
                    column: line.indexOf('import *'),
                    message: 'Wildcard imports should be avoided',
                    severity: 'warning',
                    suggestion: 'Import specific modules or functions instead'
                });
            }

            if (line.includes('print(')) {
                issues.push({
                    line: lineNum,
                    column: line.indexOf('print('),
                    message: 'Print statements found',
                    severity: 'info',
                    suggestion: 'Consider using logging instead of print statements in production code'
                });
            }
        } else if (language === 'javascript' || language === 'typescript') {
            // JavaScript/TypeScript-specific issues
            if (line.includes('console.log(')) {
                issues.push({
                    line: lineNum,
                    column: line.indexOf('console.log('),
                    message: 'Console.log statements found',
                    severity: 'info',
                    suggestion: 'Remove console.log statements in production code'
                });
            }

            if (language === 'javascript' && line.includes('var ')) {
                issues.push({
                    line: lineNum,
                    column: line.indexOf('var '),
                    message: 'Var keyword used',
                    severity: 'warning',
                    suggestion: 'Use let or const instead of var for better scoping'
                });
            }
        } else if (language === 'java') {
            // Java-specific issues
            if (line.includes('System.out.println(')) {
                issues.push({
                    line: lineNum,
                    column: line.indexOf('System.out.println('),
                    message: 'System.out.println statements found',
                    severity: 'info',
                    suggestion: 'Use a logging framework instead of System.out.println in production code'
                });
            }
        }

        // Check for long lines (common issue for all languages)
        if (line.length > 80) {
            issues.push({
                line: lineNum,
                column: 80,
                message: 'Line too long',
                severity: 'info',
                suggestion: 'Keep lines under 80 characters for better readability'
            });
        }
    }

    // Calculate metrics
    const metrics = {
        lines_of_code: lines.length,
        complexity: calculateComplexity(code, language),
        maintainability: 0
    };

    // Calculate maintainability score (simplified)
    metrics.maintainability = Math.max(0, 100 - metrics.complexity * 5);

    return {
        issues,
        suggestions: issues.map(issue => issue.suggestion).filter(Boolean),
        metrics,
        language,
        summary: `Found ${issues.length} issues in ${metrics.lines_of_code} lines of code`,
        maintainability_score: metrics.maintainability
    };
}

function calculateComplexity(code, language) {
    // This is a simplified complexity calculator for demo purposes
    const lines = code.split('\n');
    let complexity = 0;

    for (const line of lines) {
        if (language === 'python') {
            // Python-specific complexity
            if (line.includes('if ') || line.includes('for ') || line.includes('while ') ||
                line.includes('def ') || line.includes('class ')) {
                complexity++;
            }
        } else if (language === 'javascript' || language === 'typescript') {
            // JavaScript/TypeScript-specific complexity
            if (line.includes('if ') || line.includes('for ') || line.includes('while ') ||
                line.includes('function ') || line.includes('class ')) {
                complexity++;
            }
        } else if (language === 'java') {
            // Java-specific complexity
            if (line.includes('if ') || line.includes('for ') || line.includes('while ') ||
                line.includes('switch ') || line.includes('case ') || line.includes('class ')) {
                complexity++;
            }
        }
    }

    return complexity;
}

function visualizeCodeAnalysis(code, language) {
    // Analyze the code first
    const analysisResult = analyzeCode(code, language);

    // Generate a simple ASCII visualization
    const lines = code.split('\n');

    // Create a visualization of issues by line
    let visualization = [];

    // Header
    visualization.push('Code Analysis Visualization');
    visualization.push('='.repeat(50));
    visualization.push(`Language: ${language}`);
    visualization.push(`Lines of code: ${analysisResult.metrics.lines_of_code}`);
    visualization.push(`Complexity: ${analysisResult.metrics.complexity}`);
    visualization.push(`Maintainability: ${analysisResult.metrics.maintainability}/100`);
    visualization.push('-'.repeat(50));

    // Issues by line
    visualization.push('Issues by line:');

    // Group issues by line
    const issuesByLine = {};
    for (const issue of analysisResult.issues) {
        if (!issuesByLine[issue.line]) {
            issuesByLine[issue.line] = [];
        }
        issuesByLine[issue.line].push(issue);
    }

    // Generate visualization
    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i];
        const lineIssues = issuesByLine[lineNum] || [];

        if (lineIssues.length > 0) {
            // Line with issues
            const severityMarkers = {
                error: 'E',
                warning: 'W',
                info: 'I'
            };

            const markers = lineIssues.map(issue => severityMarkers[issue.severity] || '?').join('');
            visualization.push(`${lineNum.toString().padStart(4)} | ${markers} | ${line.substring(0, 50)}`);

            // Add issue details
            for (const issue of lineIssues) {
                visualization.push(`      | ${issue.severity.toUpperCase()} | ${issue.message}`);
                if (issue.suggestion) {
                    visualization.push(`      |   | Suggestion: ${issue.suggestion}`);
                }
            }
        } else {
            // Line without issues
            visualization.push(`${lineNum.toString().padStart(4)} |   | ${line.substring(0, 50)}`);
        }
    }

    visualization.push('-'.repeat(50));

    // Summary
    const errorCount = analysisResult.issues.filter(issue => issue.severity === 'error').length;
    const warningCount = analysisResult.issues.filter(issue => issue.severity === 'warning').length;
    const infoCount = analysisResult.issues.filter(issue => issue.severity === 'info').length;

    visualization.push(`Summary: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`);

    return {
        visualization: visualization.join('\n'),
        metrics: analysisResult.metrics,
        issues_count: analysisResult.issues.length,
        language
    };
}

function generateDocstring(code, language) {
    // This is a simplified docstring generator for demo purposes
    let docstring = '';

    if (language === 'python') {
        // Python docstring (Google style)
        docstring = '"""Function description.\n\nArgs:\n    param1: Description of param1.\n    param2: Description of param2.\n\nReturns:\n    Description of return value.\n"""';
    } else if (language === 'javascript' || language === 'typescript') {
        // JavaScript/TypeScript docstring (JSDoc style)
        docstring = '/**\n * Function description\n * \n * @param {any} param1 - Description of param1\n * @param {any} param2 - Description of param2\n * @returns {any} Description of return value\n */';
    } else if (language === 'java') {
        // Java docstring (Javadoc style)
        docstring = '/**\n * Function description\n * \n * @param param1 Description of param1\n * @param param2 Description of param2\n * @return Description of return value\n */';
    }

    return {
        docstring,
        language,
        style: language === 'python' ? 'google' : (language === 'java' ? 'javadoc' : 'jsdoc'),
        success: true,
        message: `Docstring generated successfully for ${language}`
    };
}

// Helper function to get severity color
function getSeverityColor(severity) {
    switch (severity) {
        case 'error':
            return 'danger';
        case 'warning':
            return 'warning';
        case 'info':
            return 'info';
        default:
            return 'secondary';
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Show notification
function showNotification(type, message) {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.getElementById('notification-container').appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 150);
    }, 5000);
}
