# Developer Setup Guide

This guide will help you set up the Finance App development environment on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Docker** and **Docker Compose**
- **Git**

You'll also need accounts for the following services:

- **Plaid** (Developer account for API access)
- **OpenAI** (API access for transaction categorization)

## Getting the Code

1. Clone the repository:

```bash
git clone https://github.com/yourusername/finance-app.git
cd finance-app
```

## Environment Configuration

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Update the `.env` file with your Plaid and OpenAI credentials:

```
# Database (used by Docker Compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=financeapp

# Backend
DATABASE_URL=postgres://postgres:password@db:5432/financeapp
JWT_SECRET=dev_jwt_secret_replace_in_production
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox
OPENAI_API_KEY=your_openai_api_key

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
```

## Plaid Setup

1. Sign up for a Plaid developer account at [https://dashboard.plaid.com/signup](https://dashboard.plaid.com/signup)

2. Create a new Plaid app in the dashboard

3. Get your client ID and Sandbox secret from the Plaid dashboard

4. Insert these values in your `.env` file

## OpenAI Setup

1. Sign up for an OpenAI account at [https://platform.openai.com/signup](https://platform.openai.com/signup)

2. Generate an API key in the OpenAI dashboard

3. Insert this key in your `.env` file

## Starting the Application

### Using Docker (Recommended)

1. Build and start the containers:

```bash
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- Backend server on port 8000
- Frontend development server on port 3000

2. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

3. To stop the application:

```bash
docker-compose down
```

### Running Locally (Without Docker)

#### Database Setup

1. Install and configure PostgreSQL on your machine

2. Create a new database:

```bash
createdb financeapp
```

3. Update your `.env` file with the local database connection string:

```
DATABASE_URL=postgres://yourusername:yourpassword@localhost:5432/financeapp
```

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Run database migrations:

```bash
npm run db:migrate
```

4. Start the development server:

```bash
npm run dev
```

The backend server will be available at [http://localhost:8000](http://localhost:8000)

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

## Running Tests

### Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:unit        # Run only unit tests
npm run test:integration # Run only integration tests
npm run test:coverage    # Generate test coverage report
```

### Frontend Tests

```bash
cd frontend
npm test                # Run all tests
npm run test:coverage   # Generate test coverage report
npm run test:e2e        # Run end-to-end tests with Cypress
```

## Database Migrations

### Creating a Migration

```bash
cd backend
npx sequelize-cli migration:generate --name migration-name
```

### Running Migrations

```bash
cd backend
npm run db:migrate
```

### Reverting Migrations

```bash
cd backend
npm run db:migrate:undo
```

## Common Issues & Troubleshooting

### Docker Issues

**Problem**: Container fails to start with port binding error
**Solution**: Check if you have any services already running on ports 3000, 8000, or 5432. Stop those services or change the ports in `docker-compose.yml`.

**Problem**: Database connection issues in Docker
**Solution**: Make sure the `DATABASE_URL` environment variable in `.env` uses `db` as the hostname:
```
DATABASE_URL=postgres://postgres:password@db:5432/financeapp
```

### Plaid Integration Issues

**Problem**: "Invalid client_id or secret" error
**Solution**: Double-check your Plaid credentials in the `.env` file. Make sure you're using the correct environment (sandbox, development, or production).

**Problem**: Plaid Link not opening
**Solution**: Check browser console for errors. Ensure that your Plaid app has the correct allowed redirect URIs (including localhost for development).

### OpenAI Integration Issues

**Problem**: "Invalid API key" error
**Solution**: Verify your OpenAI API key in the `.env` file. Check if your OpenAI account has billing configured.

**Problem**: Hitting rate limits with OpenAI
**Solution**: Implement request batching and caching in development to reduce API calls.

## Code Style & Linting

### Running Linters

```bash
# Backend
cd backend
npm run lint
npm run lint:fix  # Fix automatically fixable issues

# Frontend
cd frontend
npm run lint
npm run lint:fix  # Fix automatically fixable issues
```

### Type Checking

```bash
# Backend
cd backend
npm run typecheck

# Frontend
cd frontend
npm run typecheck
```

## Git Workflow

1. Create a new branch for your feature or bugfix:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes, ensuring that:
   - Tests are written first (TDD approach)
   - All tests pass
   - Linting passes
   - Type checking passes

3. Commit your changes with descriptive messages:

```bash
git commit -m "Add feature: your feature description"
```

4. Push your branch and create a pull request:

```bash
git push -u origin feature/your-feature-name
```

## Architecture Overview

For a detailed overview of the application architecture, see [architecture.md](./architecture.md).

## Testing Strategy

For details on our test-driven development approach, see [testing.md](./testing.md).

## Security Guidelines

For security best practices when developing for this application, see [security.md](./security.md).