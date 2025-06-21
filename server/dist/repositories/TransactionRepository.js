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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const types_1 = require("../types");
const connection_1 = require("../database/connection");
const logger_1 = __importDefault(require("../utils/logger"));
class TransactionRepository {
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = yield connection_1.prisma.transaction.findUnique({
                    where: { id },
                });
                if (!transaction)
                    return null;
                return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
            }
            catch (error) {
                logger_1.default.error(`Error finding transaction by id ${id}:`, error);
                throw new Error("Failed to find transaction");
            }
        });
    }
    findByUserId(userId, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const where = { userId };
                // Apply filters
                if (filter === null || filter === void 0 ? void 0 : filter.type) {
                    where.type = filter.type;
                }
                if ((filter === null || filter === void 0 ? void 0 : filter.startDate) || (filter === null || filter === void 0 ? void 0 : filter.endDate)) {
                    where.date = {};
                    if (filter.startDate) {
                        where.date.gte = new Date(filter.startDate);
                    }
                    if (filter.endDate) {
                        where.date.lte = new Date(filter.endDate);
                    }
                }
                const transactions = yield connection_1.prisma.transaction.findMany({
                    where,
                    orderBy: { date: "desc" },
                });
                return transactions.map((transaction) => (Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) })));
            }
            catch (error) {
                logger_1.default.error(`Error finding transactions for user ${userId}:`, error);
                throw new Error("Failed to find transactions");
            }
        });
    }
    create(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = yield connection_1.prisma.transaction.create({
                    data: {
                        userId: transactionData.userId,
                        type: transactionData.type,
                        amount: transactionData.amount,
                        description: transactionData.description,
                        date: transactionData.date,
                    },
                });
                return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
            }
            catch (error) {
                logger_1.default.error("Error creating transaction:", error);
                throw new Error("Failed to create transaction");
            }
        });
    }
    update(id, transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = yield connection_1.prisma.transaction.update({
                    where: { id },
                    data: Object.assign(Object.assign(Object.assign(Object.assign({}, (transactionData.type && { type: transactionData.type })), (transactionData.amount !== undefined && {
                        amount: transactionData.amount,
                    })), (transactionData.description !== undefined && {
                        description: transactionData.description,
                    })), (transactionData.date && { date: transactionData.date })),
                });
                return Object.assign(Object.assign({}, transaction), { amount: Number(transaction.amount) });
            }
            catch (error) {
                logger_1.default.error(`Error updating transaction ${id}:`, error);
                if (error instanceof Error &&
                    error.message.includes("Record to update not found")) {
                    return null;
                }
                throw new Error("Failed to update transaction");
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield connection_1.prisma.transaction.delete({
                    where: { id },
                });
                return true;
            }
            catch (error) {
                logger_1.default.error(`Error deleting transaction ${id}:`, error);
                if (error instanceof Error &&
                    error.message.includes("Record to delete does not exist")) {
                    return false;
                }
                throw new Error("Failed to delete transaction");
            }
        });
    }
    getSummary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [incomeResult, expenseResult, transactionCount] = yield Promise.all([
                    connection_1.prisma.transaction.aggregate({
                        where: { userId, type: types_1.TransactionType.INCOME },
                        _sum: { amount: true },
                    }),
                    connection_1.prisma.transaction.aggregate({
                        where: { userId, type: types_1.TransactionType.EXPENSE },
                        _sum: { amount: true },
                    }),
                    connection_1.prisma.transaction.count({
                        where: { userId },
                    }),
                ]);
                const totalIncome = Number(incomeResult._sum.amount) || 0;
                const totalExpense = Number(expenseResult._sum.amount) || 0;
                const balance = totalIncome - totalExpense;
                return {
                    totalIncome,
                    totalExpense,
                    balance,
                    transactionCount,
                };
            }
            catch (error) {
                logger_1.default.error(`Error getting summary for user ${userId}:`, error);
                throw new Error("Failed to get summary");
            }
        });
    }
}
exports.TransactionRepository = TransactionRepository;
