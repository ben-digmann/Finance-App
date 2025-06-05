# Deployment Guide

This document outlines the deployment process for the Finance App, covering both local development and production environments.

## Local Development Environment

### Prerequisites

- Docker and Docker Compose
- Go 1.20+
- Plaid developer account (free Sandbox tier is sufficient)
- OpenAI API key (optional for LLM-based categorization)

### Setup Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd finance-app
```

2. **Set up environment variables**

Create a `.env` file in the root directory:

```
# Plaid API credentials
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
OPENAI_API_KEY=your_openai_api_key_optional
```

3. **Start the development environment**

```bash
docker-compose up
```

This will start:
- Frontend service on http://localhost:3000
- Backend service on http://localhost:8000
- PostgreSQL database on port 5432
- PgAdmin database management tool on http://localhost:5050

4. **Access the application**

Open your browser and navigate to http://localhost:3000

### Local Testing

Run backend tests:
```bash
docker-compose exec api npm test
```

Run frontend tests:
```bash
docker-compose exec web npm test
```

## Production Deployment

For a v0 production application, we'll focus on simple, cost-effective deployment options.

### Deployment Options

#### Option 1: Heroku (Simplest)

1. **Create Heroku Apps**

```bash
# Install Heroku CLI if not already installed
npm install -g heroku

# Log in to Heroku
heroku login

# Create apps for backend and frontend
heroku create finance-app-api
heroku create finance-app-client
```

2. **Add PostgreSQL Database**

```bash
# Add PostgreSQL add-on to backend app
heroku addons:create heroku-postgresql:hobby-dev --app finance-app-api
```

3. **Set Environment Variables**

```bash
# Set environment variables for backend
heroku config:set NODE_ENV=production --app finance-app-api
heroku config:set JWT_SECRET=your_jwt_secret --app finance-app-api
heroku config:set PLAID_CLIENT_ID=your_plaid_client_id --app finance-app-api
heroku config:set PLAID_SECRET=your_plaid_secret --app finance-app-api
heroku config:set PLAID_ENV=sandbox --app finance-app-api
heroku config:set OPENAI_API_KEY=your_openai_api_key --app finance-app-api

# Set environment variables for frontend
heroku config:set REACT_APP_API_URL=https://finance-app-api.herokuapp.com/api --app finance-app-client
```

4. **Deploy Backend**

```bash
# Navigate to backend folder
cd backend

# Initialize git repository if not already
git init
git add .
git commit -m "Initial backend commit"

# Add Heroku remote and push
heroku git:remote -a finance-app-api
git push heroku main
```

5. **Deploy Frontend**

```bash
# Navigate to frontend folder
cd ../frontend

# Initialize git repository if not already
git init
git add .
git commit -m "Initial frontend commit"

# Add Heroku remote and push
heroku git:remote -a finance-app-client
git push heroku main
```

#### Option 2: Digital Ocean App Platform

1. **Create a Digital Ocean Account**

Sign up at [https://www.digitalocean.com/](https://www.digitalocean.com/)

2. **Install Digital Ocean CLI (optional)**

```bash
# Install doctl
# Follow instructions at https://docs.digitalocean.com/reference/doctl/how-to/install/
```

3. **Create App from GitHub Repository**

- Connect your GitHub account
- Select your repository
- Configure as a Web Service
- Add your environment variables
- Deploy!

#### Option 3: Railway.app

1. **Sign Up for Railway**

Visit [https://railway.app/](https://railway.app/) and sign up

2. **Create New Project**

- Choose "Deploy from GitHub repo"
- Connect your GitHub account
- Select your repository

3. **Configure Services**

- Add a PostgreSQL database
- Configure environment variables
- Deploy automatically!

### Plaid Integration Considerations

When moving from development to production with Plaid, consider these important steps:

1. **Upgrade to Development/Production Environment**

```bash
# In your .env file or environment variables:
# For testing with real credentials but no real money movement
PLAID_ENV=development

# For production with real accounts and transactions
# PLAID_ENV=production
```

2. **Plaid Dashboard Settings**

- Update allowed redirect URIs in your Plaid Dashboard
- Configure webhook URLs for real-time updates
- Apply for Production API access when ready

3. **Handle Plaid Webhooks**

Add support for Plaid webhooks to keep transaction data fresh:
- TRANSACTIONS_SYNC webhooks for new transactions
- ITEM webhooks for connection status changes

## Security Best Practices

For a v0 production application, focus on these essential security measures:

1. **HTTPS Everywhere**
   - Use HTTPS for all connections (provided by Heroku, DigitalOcean, Railway)

2. **Secure Secrets Management**
   - Never commit secrets to your code
   - Use environment variables for all sensitive values
   - Rotate JWT secrets periodically

3. **Data Protection**
   - Use secure, hashed passwords with bcrypt
   - Implement proper authorization for API endpoints
   - Apply the principle of least privilege

4. **Regular Updates**
   - Keep dependencies updated with security patches
   - Subscribe to security advisories for major dependencies

## Monitoring Your Application

Start with these simple monitoring techniques for your v0 app:

1. **Basic Application Logs**
   - Leverage the built-in logging in each platform
   - Set up error notifications (email/Slack)

2. **Free Uptime Monitoring**
   - Use UptimeRobot (free tier) to monitor your site uptime
   - Set up basic health check endpoints

3. **Error Tracking**
   - Consider adding Sentry (free tier) for error tracking
   - Implement proper error boundaries in  Svelte

## Next Steps After v0

Once your v0 application is running successfully in production:

1. **Gather User Feedback**
   - Add a feedback form
   - Monitor common user flows and pain points

2. **Improve Reliability**
   - Add more comprehensive testing
   - Implement proper database backups
   - Set up staging environment for testing changes

3. **Plan for Growth**
   - Consider more robust hosting if user base grows
   - Implement caching for better performance
   - Plan for database scaling

4. **Enhance Security**
   - Perform a security audit
   - Implement 2FA for user accounts
   - Consider penetration testing