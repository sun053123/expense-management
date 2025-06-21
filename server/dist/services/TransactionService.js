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
exports.TransactionService = void 0;
const repositories_1 = require("../repositories");
const utils_1 = require("../utils");
const logger_1 = __importDefault(require("../utils/logger"));
class TransactionService {
    constructor() {
        this.transactionRepository = new repositories_1.TransactionRepository();
    }
    getTransactions(userId, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate filter if provided
                if (filter) {
                    const validation = utils_1.ValidationUtils.validateTransactionFilter(filter);
                    if (!validation.valid) {
                        return {
                            success: false,
                            error: validation.errors.join(", "),
                        };
                    }
                }
                const transactions = yield this.transactionRepository.findByUserId(userId, filter);
                return {
                    success: true,
                    data: transactions,
                };
            }
            catch (error) {
                logger_1.default.error(`Error getting transactions for user ${userId}:`, error);
                return {
                    success: false,
                    error: "Failed to retrieve transactions",
                };
            }
        });
    }
    getTransaction(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = yield this.transactionRepository.findById(id);
                if (!transaction) {
                    return {
                        success: false,
                        error: "Transaction not found",
                    };
                }
                // Check if transaction belongs to the user
                if (transaction.userId !== userId) {
                    return {
                        success: false,
                        error: "Access denied",
                    };
                }
                return {
                    success: true,
                    data: transaction,
                };
            }
            catch (error) {
                logger_1.default.error(`Error getting transaction ${id}:`, error);
                return {
                    success: false,
                    error: "Failed to retrieve transaction",
                };
            }
        });
    }
    createTransaction(userId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input
                const validation = utils_1.ValidationUtils.validateTransactionInput(input);
                if (!validation.valid) {
                    return {
                        success: false,
                        error: validation.errors.join(", "),
                    };
                }
                // Sanitize description
                const sanitizedDescription = input.description
                    ? utils_1.ValidationUtils.sanitizeString(input.description)
                    : null;
                const transactionData = {
                    userId,
                    type: input.type,
                    amount: input.amount,
                    description: sanitizedDescription,
                    date: new Date(input.date),
                };
                const transaction = yield this.transactionRepository.create(transactionData);
                logger_1.default.info(`Transaction created for user ${userId}: ${transaction.id}`);
                return {
                    success: true,
                    data: transaction,
                };
            }
            catch (error) {
                logger_1.default.error(`Error creating transaction for user ${userId}:`, error);
                return {
                    success: false,
                    error: "Failed to create transaction",
                };
            }
        });
    }
    updateTransaction(id, userId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if transaction exists and belongs to user
                const existingTransaction = yield this.transactionRepository.findById(id);
                if (!existingTransaction) {
                    return {
                        success: false,
                        error: "Transaction not found",
                    };
                }
                if (existingTransaction.userId !== userId) {
                    return {
                        success: false,
                        error: "Access denied",
                    };
                }
                // Validate input if provided
                if (Object.keys(input).length > 0) {
                    const fullInput = {
                        type: input.type || existingTransaction.type,
                        amount: input.amount !== undefined
                            ? input.amount
                            : existingTransaction.amount,
                        description: input.description !== undefined
                            ? input.description
                            : existingTransaction.description || undefined,
                        date: input.date || existingTransaction.date.toISOString().split("T")[0],
                    };
                    const validation = utils_1.ValidationUtils.validateTransactionInput(fullInput);
                    if (!validation.valid) {
                        return {
                            success: false,
                            error: validation.errors.join(", "),
                        };
                    }
                }
                // Prepare update data
                const updateData = {};
                if (input.type)
                    updateData.type = input.type;
                if (input.amount !== undefined)
                    updateData.amount = input.amount;
                if (input.description !== undefined) {
                    updateData.description = input.description
                        ? utils_1.ValidationUtils.sanitizeString(input.description)
                        : null;
                }
                if (input.date)
                    updateData.date = new Date(input.date);
                const transaction = yield this.transactionRepository.update(id, updateData);
                if (!transaction) {
                    return {
                        success: false,
                        error: "Failed to update transaction",
                    };
                }
                logger_1.default.info(`Transaction updated: ${id}`);
                return {
                    success: true,
                    data: transaction,
                };
            }
            catch (error) {
                logger_1.default.error(`Error updating transaction ${id}:`, error);
                return {
                    success: false,
                    error: "Failed to update transaction",
                };
            }
        });
    }
    deleteTransaction(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if transaction exists and belongs to user
                const existingTransaction = yield this.transactionRepository.findById(id);
                if (!existingTransaction) {
                    return {
                        success: false,
                        error: "Transaction not found",
                    };
                }
                if (existingTransaction.userId !== userId) {
                    return {
                        success: false,
                        error: "Access denied",
                    };
                }
                const deleted = yield this.transactionRepository.delete(id);
                if (!deleted) {
                    return {
                        success: false,
                        error: "Failed to delete transaction",
                    };
                }
                logger_1.default.info(`Transaction deleted: ${id}`);
                return {
                    success: true,
                    data: true,
                };
            }
            catch (error) {
                logger_1.default.error(`Error deleting transaction ${id}:`, error);
                return {
                    success: false,
                    error: "Failed to delete transaction",
                };
            }
        });
    }
    getSummary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const summary = yield this.transactionRepository.getSummary(userId);
                return {
                    success: true,
                    data: summary,
                };
            }
            catch (error) {
                logger_1.default.error(`Error getting summary for user ${userId}:`, error);
                return {
                    success: false,
                    error: "Failed to retrieve summary",
                };
            }
        });
    }
}
exports.TransactionService = TransactionService;
