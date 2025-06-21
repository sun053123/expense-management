# Expense Management System API Documentation

## Overview

This is a GraphQL API for an expense management system built with Express.js, Apollo Server, TypeScript, and PostgreSQL. The API provides functionality for user authentication and transaction management.

## Base URL

- **Development**: `http://localhost:8888/graphql`
- **Health Check**: `http://localhost:8888/health`

## GraphQL Schema

### Types

```graphql
type User {
  id: ID!
  email: String!
  createdAt: String!
  updatedAt: String!
}

type Transaction {
  id: ID!
  userId: ID!
  type: TransactionType!
  amount: Float!
  description: String
  date: String!
  createdAt: String!
  updatedAt: String!
  user: User
}

enum TransactionType {
  INCOME
  EXPENSE
}

type AuthPayload {
  token: String!
  user: User!
}

type Summary {
  totalIncome: Float!
  totalExpense: Float!
  balance: Float!
  transactionCount: Int!
}
```

### Queries

```graphql
type Query {
  # Get current authenticated user
  me: User

  # Get all transactions with optional filters
  transactions(filter: TransactionFilter): [Transaction!]!

  # Get a specific transaction by ID
  transaction(id: ID!): Transaction

  # Get summary statistics
  summary: Summary!

  # Health check
  health: String!
}
```

### Mutations

```graphql
type Mutation {
  # Authentication
  login(input: LoginInput!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!

  # Transaction operations
  addTransaction(input: TransactionInput!): Transaction!
  updateTransaction(id: ID!, input: TransactionUpdateInput!): Transaction!
  deleteTransaction(id: ID!): Boolean!
}
```

### Input Types

```graphql
input LoginInput {
  email: String!
  password: String!
}

input RegisterInput {
  email: String!
  password: String!
}

input TransactionInput {
  type: TransactionType!
  amount: Float!
  description: String
  date: String!
}

input TransactionUpdateInput {
  type: TransactionType
  amount: Float
  description: String
  date: String
}

input TransactionFilter {
  type: TransactionType
  startDate: String
  endDate: String
}
```

## Authentication

Most queries and mutations require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Public Endpoints

- `health` query
- `login` mutation
- `register` mutation

### Protected Endpoints

All other queries and mutations require authentication.

## Example Queries and Mutations

### Authentication

#### Register a new user

```graphql
mutation {
  register(input: { email: "user@example.com", password: "password123" }) {
    token
    user {
      id
      email
      createdAt
    }
  }
}
```

#### Login

```graphql
mutation {
  login(input: { email: "user@example.com", password: "password123" }) {
    token
    user {
      id
      email
      createdAt
    }
  }
}
```

#### Get current user

```graphql
query {
  me {
    id
    email
    createdAt
    updatedAt
  }
}
```

### Transaction Management

#### Get all transactions

```graphql
query {
  transactions {
    id
    type
    amount
    description
    date
    createdAt
  }
}
```

#### Get transactions with filters

```graphql
query {
  transactions(
    filter: { type: EXPENSE, startDate: "2023-01-01", endDate: "2023-12-31" }
  ) {
    id
    type
    amount
    description
    date
  }
}
```

#### Get a specific transaction

```graphql
query {
  transaction(id: "1") {
    id
    type
    amount
    description
    date
    user {
      email
    }
  }
}
```

#### Add a new transaction

```graphql
mutation {
  addTransaction(
    input: {
      type: EXPENSE
      amount: 50.00
      description: "Groceries"
      date: "2023-12-01"
    }
  ) {
    id
    type
    amount
    description
    date
    createdAt
  }
}
```

#### Update a transaction

```graphql
mutation {
  updateTransaction(
    id: "1"
    input: { amount: 75.00, description: "Updated groceries" }
  ) {
    id
    type
    amount
    description
    date
    updatedAt
  }
}
```

#### Delete a transaction

```graphql
mutation {
  deleteTransaction(id: "1")
}
```

### Analytics

#### Get summary statistics

```graphql
query {
  summary {
    totalIncome
    totalExpense
    balance
    transactionCount
  }
}
```

### Health Check

#### Check server health

```graphql
query {
  health
}
```

## Error Handling

The API returns structured error responses with appropriate HTTP status codes:

### Authentication Errors (401)

```json
{
  "errors": [
    {
      "message": "You must be logged in to access this resource",
      "extensions": {
        "code": "UNAUTHENTICATED",
        "statusCode": 401
      }
    }
  ]
}
```

### Authorization Errors (403)

```json
{
  "errors": [
    {
      "message": "You do not have permission to access this transaction",
      "extensions": {
        "code": "FORBIDDEN",
        "statusCode": 403
      }
    }
  ]
}
```

### Validation Errors (400)

```json
{
  "errors": [
    {
      "message": "Amount must be a positive number",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "statusCode": 400
      }
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes

Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit resets

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Docker (optional)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_management?schema=public"
PORT=8888
NODE_ENV=development
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
LOG_LEVEL="info"
```

### Running the Server

#### With Docker

```bash
docker-compose up -d
```

#### Without Docker

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Production Deployment

### Environment Configuration

- Set `NODE_ENV=production`
- Use a secure `JWT_SECRET`
- Configure production database URL
- Set appropriate CORS origins
- Configure logging level to `warn` or `error`

### Security Considerations

- Always use HTTPS in production
- Implement proper CORS configuration
- Use environment variables for sensitive data
- Monitor rate limiting and adjust as needed
- Regularly update dependencies
- Implement proper logging and monitoring
