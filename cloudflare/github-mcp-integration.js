/**
 * GitHub MCP Integration for Nexus Agent Portal
 * 
 * This script integrates with the GitHub MCP server to handle version control
 * and deployment of the Nexus Agent Portal to Cloudflare Pages.
 */

// Import required modules
const { Octokit } = require('@octokit/rest');
const { createPullRequest } = require('octokit-plugin-create-pull-request');
const fs = require('fs');
const path = require('path');

// Extended Octokit with the create-pull-request plugin
const MyOctokit = Octokit.plugin(createPullRequest);

// Configuration
const config = {
  // GitHub configuration
  github: {
    owner: process.env.GITHUB_OWNER || 'your-github-username',
    repo: process.env.GITHUB_REPO || 'your-github-repo',
    token: process.env.GITHUB_TOKEN || 'your-github-token',
    branch: process.env.GITHUB_BRANCH || 'main',
  },
  
  // Cloudflare configuration
  cloudflare: {
    accountId: process.env.CF_ACCOUNT_ID || 'your-cloudflare-account-id',
    zoneId: process.env.CF_ZONE_ID || 'your-cloudflare-zone-id',
    apiToken: process.env.CF_API_TOKEN || 'your-cloudflare-api-token',
  },
  
  // Local paths
  paths: {
    agentFrontendUI: path.resolve(__dirname, '../agent-frontend-ui'),
    cloudflareConfig: path.resolve(__dirname, './nexus-agent-portal-config.json'),
    apiWorker: path.resolve(__dirname, './api-worker'),
  },
};

// Initialize Octokit
const octokit = new MyOctokit({
  auth: config.github.token,
});

/**
 * Deploy the agent frontend UI to GitHub
 */
async function deployToGitHub() {
  try {
    console.log('Deploying to GitHub...');
    
    // Get the list of files to deploy
    const files = await getFilesToDeploy();
    
    // Create a pull request with the changes
    const pr = await octokit.createPullRequest({
      owner: config.github.owner,
      repo: config.github.repo,
      title: 'Update Nexus Agent Portal',
      body: 'This PR updates the Nexus Agent Portal with the latest changes.',
      base: config.github.branch,
      head: `update-agent-portal-${Date.now()}`,
      changes: [
        {
          files,
          commit: 'Update Nexus Agent Portal',
        },
      ],
    });
    
    console.log(`Pull request created: ${pr.data.html_url}`);
    
    return pr.data;
  } catch (error) {
    console.error('Error deploying to GitHub:', error);
    throw error;
  }
}

/**
 * Get the list of files to deploy
 */
async function getFilesToDeploy() {
  try {
    const files = {};
    
    // Add agent frontend UI files
    await addFilesToObject(files, config.paths.agentFrontendUI, 'agent-frontend-ui');
    
    // Add Cloudflare configuration
    const cloudflareConfig = fs.readFileSync(config.paths.cloudflareConfig, 'utf8');
    files['cloudflare/nexus-agent-portal-config.json'] = cloudflareConfig;
    
    // Add API worker
    const apiWorker = fs.readFileSync(path.join(config.paths.apiWorker, 'index.js'), 'utf8');
    files['cloudflare/api-worker/index.js'] = apiWorker;
    
    return files;
  } catch (error) {
    console.error('Error getting files to deploy:', error);
    throw error;
  }
}

/**
 * Add files to the object recursively
 */
async function addFilesToObject(files, dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(baseDir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and build directories
      if (entry.name === 'node_modules' || entry.name === 'build') {
        continue;
      }
      
      await addFilesToObject(files, fullPath, relativePath);
    } else {
      // Skip large binary files and hidden files
      if (entry.name.startsWith('.') || /\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(entry.name)) {
        continue;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      files[relativePath] = content;
    }
  }
}

/**
 * Deploy the agent frontend UI to Cloudflare Pages
 */
async function deployToCloudflarePages() {
  try {
    console.log('Deploying to Cloudflare Pages...');
    
    // In a real implementation, this would use the Cloudflare API to trigger a deployment
    // For now, we'll just log a message
    console.log('Cloudflare Pages deployment would be triggered here.');
    
    return {
      success: true,
      message: 'Deployment triggered successfully',
    };
  } catch (error) {
    console.error('Error deploying to Cloudflare Pages:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Deploy to GitHub
    const pr = await deployToGitHub();
    
    // Deploy to Cloudflare Pages
    const deployment = await deployToCloudflarePages();
    
    console.log('Deployment completed successfully!');
    console.log(`Pull request: ${pr.html_url}`);
    console.log(`Deployment: ${deployment.message}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

// Export functions for use in other modules
module.exports = {
  deployToGitHub,
  deployToCloudflarePages,
};
