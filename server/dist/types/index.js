"use strict";
// Common types and interfaces for the expense management system
//
// This file contains all shared types, interfaces, and type definitions used
// throughout the application. It provides a centralized location for type
// definitions to ensure consistency and maintainability.
//
// The types are organized into logical groups:
// - Core Entity Types (User, Transaction)
// - Input/Output Types (GraphQL inputs, API responses)
// - Service and Repository Interfaces
// - Validation and Error Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSACTION_TYPES = exports.TransactionType = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "TransactionType", { enumerable: true, get: function () { return client_1.TransactionType; } });
// Enum-like type for transaction types (for better type safety)
exports.TRANSACTION_TYPES = {
    INCOME: "INCOME",
    EXPENSE: "EXPENSE",
};
