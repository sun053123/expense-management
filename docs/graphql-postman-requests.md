# GraphQL Postman Requests for Expense Management System

## Quick Start

### Postman Collection

Import the ready-to-use Postman collection and environment:

- **Collection**: `docs/Expense-Management-GraphQL.postman_collection.json`
- **Environment**: `docs/Expense-Management-Local.postman_environment.json`

### Base Configuration

- **GraphQL Endpoint**: `http://localhost:8888/graphql`
- **Health Check**: `http://localhost:8888/health`
- **Content-Type**: `application/json`
- **Authorization**: `Bearer <JWT_TOKEN>` (for protected endpoints)

## Authentication Requests

### 1. Register User

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation RegisterUser($input: RegisterInput!) { register(input: $input) { token user { id email createdAt updatedAt } } }",
    "variables": {
      "input": {
        "email": "user@example.com",
        "password": "securePassword123"
      }
    }
  }'
```

### 2. Login User

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation LoginUser($input: LoginInput!) { login(input: $input) { token user { id email createdAt updatedAt } } }",
    "variables": {
      "input": {
        "email": "user@example.com",
        "password": "securePassword123"
      }
    }
  }'
```

### 3. Get Current User (Protected)

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "query GetMe { me { id email createdAt updatedAt } }"
  }'
```

## Transaction Queries

### 4. Get All Transactions (Protected)

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "query GetTransactions($filter: TransactionFilter) { transactions(filter: $filter) { id userId type amount description date createdAt updatedAt user { id email } } }",
    "variables": {
      "filter": {}
    }
  }'
```

### 5. Get Transactions with Filter

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "query GetTransactions($filter: TransactionFilter) { transactions(filter: $filter) { id userId type amount description date createdAt updatedAt } }",
    "variables": {
      "filter": {
        "type": "EXPENSE",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31"
      }
    }
  }'
```

### 6. Get Single Transaction (Protected)

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "query GetTransaction($id: ID!) { transaction(id: $id) { id userId type amount description date createdAt updatedAt user { id email } } }",
    "variables": {
      "id": "1"
    }
  }'
```

### 7. Get Financial Summary (Protected)

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "query GetSummary { summary { totalIncome totalExpense balance transactionCount } }"
  }'
```

## Transaction Mutations

### 8. Add Transaction (Protected)

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "mutation AddTransaction($input: TransactionInput!) { addTransaction(input: $input) { id userId type amount description date createdAt updatedAt } }",
    "variables": {
      "input": {
        "type": "EXPENSE",
        "amount": 25.50,
        "description": "Coffee and snacks",
        "date": "2024-01-15"
      }
    }
  }'
```

### 9. Add Income Transaction

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "mutation AddTransaction($input: TransactionInput!) { addTransaction(input: $input) { id userId type amount description date createdAt updatedAt } }",
    "variables": {
      "input": {
        "type": "INCOME",
        "amount": 2500.00,
        "description": "Monthly salary",
        "date": "2024-01-01"
      }
    }
  }'
```

### 10. Update Transaction (Protected)

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "mutation UpdateTransaction($id: ID!, $input: TransactionUpdateInput!) { updateTransaction(id: $id, input: $input) { id userId type amount description date createdAt updatedAt } }",
    "variables": {
      "id": "1",
      "input": {
        "amount": 30.00,
        "description": "Updated: Coffee and lunch"
      }
    }
  }'
```

### 11. Delete Transaction (Protected)

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "query": "mutation DeleteTransaction($id: ID!) { deleteTransaction(id: $id) }",
    "variables": {
      "id": "1"
    }
  }'
```

## Health Check

### 12. Health Check Query

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query HealthCheck { health }"
  }'
```

### 13. Simple Health Check (REST)

```bash
curl -X GET http://localhost:8888/health
```

## GraphQL Introspection

### 14. Get Schema Information

```bash
curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query IntrospectionQuery { __schema { types { name kind description fields { name type { name kind } } } } }"
  }'
```

## Using the Postman Collection

### Import Instructions

1. Open Postman
2. Click "Import" button
3. Select the collection file: `docs/Expense-Management-GraphQL.postman_collection.json`
4. Import the environment file: `docs/Expense-Management-Local.postman_environment.json`
5. Select the "Expense Management - Local Development" environment

### Authentication Flow

1. **Register User** or **Login User** - This will automatically save the JWT token
2. Use any protected endpoint - The token is automatically included in requests

### Collection Features

- **Automatic Token Management**: Login/Register requests automatically save JWT tokens
- **Environment Variables**: Pre-configured with local development settings
- **Request Organization**: Grouped by functionality (Auth, Queries, Mutations, Utilities)
- **Bearer Token Auth**: Automatically applied to protected endpoints

## Manual cURL Usage (Alternative to Postman)

### Environment Setup for cURL

1. **Base URL**: `http://localhost:8888/graphql`
2. **Content-Type**: Always include `application/json` header
3. **Authorization**: For protected endpoints, include `Authorization: Bearer <JWT_TOKEN>`

### Getting JWT Token

1. Use Register or Login mutation to get a JWT token
2. Copy the token from the response
3. Use it in subsequent requests: `Authorization: Bearer <your_token_here>`

### Data Format Guidelines

- **Transaction Types**: Use `INCOME` or `EXPENSE` for transaction type
- **Date Format**: Use ISO date format (YYYY-MM-DD)
- **Amount**: Use decimal numbers (e.g., 25.50, 100.00)
- **IDs**: Use string format for GraphQL ID type

## Error Handling

Common error responses:

- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid input data
- `403 Forbidden`: Access denied to resource
- `500 Internal Server Error`: Server-side error
