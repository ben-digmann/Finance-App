# Test-Driven Development Strategy

This document outlines the test-driven development (TDD) approach for the Finance App, describing our testing philosophy, tools, and processes.

## TDD Philosophy

Our development follows a strict TDD approach with these core principles:

1. **Tests First**: We write tests before implementing functionality
2. **Red-Green-Refactor**:
   - Start with failing tests (Red)
   - Implement the minimum code to make tests pass (Green)
   - Refactor code for cleanliness and optimization
3. **Continuous Testing**: Tests run automatically on every code change
4. **Comprehensive Coverage**: Aim for at least 80% code coverage
5. **No Untested Features**: Every feature must have corresponding tests

## Testing Levels

### 1. Unit Tests

**Purpose**: Test individual functions, methods, and components in isolation

**Examples**:
- Testing a utility function that formats currency
- Testing a React component renders correctly with given props
- Testing a model validation method works correctly

**Tools**:
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library

**Location**:
- Backend: `backend/tests/unit/`
- Frontend: Next to the files they're testing with `.test.ts` or `.test.tsx` suffix

**Sample Unit Test (Backend)**:
```typescript
describe('User Model', () => {
  it('should hash the password before saving', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    // Password should be hashed, not plaintext
    expect(user.password).not.toBe('password123');
    
    // Password hash should be valid
    const isValid = await bcrypt.compare('password123', user.password);
    expect(isValid).toBe(true);
  });
});
```

**Sample Unit Test (Frontend)**:
```typescript
test('renders transaction amount with correct formatting', () => {
  render(<TransactionAmount amount={1234.56} />);
  expect(screen.getByText('$1,234.56')).toBeInTheDocument();
});
```

### 2. Integration Tests

**Purpose**: Test how different parts of the application work together

**Examples**:
- Testing API endpoints with database interactions
- Testing Plaid API integration
- Testing LLM categorization service

**Tools**:
- Backend: Jest + Supertest
- Frontend: Jest + React Testing Library + Mock Service Worker

**Location**:
- Backend: `backend/tests/integration/`
- Frontend: `frontend/src/__tests__/integration/`

**Sample Integration Test**:
```typescript
describe('Plaid API Integration', () => {
  it('should exchange public token and save account data', async () => {
    // Setup test user and authentication
    const user = await createTestUser();
    const token = generateAuthToken(user);
    
    // Mock Plaid API responses
    mockPlaidTokenExchange('test-public-token', 'test-access-token');
    mockPlaidAccountsGet('test-access-token', [testAccount]);
    
    // Make API call
    const response = await request(app)
      .post('/api/plaid/exchange-public-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ publicToken: 'test-public-token' });
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify database changes
    const savedAccount = await Account.findOne({
      where: { userId: user.id, plaidAccountId: testAccount.account_id }
    });
    expect(savedAccount).not.toBeNull();
  });
});
```

### 3. End-to-End (E2E) Tests

**Purpose**: Test complete user flows from UI to database and back

**Examples**:
- User registration and login flow
- Connecting a bank account via Plaid
- Viewing and categorizing transactions
- Setting up and monitoring budgets

**Tools**:
- Cypress

**Location**:
- `frontend/cypress/e2e/`

**Sample E2E Test**:
```typescript
describe('User Authentication', () => {
  it('allows a user to register and login', () => {
    // Register a new user
    cy.visit('/register');
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type('e2e-test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    // Should be redirected to dashboard after registration
    cy.url().should('include', '/dashboard');
    
    // Log out
    cy.get('[data-testid="logout-button"]').click();
    
    // Log in with the same credentials
    cy.visit('/login');
    cy.get('input[name="email"]').type('e2e-test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    // Should be redirected to dashboard after login
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Welcome, Test!');
  });
});
```

## Test Mocking Strategy

### External APIs

All external API calls are mocked during testing:

1. **Plaid API**: Mock responses for token creation, account information, and transactions
2. **OpenAI API**: Mock responses for transaction categorization

### Example Mock Setup:
```typescript
// Mock Plaid API
jest.mock('../../src/services/plaidClient', () => ({
  createLinkToken: jest.fn().mockResolvedValue({
    link_token: 'mock-link-token',
    expiration: '2023-12-31'
  }),
  exchangePublicToken: jest.fn().mockResolvedValue({
    access_token: 'mock-access-token',
    item_id: 'mock-item-id'
  }),
  // Additional mocked methods
}));

// Mock OpenAI API
jest.mock('../../src/services/openaiClient', () => ({
  classifyTransaction: jest.fn().mockImplementation((transaction) => {
    // Simple mock classification logic
    if (transaction.name.includes('GROCERY')) return 'Food';
    if (transaction.name.includes('UBER')) return 'Transportation';
    return 'Other';
  })
}));
```

## CI/CD Integration

Tests are integrated into our CI/CD pipeline:

1. **Pre-commit Hooks**: Run linting and unit tests before allowing commits
2. **Pull Request Checks**:
   - Run all unit and integration tests
   - Check code coverage thresholds
   - Run linting and type checking
3. **Deployment Pipeline**:
   - Run E2E tests before deploying to staging
   - Perform smoke tests after deployment

## Test Coverage

We track and enforce test coverage using Jest's coverage reporting:

- **Minimum Thresholds**:
  - Statements: 80%
  - Branches: 80%
  - Functions: 80%
  - Lines: 80%

Coverage reports are generated after test runs and displayed in the CI/CD pipeline.

## Running Tests

### Backend Tests

```bash
# Run all backend tests
cd backend
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### E2E Tests

```bash
# Run E2E tests in headless mode
cd frontend
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:open
```

## Best Practices

1. **Isolated Tests**: Each test should be independent and not rely on state from other tests
2. **Clear Naming**: Test descriptions should clearly explain what is being tested
3. **Arrange-Act-Assert Pattern**: Structure tests with setup, action, and verification phases
4. **Mock Minimal Dependencies**: Only mock what's necessary to isolate the tested component
5. **Test Edge Cases**: Include tests for boundary conditions and error handling
6. **Keep Tests DRY**: Use beforeEach/afterEach hooks and helper functions for common setup
7. **Maintainable Tests**: Refactor tests when refactoring code to keep them maintainable