# API Documentation

## GraphQL Schema

### Types

```graphql
type User {
  id: ID!
  email: String!
  createdAt: String!
}

type Transaction {
  id: ID!
  type: TransactionType!
  amount: Float!
  description: String
  date: String!
  createdAt: String!
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
  # Get all transactions with optional filters
  transactions(
    type: TransactionType
    startDate: String
    endDate: String
  ): [Transaction!]!
  
  # Get summary statistics
  summary(
    startDate: String
    endDate: String
  ): Summary!
  
  # Get current user
  me: User!
}
```
### Mutations

```graphql
type Mutation {
  # Authentication
  login(email: String!, password: String!): AuthPayload!
  
  # Transaction operations
  addTransaction(input: TransactionInput!): Transaction!
  updateTransaction(id: ID!, input: TransactionInput!): Transaction!
  deleteTransaction(id: ID!): Boolean!
}
```

### Input Types

```graphql
input TransactionInput {
  type: TransactionType!
  amount: Float!
  description: String
  date: String!
}

input TransactionFilter {
  type: TransactionType
  startDate: String
  endDate: String
}
```

## Authentication

All queries and mutations (except `login`) require an Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

## Example Queries

### Login
```graphql
mutation {
  login(email: "user@example.com", password: "password123") {
    token
    user {
      id
      email
    }
  }
}
```
### Get Transactions
```graphql
query {
  transactions(type: EXPENSE, startDate: "2025-01-01") {
    id
    type
    amount
    description
    date
  }
}
```

### Add Transaction
```graphql
mutation {
  addTransaction(input: {
    type: EXPENSE
    amount: 50.00
    description: "Groceries"
    date: "2025-06-21"
  }) {
    id
    amount
    description
  }
}
```

### Get Summary
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
