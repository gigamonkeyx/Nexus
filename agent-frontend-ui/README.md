# Nexus Agent Frontend UI

A beautiful and efficient information portal for the Nexus MCP Hub, providing a remote UI for managing AI agents.

## Overview

The Nexus Agent Frontend UI is a React-based web application that provides a user-friendly interface for interacting with the Nexus MCP Hub and its AI agents. It is designed to be hosted on Cloudflare Pages, allowing for remote access to the Nexus MCP Hub while keeping the MCP workloads running locally.

## Features

- **Agent Management**: Create, configure, and monitor AI agents
- **Task Management**: Create, assign, and track tasks for agents
- **Benchmark Tools**: Run and analyze benchmarks to evaluate agent performance
- **MCP Server Management**: View and manage connected MCP servers
- **User Authentication**: Secure access with user authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Get real-time updates on agent and task status

## Architecture

The Nexus Agent Frontend UI is built with the following architecture:

- **Frontend**: React application with Material-UI for the user interface
- **API Proxy**: Cloudflare Worker that handles authentication and routing
- **GitHub Integration**: GitHub MCP for version control and deployment
- **Cloudflare Pages**: Hosting platform for the frontend UI

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 7.x or higher
- A Cloudflare account (free tier is sufficient)
- A GitHub account and repository

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo/agent-frontend-ui
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following variables:

```
REACT_APP_API_URL=https://api.nexus-mcp.workers.dev
REACT_APP_WS_URL=wss://api.nexus-mcp.workers.dev
REACT_APP_CF_ZONE_ID=your-cloudflare-zone-id
REACT_APP_GITHUB_OWNER=your-github-username
REACT_APP_GITHUB_REPO=your-github-repo
```

4. Start the development server:

```bash
npm start
```

### Deployment

#### Deploying to Cloudflare Pages

1. Set up a Cloudflare Pages project:

   - Go to the Cloudflare Dashboard
   - Navigate to Pages
   - Click "Create a project"
   - Connect your GitHub repository
   - Configure the build settings:
     - Build command: `npm run build`
     - Build directory: `build`
     - Root directory: `agent-frontend-ui`

2. Set up environment variables in the Cloudflare Pages project:

   - REACT_APP_API_URL
   - REACT_APP_WS_URL
   - REACT_APP_CF_ZONE_ID
   - REACT_APP_GITHUB_OWNER
   - REACT_APP_GITHUB_REPO

3. Deploy the Cloudflare Worker for the API proxy:

   - Navigate to the `cloudflare/api-worker` directory
   - Deploy the worker using Wrangler:

   ```bash
   wrangler publish
   ```

4. Configure the Cloudflare Pages project to use the API Worker:

   - Go to the Cloudflare Dashboard
   - Navigate to Pages
   - Select your project
   - Go to Settings > Functions
   - Add a route:
     - Pattern: `/api/*`
     - Service: `api-worker`

## Development

### Project Structure

```
agent-frontend-ui/
├── public/                 # Public assets
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── common/         # Common components
│   │   ├── agents/         # Agent-related components
│   │   ├── tasks/          # Task-related components
│   │   └── benchmarks/     # Benchmark-related components
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main App component
│   ├── index.js            # Entry point
│   └── config.js           # Configuration
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── README.md               # Documentation
```

### Available Scripts

- `npm start`: Start the development server
- `npm build`: Build the production version
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

## Integration with Nexus MCP Hub

The Nexus Agent Frontend UI integrates with the Nexus MCP Hub through the API proxy. The API proxy handles authentication and routing, and communicates with the local MCP servers.

### API Endpoints

- `/api/auth/*`: Authentication endpoints
- `/api/agents/*`: Agent management endpoints
- `/api/tasks/*`: Task management endpoints
- `/api/benchmarks/*`: Benchmark endpoints
- `/api/servers/*`: MCP server management endpoints

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
