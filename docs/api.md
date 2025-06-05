# API Documentation

This document provides detailed information about the Finance App's RESTful API endpoints, request/response formats, and authentication requirements.

## Base URL

All API endpoints are prefixed with `/api`.

- **Development**: `http://localhost:8000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

### JWT Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT).

Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Obtaining a Token

Tokens are obtained through the login or registration process. They expire after 24 hours.

## API Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2023-01-15T12:00:00.000Z",
    "updatedAt": "2023-01-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2023-01-15T12:00:00.000Z",
    "updatedAt": "2023-01-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get current user

```
GET /auth/me
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2023-01-15T12:00:00.000Z",
    "updatedAt": "2023-01-15T12:00:00.000Z"
  }
}
```

### Plaid Integration

#### Create a link token

```
GET /plaid/create-link-token
```

**Response:**
```json
{
  "linkToken": "link-sandbox-abc123...",
  "expiration": "2023-01-16T12:00:00.000Z"
}
```

#### Exchange public token

```
POST /plaid/exchange-public-token
```

**Request Body:**
```json
{
  "publicToken": "public-sandbox-abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "accountsAdded": 2
}
```

#### Sync transactions

```
POST /plaid/sync-transactions
```

**Response:**
```json
{
  "message": "Transactions synced successfully",
  "accountsProcessed": 2,
  "transactionsAdded": 15,
  "transactionsModified": 3,
  "transactionsRemoved": 1
}
```

### Accounts

#### Get all accounts

```
GET /accounts
```

**Response:**
```json
{
  "accounts": [
    {
      "id": 1,
      "name": "Checking Account",
      "officialName": "Premium Checking",
      "type": "depository",
      "subtype": "checking",
      "mask": "1234",
      "currentBalance": 1000.50,
      "availableBalance": 950.75,
      "isoCurrencyCode": "USD",
      "lastUpdated": "2023-01-15T12:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Credit Card",
      "officialName": "Rewards Credit Card",
      "type": "credit",
      "subtype": "credit card",
      "mask": "5678",
      "currentBalance": -450.25,
      "availableBalance": null,
      "isoCurrencyCode": "USD",
      "lastUpdated": "2023-01-15T12:00:00.000Z"
    }
  ],
  "totalBalance": 550.25,
  "totalAvailableBalance": 950.75
}
```

#### Get account by ID

```
GET /accounts/:id
```

**Response:**
```json
{
  "account": {
    "id": 1,
    "name": "Checking Account",
    "officialName": "Premium Checking",
    "type": "depository",
    "subtype": "checking",
    "mask": "1234",
    "currentBalance": 1000.50,
    "availableBalance": 950.75,
    "isoCurrencyCode": "USD",
    "lastUpdated": "2023-01-15T12:00:00.000Z"
  }
}
```

### Transactions

#### Get transactions

```
GET /transactions
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `accountId` (optional): Filter by account ID
- `category` (optional): Filter by category
- `search` (optional): Search in transaction name or description

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "name": "Grocery Store",
      "merchantName": "ACME Groceries",
      "amount": 75.50,
      "date": "2023-01-15",
      "category": "Food and Drink",
      "subcategory": "Groceries",
      "llmCategory": "Food",
      "userCategory": null,
      "pending": false,
      "account": {
        "id": 1,
        "name": "Checking Account",
        "mask": "1234",
        "type": "depository",
        "subtype": "checking"
      }
    },
    // More transactions...
  ],
  "pagination": {
    "total": 157,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### Get transaction by ID

```
GET /transactions/:id
```

**Response:**
```json
{
  "transaction": {
    "id": 1,
    "name": "Grocery Store",
    "merchantName": "ACME Groceries",
    "amount": 75.50,
    "date": "2023-01-15",
    "category": "Food and Drink",
    "subcategory": "Groceries",
    "llmCategory": "Food",
    "userCategory": null,
    "pending": false,
    "paymentChannel": "in store",
    "address": "123 Main St",
    "city": "Anytown",
    "region": "CA",
    "postalCode": "12345",
    "country": "US",
    "isoCurrencyCode": "USD",
    "account": {
      "id": 1,
      "name": "Checking Account",
      "mask": "1234",
      "type": "depository",
      "subtype": "checking"
    }
  }
}
```

#### Update transaction category

```
PATCH /transactions/:id/category
```

**Request Body:**
```json
{
  "category": "Groceries"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "name": "Grocery Store",
    "userCategory": "Groceries",
    // Other transaction fields...
  }
}
```

#### Get monthly transaction statistics

```
GET /transactions/stats/monthly
```

**Query Parameters:**
- `year` (optional): Filter by year (e.g., 2023)
- `month` (optional): Filter by month (1-12)

**Response:**
```json
{
  "income": 3500.00,
  "expenses": 2750.75,
  "net": 749.25,
  "transactionCount": 47,
  "topCategories": [
    {
      "category": "Housing",
      "total": 1200.00,
      "count": 1
    },
    {
      "category": "Food",
      "total": 450.75,
      "count": 15
    },
    // More categories...
  ],
  "dailySpending": [
    {
      "date": "2023-01-01",
      "total": 125.50
    },
    // More daily totals...
  ]
}
```

#### Get spending by category

```
GET /transactions/stats/by-category
```

**Query Parameters:**
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

**Response:**
```json
{
  "categories": [
    {
      "category": "Housing",
      "total": 1200.00,
      "count": 1,
      "percentage": 43.62
    },
    {
      "category": "Food",
      "total": 450.75,
      "count": 15,
      "percentage": 16.39
    },
    // More categories...
  ],
  "totalSpending": 2750.75
}
```

### Categories

#### Get all categories

```
GET /categories
```

**Response:**
```json
{
  "categories": [
    "Housing",
    "Transportation",
    "Food",
    "Utilities",
    "Insurance",
    "Healthcare",
    "Debt Payments",
    "Entertainment",
    "Shopping",
    "Personal Care",
    "Education",
    "Travel",
    "Gifts & Donations",
    "Income",
    "Other"
  ]
}
```

### Assets

#### Get all assets

```
GET /assets
```

**Response:**
```json
{
  "assets": [
    {
      "id": 1,
      "name": "Primary Residence",
      "type": "real estate",
      "value": 450000.00,
      "purchaseDate": "2018-05-15",
      "purchasePrice": 425000.00,
      "lastValuationDate": "2023-01-01",
      "notes": "3 bedroom house"
    },
    {
      "id": 2,
      "name": "Car",
      "type": "vehicle",
      "value": 18500.00,
      "purchaseDate": "2020-10-20",
      "purchasePrice": 25000.00,
      "lastValuationDate": "2023-01-01",
      "notes": "2020 Honda Accord"
    }
  ],
  "totalAssetValue": 468500.00
}
```

#### Get asset by ID

```
GET /assets/:id
```

**Response:**
```json
{
  "asset": {
    "id": 1,
    "name": "Primary Residence",
    "type": "real estate",
    "value": 450000.00,
    "purchaseDate": "2018-05-15",
    "purchasePrice": 425000.00,
    "lastValuationDate": "2023-01-01",
    "notes": "3 bedroom house"
  }
}
```

#### Create a new asset

```
POST /assets
```

**Request Body:**
```json
{
  "name": "Investment Portfolio",
  "type": "investment",
  "value": 75000.00,
  "purchaseDate": "2019-03-10",
  "purchasePrice": 50000.00,
  "notes": "401k and IRA accounts"
}
```

**Response:**
```json
{
  "asset": {
    "id": 3,
    "name": "Investment Portfolio",
    "type": "investment",
    "value": 75000.00,
    "purchaseDate": "2019-03-10",
    "purchasePrice": 50000.00,
    "lastValuationDate": "2023-01-15",
    "notes": "401k and IRA accounts",
    "createdAt": "2023-01-15T12:00:00.000Z",
    "updatedAt": "2023-01-15T12:00:00.000Z"
  }
}
```

#### Update an asset

```
PUT /assets/:id
```

**Request Body:**
```json
{
  "value": 80000.00,
  "lastValuationDate": "2023-01-20",
  "notes": "401k and IRA accounts, recent market growth"
}
```

**Response:**
```json
{
  "asset": {
    "id": 3,
    "name": "Investment Portfolio",
    "type": "investment",
    "value": 80000.00,
    "purchaseDate": "2019-03-10",
    "purchasePrice": 50000.00,
    "lastValuationDate": "2023-01-20",
    "notes": "401k and IRA accounts, recent market growth",
    "updatedAt": "2023-01-20T12:00:00.000Z"
  }
}
```

#### Delete an asset

```
DELETE /assets/:id
```

**Response:**
```json
{
  "message": "Asset deleted successfully"
}
```

### Budgets

#### Get all budgets

```
GET /budgets
```

**Response:**
```json
{
  "budgets": [
    {
      "id": 1,
      "category": "Housing",
      "amount": 1500.00,
      "period": "monthly",
      "startDate": "2023-01-01",
      "endDate": null,
      "rollover": false,
      "isActive": true
    },
    {
      "id": 2,
      "category": "Food",
      "amount": 600.00,
      "period": "monthly",
      "startDate": "2023-01-01",
      "endDate": null,
      "rollover": true,
      "isActive": true
    }
  ]
}
```

#### Get budget by ID

```
GET /budgets/:id
```

**Response:**
```json
{
  "budget": {
    "id": 1,
    "category": "Housing",
    "amount": 1500.00,
    "period": "monthly",
    "startDate": "2023-01-01",
    "endDate": null,
    "rollover": false,
    "isActive": true,
    "notes": "Rent or mortgage payment"
  }
}
```

#### Create a new budget

```
POST /budgets
```

**Request Body:**
```json
{
  "category": "Entertainment",
  "amount": 200.00,
  "period": "monthly",
  "startDate": "2023-01-01",
  "rollover": true,
  "notes": "Movies, streaming services, etc."
}
```

**Response:**
```json
{
  "budget": {
    "id": 3,
    "category": "Entertainment",
    "amount": 200.00,
    "period": "monthly",
    "startDate": "2023-01-01",
    "endDate": null,
    "rollover": true,
    "isActive": true,
    "notes": "Movies, streaming services, etc.",
    "createdAt": "2023-01-15T12:00:00.000Z",
    "updatedAt": "2023-01-15T12:00:00.000Z"
  }
}
```

#### Update a budget

```
PUT /budgets/:id
```

**Request Body:**
```json
{
  "amount": 250.00,
  "notes": "Increased for summer activities"
}
```

**Response:**
```json
{
  "budget": {
    "id": 3,
    "category": "Entertainment",
    "amount": 250.00,
    "period": "monthly",
    "startDate": "2023-01-01",
    "endDate": null,
    "rollover": true,
    "isActive": true,
    "notes": "Increased for summer activities",
    "updatedAt": "2023-06-01T12:00:00.000Z"
  }
}
```

#### Delete a budget

```
DELETE /budgets/:id
```

**Response:**
```json
{
  "message": "Budget deleted successfully"
}
```

### Financial summary

```
GET /summary
```

**Response:**
```json
{
  "accounts": 1234.56,
  "assets": 2500.00,
  "netWorth": 3734.56,
  "budgets": [/* active budgets */],
  "spendingByCategory": {
    "Food": 200.12,
    "Transportation": 75.00
  }
}
```

### AI chat

```
POST /chat
```

**Request Body:**
```json
{
  "question": "How much did I spend on groceries this month?"
}
```

**Response:**
```json
{
  "answer": "You spent $200.12 on groceries this month."
}
```

## Error Responses

### Standard Error Format

```json
{
  "status": "error",
  "message": "Error message describing what went wrong"
}
```

### Validation Error Format

```json
{
  "status": "error",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse. Current limits:

- 100 requests per minute per IP address
- 1000 requests per hour per user

When rate limit is exceeded, the server responds with:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

```json
{
  "status": "error",
  "message": "Rate limit exceeded. Please try again later."
}
```

## Pagination

Endpoints that return lists of resources support pagination:

### Request

Pagination parameters are sent as query parameters:
- `page`: Page number (starting from 1)
- `limit`: Number of items per page (default: 20, max: 100)

Example:
```
GET /api/transactions?page=2&limit=50
```

### Response

Paginated responses include pagination metadata:

```json
{
  "transactions": [...],
  "pagination": {
    "total": 157,
    "page": 2,
    "limit": 50,
    "totalPages": 4
  }
}
```