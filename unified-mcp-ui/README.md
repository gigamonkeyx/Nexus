# Unified MCP Portal

A beautiful and efficient unified interface for the Documentation Library and Nexus Hub MCP systems.

## Overview

This project provides a single, cohesive UI for interacting with both the Documentation Library and Nexus Hub systems. It allows users to:

- Browse and search documentation
- Manage MCP servers
- Execute tools on MCP servers
- Access both systems through a unified authentication system

## Features

- **Beautiful Material UI Design**: Modern, responsive interface with dark mode support
- **Unified Authentication**: Single sign-on for both Documentation Library and Nexus Hub
- **Documentation Management**: Browse, search, create, and edit documentation
- **Server Management**: Register, start, stop, and monitor MCP servers
- **Tool Execution**: Execute tools on MCP servers and view results

## Architecture

The Unified MCP Portal is built with:

- **React**: Frontend library for building the user interface
- **Material UI**: Component library for consistent, beautiful design
- **React Query**: Data fetching and caching library
- **React Router**: Navigation and routing
- **Cloudflare Pages**: Hosting and deployment
- **Cloudflare Tunnel**: Secure connection to backend services

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Access to Documentation Library and Nexus Hub APIs

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/unified-mcp-ui.git
   cd unified-mcp-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your API URLs:
   ```
   REACT_APP_DOCS_API_URL=https://docs-library.yourdomain.com
   REACT_APP_NEXUS_API_URL=https://nexus.yourdomain.com/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Deployment

### Deploying to Cloudflare Pages

1. Push your code to a GitHub repository
2. Connect the repository to Cloudflare Pages
3. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `build`
4. Add environment variables:
   - `REACT_APP_DOCS_API_URL`: Your Documentation Library API URL
   - `REACT_APP_NEXUS_API_URL`: Your Nexus Hub API URL

## Backend Configuration

### Cloudflare Tunnel Configuration

Update your existing Cloudflare Tunnel configuration to include both services:

```yaml
tunnel: 60730e8e-c212-40d5-bdca-b0e4e9bf724e
credentials-file: ./credentials.json

ingress:
  # Documentation Library MCP server
  - hostname: docs-library.yourdomain.com
    service: http://localhost:8010
    
  # Nexus Hub server
  - hostname: nexus.yourdomain.com
    service: http://localhost:8000
    
  # Catch-all rule
  - service: http_status:404
```

### CORS Configuration

Ensure both backend services have CORS configured to allow requests from your Cloudflare Pages domain:

```
https://unified-mcp-ui.pages.dev
```

## Project Structure

```
unified-mcp-ui/
├── public/                  # Static files
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/          # Shared components
│   │   ├── docs/            # Documentation components
│   │   └── nexus/           # Nexus Hub components
│   ├── contexts/            # React contexts
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── App.jsx              # Main application component
│   └── index.jsx            # Entry point
└── package.json             # Dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
