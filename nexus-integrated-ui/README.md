# Nexus Integrated UI

This is the integrated UI for the Nexus system, combining the agent frontend UI with the existing Nexus UI components.

## Features

- **Agent Management**: Create, edit, and manage AI agents
- **Task Management**: Create, assign, and track tasks for agents
- **Benchmark Management**: Run and compare benchmarks for agents
- **MCP Server Management**: Register and manage MCP servers
- **Documentation**: Access and search documentation
- **Settings**: Configure application settings and user profile

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/nexus-integrated-ui.git
   cd nexus-integrated-ui
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_MCP_HUB_URL=http://localhost:8000
   REACT_APP_DOCS_URL=http://localhost:3002
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nexus-integrated-ui/
├── public/                  # Static assets
├── src/
│   ├── components/          # Shared UI components
│   │   ├── common/          # Common UI elements
│   │   ├── layout/          # Layout components
│   │   ├── agents/          # Agent-related components
│   │   ├── tasks/           # Task-related components
│   │   ├── benchmarks/      # Benchmark-related components
│   │   ├── docs/            # Documentation components
│   │   └── nexus/           # Nexus-related components
│   ├── contexts/            # React contexts (Auth, etc.)
│   ├── pages/               # Page components
│   │   ├── agents/          # Agent-related pages
│   │   ├── tasks/           # Task-related pages
│   │   ├── benchmarks/      # Benchmark-related pages
│   │   ├── docs/            # Documentation pages
│   │   ├── settings/        # Settings pages
│   │   ├── auth/            # Authentication pages
│   │   └── mcp/             # MCP-related pages
│   ├── services/            # API services
│   ├── styles/              # Global styles
│   ├── utils/               # Utility functions
│   ├── App.js               # Main App component
│   └── index.js             # Entry point
└── package.json             # Dependencies
```

## Development

### Available Scripts

- `npm start`: Starts the development server
- `npm test`: Runs tests
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

### Authentication

For development, the following credentials can be used:

- Email: admin@example.com
- Password: password

### API Integration

The application uses mock API responses in development mode. In production, it will connect to the actual API endpoints.

## Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Deploy the contents of the `build` directory to your web server or hosting service.

## Integration with Nexus System

This UI is designed to integrate with the Nexus system, which includes:

- **Nexus Hub**: The central hub for managing MCP servers
- **MCP Servers**: Various Model Context Protocol servers
- **Documentation Library**: Documentation for the Nexus system
- **VS Code Extension**: Extension for VS Code integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [React Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com/)
