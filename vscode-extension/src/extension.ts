import * as vscode from 'vscode';
import { NexusClient } from './nexus-client';
import { ServerProvider } from './server-provider';
import { ToolProvider } from './tool-provider';

// Global extension state
let nexusClient: NexusClient;
let serverProvider: ServerProvider;
let toolProvider: ToolProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating Augment Nexus Client extension');

    // Create Nexus client
    nexusClient = new NexusClient();

    // Create providers
    serverProvider = new ServerProvider(nexusClient);
    toolProvider = new ToolProvider(nexusClient);

    // Register tree views
    vscode.window.registerTreeDataProvider('augmentNexusServers', serverProvider);
    vscode.window.registerTreeDataProvider('augmentNexusTools', toolProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('augment-nexus-client.connect', async () => {
            await nexusClient.connect();
        }),

        vscode.commands.registerCommand('augment-nexus-client.disconnect', async () => {
            await nexusClient.disconnect();
        }),

        vscode.commands.registerCommand('augment-nexus-client.refreshServers', () => {
            serverProvider.refresh();
        }),

        vscode.commands.registerCommand('augment-nexus-client.callServer', async (server) => {
            // Show quick pick for method
            const method = await vscode.window.showQuickPick([
                'resources/list',
                'tools/list',
                'prompts/list',
                'server/describe'
            ], {
                placeHolder: 'Select method to call'
            });

            if (!method) {
                return;
            }

            try {
                // Call server method
                const response = await nexusClient.callServer(server.id, method);

                // Show response in output channel
                const outputChannel = vscode.window.createOutputChannel('Nexus Server Response');
                outputChannel.clear();
                outputChannel.appendLine(`Response from ${server.label} (${method}):`);
                outputChannel.appendLine(JSON.stringify(response, null, 2));
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Error calling server: ${error.message}`);
            }
        }),

        vscode.commands.registerCommand('augment-nexus-client.callTool', async (tool) => {
            // Get active editor
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No active editor');
                return;
            }

            // Get selected text or entire document
            const selection = editor.selection;
            const text = selection.isEmpty ?
                editor.document.getText() :
                editor.document.getText(selection);

            try {
                // Show progress
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Calling tool ${tool.name} on ${tool.serverName}...`,
                    cancellable: false
                }, async (progress) => {
                    // Call tool
                    const response = await nexusClient.callServer(
                        tool.serverId,
                        'tools/call',
                        {
                            name: tool.name,
                            input: text
                        }
                    );

                    // Handle response
                    if (response.result?.output) {
                        // Show quick pick for action
                        const action = await vscode.window.showQuickPick([
                            'Insert at cursor',
                            'Replace selection',
                            'Show in output channel'
                        ], {
                            placeHolder: 'What would you like to do with the result?'
                        });

                        if (!action) {
                            return;
                        }

                        if (action === 'Insert at cursor') {
                            editor.edit(editBuilder => {
                                editBuilder.insert(selection.active, response.result.output);
                            });
                        } else if (action === 'Replace selection') {
                            editor.edit(editBuilder => {
                                editBuilder.replace(selection, response.result.output);
                            });
                        } else {
                            // Show in output channel
                            const outputChannel = vscode.window.createOutputChannel('Nexus Tool Response');
                            outputChannel.clear();
                            outputChannel.appendLine(`Response from ${tool.serverName} (${tool.name}):`);
                            outputChannel.appendLine(response.result.output);
                            outputChannel.show();
                        }
                    } else {
                        // Show response in output channel
                        const outputChannel = vscode.window.createOutputChannel('Nexus Tool Response');
                        outputChannel.clear();
                        outputChannel.appendLine(`Response from ${tool.serverName} (${tool.name}):`);
                        outputChannel.appendLine(JSON.stringify(response.result, null, 2));
                        outputChannel.show();
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error calling tool: ${error.message}`);
            }
        })
    );

    // Register Augment command to use Nexus
    context.subscriptions.push(
        vscode.commands.registerCommand('augment-nexus-client.augmentWithNexus', async () => {
            // Check if connected
            if (!nexusClient.isConnected()) {
                const connect = await vscode.window.showInformationMessage(
                    'Not connected to Nexus Hub. Connect now?',
                    'Connect',
                    'Cancel'
                );

                if (connect !== 'Connect') {
                    return;
                }

                const connected = await nexusClient.connect();
                if (!connected) {
                    return;
                }
            }

            // Get active editor
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No active editor');
                return;
            }

            // Get selected text or entire document
            const selection = editor.selection;
            const text = selection.isEmpty ?
                editor.document.getText() :
                editor.document.getText(selection);

            // Get available servers
            const servers = await nexusClient.getServers();

            // Show server picker
            const serverItems = servers.map(server => ({
                label: server.name || server.id,
                description: server.id,
                server
            }));

            const selectedServer = await vscode.window.showQuickPick(serverItems, {
                placeHolder: 'Select server to use'
            });

            if (!selectedServer) {
                return;
            }

            try {
                // Show progress
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Processing with ${selectedServer.label}...`,
                    cancellable: false
                }, async (progress) => {
                    // Call server method based on server type
                    let response;

                    // Determine method based on server capabilities
                    const describeResponse = await nexusClient.callServer(
                        selectedServer.server.id,
                        'server/describe',
                        {}
                    );

                    const capabilities = describeResponse.result?.capabilities || [];

                    if (capabilities.includes('sampling')) {
                        // Use sampling for text generation
                        response = await nexusClient.callServer(
                            selectedServer.server.id,
                            'sampling/text',
                            {
                                prompt: text,
                                max_tokens: 1000
                            }
                        );

                        // Insert response at cursor
                        if (response.result?.text) {
                            editor.edit(editBuilder => {
                                if (selection.isEmpty) {
                                    // Insert at cursor
                                    editBuilder.insert(selection.active, response.result.text);
                                } else {
                                    // Replace selection
                                    editBuilder.replace(selection, response.result.text);
                                }
                            });
                        }
                    } else if (capabilities.includes('tools')) {
                        // Use tools
                        response = await nexusClient.callServer(
                            selectedServer.server.id,
                            'tools/call',
                            {
                                tool: 'process_code',
                                input: text
                            }
                        );

                        // Show response in output channel
                        const outputChannel = vscode.window.createOutputChannel('Augment Nexus Response');
                        outputChannel.clear();
                        outputChannel.appendLine(`Response from ${selectedServer.label}:`);
                        outputChannel.appendLine(JSON.stringify(response.result, null, 2));
                        outputChannel.show();
                    } else {
                        vscode.window.showInformationMessage(`Server ${selectedServer.label} doesn't support text processing`);
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error processing with Nexus: ${error.message}`);
            }
        })
    );

    // Add Augment with Nexus to editor context menu
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('augment-nexus-client.augmentSelection', async (textEditor) => {
            await vscode.commands.executeCommand('augment-nexus-client.augmentWithNexus');
        })
    );

    // Try to connect automatically if we have a token
    const token = vscode.workspace.getConfiguration('augmentNexusClient').get('token') as string;
    if (token) {
        nexusClient.connect().catch(error => {
            console.error('Error auto-connecting to Nexus Hub:', error);
        });
    }
}

export function deactivate() {
    // Clean up resources
    if (nexusClient) {
        nexusClient.dispose();
    }
}
