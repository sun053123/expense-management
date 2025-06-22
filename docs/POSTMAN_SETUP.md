# Postman Collection Setup Guide

## Quick Start

This guide helps you set up and use the Postman collection for the Expense Management GraphQL API.

## Files Included

- `Expense-Management-GraphQL.postman_collection.json` - Complete API collection
- `Expense-Management-Local.postman_environment.json` - Local development environment
- `graphql-postman-requests.md` - Detailed documentation with cURL examples

## Import Instructions

### Step 1: Import Collection
1. Open Postman
2. Click the **Import** button (top left)
3. Select **Upload Files**
4. Choose `Expense-Management-GraphQL.postman_collection.json`
5. Click **Import**

### Step 2: Import Environment
1. Click the **Import** button again
2. Select **Upload Files**
3. Choose `Expense-Management-Local.postman_environment.json`
4. Click **Import**

### Step 3: Select Environment
1. In the top-right corner, click the environment dropdown
2. Select **"Expense Management - Local Development"**

## Collection Structure

```
📁 Expense Management GraphQL API
├── 📁 Authentication
│   ├── Register User
│   ├── Login User
│   └── Get Current User
├── 📁 Transaction Queries
│   ├── Get All Transactions
│   ├── Get Transactions with Filter
│   ├── Get Single Transaction
│   └── Get Financial Summary
├── 📁 Transaction Mutations
│   ├── Add Expense Transaction
│   ├── Add Income Transaction
│   ├── Update Transaction
│   └── Delete Transaction
└── 📁 Utilities
    ├── Health Check (GraphQL)
    ├── Health Check (REST)
    └── GraphQL Schema Introspection
```

## Getting Started

### 1. Start the Server
Make sure your Express server is running:
```bash
cd server
npm run dev
# Server should be running on http://localhost:8888
```

### 2. Test Connection
Run the **Health Check (REST)** request to verify the server is running.

### 3. Authenticate
1. Run **Register User** to create a new account
   - The JWT token will be automatically saved to your environment
2. Or run **Login User** if you already have an account

### 4. Use Protected Endpoints
All transaction-related requests will now work automatically using the saved JWT token.

## Environment Variables

The environment includes these pre-configured variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:8888` | Server base URL |
| `jwtToken` | (auto-set) | JWT token from login/register |
| `userEmail` | `user@example.com` | Default test email |
| `userPassword` | `securePassword123` | Default test password |
| `testTransactionId` | `1` | Sample transaction ID |

## Key Features

### 🔐 Automatic Authentication
- Login/Register requests automatically save JWT tokens
- Protected endpoints automatically use the saved token
- No manual token copying required

### 🔄 Smart Test Scripts
- Authentication responses automatically update the `jwtToken` variable
- Error handling for failed authentication
- Console logging for debugging

### 📝 Request Examples
- Pre-filled with realistic sample data
- Multiple transaction types (Income/Expense)
- Date filtering examples
- Update and delete operations

### 🛠️ Development Tools
- Health check endpoints
- GraphQL schema introspection
- Error response examples

## Usage Tips

### Testing Workflow
1. **Register/Login** → Get authenticated
2. **Add Transactions** → Create some test data
3. **Query Transactions** → Retrieve and filter data
4. **Update/Delete** → Modify existing transactions
5. **Get Summary** → View financial overview

### Customizing Requests
- Edit the `variables` section in each request
- Modify the GraphQL queries to include/exclude fields
- Update environment variables for different test scenarios

### Troubleshooting
- Check that the server is running on `http://localhost:8888`
- Verify the environment is selected in Postman
- Look at the Console tab for error messages
- Use the Health Check requests to test connectivity

## GraphQL Query Examples

### Basic Transaction Query
```graphql
query GetTransactions {
  transactions {
    id
    type
    amount
    description
    date
  }
}
```

### Filtered Query
```graphql
query GetExpenses($filter: TransactionFilter) {
  transactions(filter: $filter) {
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

### Mutation Example
```graphql
mutation AddExpense($input: TransactionInput!) {
  addTransaction(input: $input) {
    id
    type
    amount
    description
    date
    createdAt
  }
}
```

## Support

For detailed API documentation and cURL examples, see:
- `docs/API_DOCS.md` - Complete API documentation
- `docs/graphql-postman-requests.md` - cURL examples and manual testing

For server setup and development:
- `README.md` - Project setup instructions
- `server/README.md` - Server-specific documentation
