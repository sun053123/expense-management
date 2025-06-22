"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Mock PostgreSQL database module for tests
jest.mock("../database/postgres", () => ({
    __esModule: true,
    default: {
        query: jest.fn(),
        queryOne: jest.fn(),
        getClient: jest.fn(),
        transaction: jest.fn(),
        end: jest.fn(),
    },
    DatabaseHelpers: {
        buildWhereClause: jest.fn(),
        buildUpdateClause: jest.fn(),
        formatError: jest.fn(),
    },
}));
// Mock pg module to prevent import errors
jest.mock("pg", () => ({
    Pool: jest.fn().mockImplementation(() => ({
        connect: jest.fn(),
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
    })),
    Client: jest.fn().mockImplementation(() => ({
        connect: jest.fn(),
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
    })),
}));
// Mock logger to avoid console output during tests
jest.mock("../utils/logger", () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
}));
// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
// Global test setup
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Any global setup can go here
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Any global cleanup can go here
}));
beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
});
afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
});
// Add a dummy test to prevent Jest from complaining
describe("Setup", () => {
    it("should setup test environment", () => {
        expect(process.env.NODE_ENV).toBe("test");
    });
});
