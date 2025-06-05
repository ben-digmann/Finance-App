# Finance & Budgeting Application

A secure full-stack application that connects to financial accounts via Plaid, categorizes transactions, and provides the foundation for personal finance management.

## Features (v0 Production Release)

- **Secure User Authentication**: Register and log in securely with JWT tokens
- **Connect Financial Accounts**: Link bank accounts, credit cards, and more via Plaid Link
- **Transaction Synchronization**: Automatically fetch transactions from linked accounts
- **Transaction Categorization**: Basic categorization with optional AI-assisted labeling
- **Account Dashboard**: View all accounts and balances in one place
- **Transaction Management**: View, search, and sort your transactions
- **Financial Summary**: See budgets, assets, and net worth at a glance
- **Secure API**: Well-designed backend with proper security controls
- **Dockerized Environment**: Easy local development and deployment
- **AI Chat**: Ask natural language questions about your finances

## Technology Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Context API for state management
- Chart.js for data visualization
- React Plaid Link for Plaid integration
- Responsive CSS design

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL with Sequelize ORM
- JWT-based authentication
- Plaid API integration
- OpenAI API for transaction categorization
- Optional LLM service for AI-powered chat

### Infrastructure
- Docker containers for consistent development and deployment
- CI/CD pipeline with GitHub Actions
- PostgreSQL database with data persistence
- NGINX for production frontend serving

## Project Structure

The project follows a modern, modular architecture:

```
finance-app/
├── frontend/            # React frontend application
│   ├── src/             # Source code
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service modules
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
│
├── backend/             # Node.js backend application
│   ├── src/             # Source code
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Sequelize data models
│   │   ├── routes/      # API route definitions
│   │   ├── services/    # Business logic services
│   │   └── utils/       # Utility functions
│   └── tests/           # Test files (following TDD)
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── docs/                # Documentation
│   ├── api.md           # API documentation
│   ├── architecture.md  # Architecture overview
│   ├── deployment.md    # Deployment guide
│   ├── security.md      # Security considerations
│   ├── setup.md         # Developer setup guide
│   └── testing.md       # Testing strategy
│
├── infrastructure/      # Infrastructure configuration
│   ├── local/           # Local development setup
│   └── cloud/           # Cloud deployment files
│
├── docker-compose.yml         # Local development Docker Compose
└── docker-compose.prod.yml    # Production Docker Compose
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- Plaid Developer Account (free Sandbox tier is sufficient to start)
- OpenAI API Key (optional for transaction categorization)
- LLM_API_URL and LLM_API_TOKEN if using the built-in chat feature

Set `LLM_API_URL` to the endpoint of your language model service and
`LLM_API_TOKEN` to the associated bearer token.

### Setting Up Plaid API Access (Required)

1. Sign up for a free Plaid developer account at [https://dashboard.plaid.com/signup](https://dashboard.plaid.com/signup)
2. Create a new project in the Plaid dashboard
3. Under the "Team Settings" > "Keys", you'll find your:
   - Client ID
   - Sandbox Secret
4. Copy these values to use in your `.env` file or when running the application

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd finance-app
```

2. Create a `.env` file in the root directory with your Plaid credentials:
```
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
OPENAI_API_KEY=your_openai_api_key_optional
```

3. Start the development environment:
```bash
docker-compose up
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - PgAdmin (Database Manager): http://localhost:5050
     - Email: admin@example.com
     - Password: admin

5. Connect to Plaid sandbox:
   - Use Plaid's sandbox credentials when prompted during account linking:
     - Username: `user_good`
     - Password: `pass_good`
     - Or see [Plaid's test credentials documentation](https://plaid.com/docs/sandbox/test-credentials/) for more options

For more detailed setup instructions, see the [Setup Guide](./docs/setup.md).

### Running in a Codex Container

1. Copy `.env.codex` to `.env`:
   ```bash
   cp .env.codex .env
   ```
2. Run the helper script to install dependencies and start Postgres:
   ```bash
   ./codex_setup.sh
   ```
3. In separate terminals start the backend and frontend:
   ```bash
   cd backend && npm run dev
   ```
   ```bash
   cd frontend && npm start
   ```

## Testing

This project follows Test-Driven Development (TDD) principles with comprehensive test coverage.

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run end-to-end tests
cd frontend
npm run test:e2e
```

For more details on our testing approach, see the [Testing Strategy](./docs/testing.md).

## Deployment

For deployment instructions, see the [Deployment Guide](./docs/deployment.md).

## Security

The application implements robust security measures to protect sensitive financial data:

- All sensitive data is encrypted at rest
- Secure JWT-based authentication
- HTTPS/TLS for all data in transit
- Proper authorization controls to isolate user data
- Secure Plaid token handling

For more details on security measures, see the [Security Documentation](./docs/security.md).

## Documentation

- [API Documentation](./docs/api.md)
- [Architecture Overview](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Considerations](./docs/security.md)
- [Setup Guide](./docs/setup.md)
- [Testing Strategy](./docs/testing.md)

## Setting Up Your Own GitHub Repository

1. Create a new GitHub repository (private is recommended for financial applications)

2. Initialize git and connect to your repository:
```bash
# From the project root
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

3. **IMPORTANT**: Verify that your `.env` file is NOT included in your commit. This file contains your Plaid API credentials and should never be committed to the repository.

4. For team collaboration, each developer should:
   - Clone the repository
   - Copy `.env.example` to `.env`
   - Add their own Plaid API credentials to the `.env` file
   - Run `docker-compose up` to start the application

5. For CI/CD pipelines, use environment secrets in your GitHub repository settings instead of committing sensitive values.

## License

This project is licensed under a [Personal Use License](LICENSE) that allows free use for personal, educational, and non-commercial purposes only. Commercial use requires explicit permission from the copyright holder.

Key points:
- ✅ Free for personal use and learning
- ✅ You can modify it for personal projects
- ✅ You can share your modifications (with the same license)
- ❌ Commercial use is not permitted without explicit permission
- ❌ You cannot sell this software or derivative works