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
Object.defineProperty(exports, "__esModule", { value: true });
const TransactionService_1 = require("../../services/TransactionService");
const TransactionRepository_1 = require("../../repositories/TransactionRepository");
// Mock the repository
jest.mock("../../repositories/TransactionRepository");
jest.mock("../../utils/logger");
const MockedTransactionRepository = jest.mocked(TransactionRepository_1.TransactionRepository);
describe("TransactionService", () => {
    let transactionService;
    let mockRepository;
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Create mock repository methods
        mockRepository = {
            findById: jest.fn(),
            findByUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getSummary: jest.fn(),
        };
        // Mock the TransactionRepository constructor to return our mock
        MockedTransactionRepository.mockImplementation(() => mockRepository);
        // Create a new service instance
        transactionService = new TransactionService_1.TransactionService();
    });
    describe("getTransactions", () => {
        const userId = 1;
        const mockTransactions = [
            {
                id: 1,
                userId: 1,
                type: "EXPENSE",
                amount: 100.5,
                description: "Test expense",
                date: new Date("2023-12-01"),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 2,
                userId: 1,
                type: "INCOME",
                amount: 500.0,
                description: "Test income",
                date: new Date("2023-12-02"),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        it("should successfully retrieve transactions without filter", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findByUserId.mockResolvedValue(mockTransactions);
            const result = yield transactionService.getTransactions(userId);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTransactions);
            expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, undefined);
        }));
        it("should successfully retrieve transactions with filter", () => __awaiter(void 0, void 0, void 0, function* () {
            const filter = {
                type: "EXPENSE",
                startDate: "2023-01-01",
                endDate: "2023-12-31",
            };
            mockRepository.findByUserId.mockResolvedValue([mockTransactions[0]]);
            const result = yield transactionService.getTransactions(userId, filter);
            expect(result.success).toBe(true);
            expect(result.data).toEqual([mockTransactions[0]]);
            expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, filter);
        }));
        it("should reject invalid user ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.getTransactions(0);
            expect(result.success).toBe(false);
            expect(result.error).toContain("User ID must be positive");
            expect(mockRepository.findByUserId).not.toHaveBeenCalled();
        }));
        it("should reject invalid filter", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidFilter = {
                type: "INVALID",
            };
            const result = yield transactionService.getTransactions(userId, invalidFilter);
            expect(result.success).toBe(false);
            expect(result.error).toContain("Transaction type must be either INCOME or EXPENSE");
            expect(mockRepository.findByUserId).not.toHaveBeenCalled();
        }));
        it("should handle repository errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findByUserId.mockRejectedValue(new Error("Database error"));
            const result = yield transactionService.getTransactions(userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("An error occurred while retrieving transactions");
        }));
    });
    describe("getTransaction", () => {
        const transactionId = 1;
        const userId = 1;
        const mockTransaction = {
            id: 1,
            userId: 1,
            type: "EXPENSE",
            amount: 100.5,
            description: "Test expense",
            date: new Date("2023-12-01"),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        it("should successfully retrieve transaction", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findById.mockResolvedValue(mockTransaction);
            const result = yield transactionService.getTransaction(transactionId, userId);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTransaction);
            expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
        }));
        it("should reject invalid transaction ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.getTransaction(0, userId);
            expect(result.success).toBe(false);
            expect(result.error).toContain("Transaction ID must be positive");
            expect(mockRepository.findById).not.toHaveBeenCalled();
        }));
        it("should reject invalid user ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.getTransaction(transactionId, 0);
            expect(result.success).toBe(false);
            expect(result.error).toContain("User ID must be positive");
            expect(mockRepository.findById).not.toHaveBeenCalled();
        }));
        it("should return error when transaction not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findById.mockResolvedValue(null);
            const result = yield transactionService.getTransaction(transactionId, userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("Transaction not found");
        }));
        it("should reject access to transaction owned by different user", () => __awaiter(void 0, void 0, void 0, function* () {
            const otherUserTransaction = Object.assign(Object.assign({}, mockTransaction), { userId: 2 });
            mockRepository.findById.mockResolvedValue(otherUserTransaction);
            const result = yield transactionService.getTransaction(transactionId, userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("Access denied");
        }));
        it("should handle repository errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findById.mockRejectedValue(new Error("Database error"));
            const result = yield transactionService.getTransaction(transactionId, userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("An error occurred while retrieving the transaction");
        }));
    });
    describe("createTransaction", () => {
        const userId = 1;
        const validInput = {
            type: "EXPENSE",
            amount: 100.5,
            description: "Test expense",
            date: "2023-12-01",
        };
        const mockCreatedTransaction = {
            id: 1,
            userId: 1,
            type: "EXPENSE",
            amount: 100.5,
            description: "Test expense",
            date: new Date("2023-12-01"),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        it("should successfully create transaction", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.create.mockResolvedValue(mockCreatedTransaction);
            const result = yield transactionService.createTransaction(userId, validInput);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockCreatedTransaction);
            expect(mockRepository.create).toHaveBeenCalledWith({
                userId,
                type: validInput.type,
                amount: validInput.amount,
                description: validInput.description,
                date: new Date(validInput.date),
            });
        }));
        it("should successfully create transaction without description", () => __awaiter(void 0, void 0, void 0, function* () {
            const inputWithoutDescription = Object.assign({}, validInput);
            delete inputWithoutDescription.description;
            const expectedTransaction = Object.assign(Object.assign({}, mockCreatedTransaction), { description: null });
            mockRepository.create.mockResolvedValue(expectedTransaction);
            const result = yield transactionService.createTransaction(userId, inputWithoutDescription);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(expectedTransaction);
            expect(mockRepository.create).toHaveBeenCalledWith({
                userId,
                type: inputWithoutDescription.type,
                amount: inputWithoutDescription.amount,
                description: null,
                date: new Date(inputWithoutDescription.date),
            });
        }));
        it("should reject invalid user ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.createTransaction(0, validInput);
            expect(result.success).toBe(false);
            expect(result.error).toContain("User ID must be positive");
            expect(mockRepository.create).not.toHaveBeenCalled();
        }));
        it("should reject invalid transaction input", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidInput = Object.assign(Object.assign({}, validInput), { amount: -100 });
            const result = yield transactionService.createTransaction(userId, invalidInput);
            expect(result.success).toBe(false);
            expect(result.error).toContain("Amount must be a positive number");
            expect(mockRepository.create).not.toHaveBeenCalled();
        }));
        it("should handle repository errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.create.mockRejectedValue(new Error("Database error"));
            const result = yield transactionService.createTransaction(userId, validInput);
            expect(result.success).toBe(false);
            expect(result.error).toBe("An error occurred while creating the transaction");
        }));
    });
    describe("updateTransaction", () => {
        const transactionId = 1;
        const userId = 1;
        const existingTransaction = {
            id: 1,
            userId: 1,
            type: "EXPENSE",
            amount: 100.5,
            description: "Original expense",
            date: new Date("2023-12-01"),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        it("should successfully update transaction", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateInput = {
                amount: 150.75,
                description: "Updated expense",
            };
            const updatedTransaction = Object.assign(Object.assign({}, existingTransaction), { amount: 150.75, description: "Updated expense" });
            mockRepository.findById.mockResolvedValue(existingTransaction);
            mockRepository.update.mockResolvedValue(updatedTransaction);
            const result = yield transactionService.updateTransaction(transactionId, userId, updateInput);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(updatedTransaction);
            expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
            expect(mockRepository.update).toHaveBeenCalledWith(transactionId, {
                amount: 150.75,
                description: "Updated expense",
            });
        }));
        it("should reject invalid transaction ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.updateTransaction(0, userId, {
                amount: 100,
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain("Transaction ID must be positive");
            expect(mockRepository.findById).not.toHaveBeenCalled();
        }));
        it("should return error when transaction not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findById.mockResolvedValue(null);
            const result = yield transactionService.updateTransaction(transactionId, userId, { amount: 100 });
            expect(result.success).toBe(false);
            expect(result.error).toBe("Transaction not found");
            expect(mockRepository.update).not.toHaveBeenCalled();
        }));
        it("should reject access to transaction owned by different user", () => __awaiter(void 0, void 0, void 0, function* () {
            const otherUserTransaction = Object.assign(Object.assign({}, existingTransaction), { userId: 2 });
            mockRepository.findById.mockResolvedValue(otherUserTransaction);
            const result = yield transactionService.updateTransaction(transactionId, userId, { amount: 100 });
            expect(result.success).toBe(false);
            expect(result.error).toBe("Access denied");
            expect(mockRepository.update).not.toHaveBeenCalled();
        }));
        it("should reject invalid update input", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidInput = {
                amount: -100, // Invalid negative amount
            };
            const result = yield transactionService.updateTransaction(transactionId, userId, invalidInput);
            expect(result.success).toBe(false);
            expect(result.error).toContain("Amount must be a positive number");
            expect(mockRepository.findById).not.toHaveBeenCalled();
        }));
        it("should reject empty update input", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.updateTransaction(transactionId, userId, {});
            expect(result.success).toBe(false);
            expect(result.error).toContain("At least one field must be provided for update");
            expect(mockRepository.findById).not.toHaveBeenCalled();
        }));
    });
    describe("deleteTransaction", () => {
        const transactionId = 1;
        const userId = 1;
        const existingTransaction = {
            id: 1,
            userId: 1,
            type: "EXPENSE",
            amount: 100.5,
            description: "Test expense",
            date: new Date("2023-12-01"),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        it("should successfully delete transaction", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findById.mockResolvedValue(existingTransaction);
            mockRepository.delete.mockResolvedValue(true);
            const result = yield transactionService.deleteTransaction(transactionId, userId);
            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
            expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
            expect(mockRepository.delete).toHaveBeenCalledWith(transactionId);
        }));
        it("should reject invalid transaction ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.deleteTransaction(0, userId);
            expect(result.success).toBe(false);
            expect(result.error).toContain("Transaction ID must be positive");
            expect(mockRepository.findById).not.toHaveBeenCalled();
        }));
        it("should return error when transaction not found", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findById.mockResolvedValue(null);
            const result = yield transactionService.deleteTransaction(transactionId, userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("Transaction not found");
            expect(mockRepository.delete).not.toHaveBeenCalled();
        }));
        it("should reject access to transaction owned by different user", () => __awaiter(void 0, void 0, void 0, function* () {
            const otherUserTransaction = Object.assign(Object.assign({}, existingTransaction), { userId: 2 });
            mockRepository.findById.mockResolvedValue(otherUserTransaction);
            const result = yield transactionService.deleteTransaction(transactionId, userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("Access denied");
            expect(mockRepository.delete).not.toHaveBeenCalled();
        }));
        it("should handle repository delete failure", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.findById.mockResolvedValue(existingTransaction);
            mockRepository.delete.mockResolvedValue(false);
            const result = yield transactionService.deleteTransaction(transactionId, userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("Failed to delete transaction");
        }));
    });
    describe("getSummary", () => {
        const userId = 1;
        const mockSummary = {
            totalIncome: 1000.0,
            totalExpense: 500.0,
            balance: 500.0,
            transactionCount: 10,
        };
        it("should successfully retrieve summary", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.getSummary.mockResolvedValue(mockSummary);
            const result = yield transactionService.getSummary(userId);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockSummary);
            expect(mockRepository.getSummary).toHaveBeenCalledWith(userId);
        }));
        it("should reject invalid user ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionService.getSummary(0);
            expect(result.success).toBe(false);
            expect(result.error).toContain("User ID must be positive");
            expect(mockRepository.getSummary).not.toHaveBeenCalled();
        }));
        it("should handle repository errors", () => __awaiter(void 0, void 0, void 0, function* () {
            mockRepository.getSummary.mockRejectedValue(new Error("Database error"));
            const result = yield transactionService.getSummary(userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe("An error occurred while retrieving the summary");
        }));
    });
});
