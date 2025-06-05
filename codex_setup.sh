#!/usr/bin/env bash
set -e
# Install system dependencies
apt-get update
apt-get install -y net-tools postgresql golang-go

# Start postgres service
service postgresql start
# Set postgres user password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
# Create database if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='finance_app'" | grep -q 1 || sudo -u postgres createdb finance_app

# Install node dependencies using npm ci
cd backend-go && go mod download && cd ..
cd frontend-svelte && npm ci && cd ..

echo "Setup complete. Start backend with 'cd backend-go && go run .' and frontend with 'cd frontend-svelte && npm run dev'"
