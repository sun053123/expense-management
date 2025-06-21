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
exports.transactionResolvers = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const services_1 = require("../../services");
const repositories_1 = require("../../repositories");
const logger_1 = __importDefault(require("../../utils/logger"));
const transactionService = new services_1.TransactionService();
const userRepository = new repositories_1.UserRepository();
exports.transactionResolvers = {
    Query: {
        transactions: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { filter }, context) {
            if (!context.user) {
                throw new apollo_server_express_1.AuthenticationError('You must be logged in to access transactions');
            }
            try {
                const result = yield transactionService.getTransactions(context.user.id, filter);
                if (!result.success) {
                    throw new apollo_server_express_1.UserInputError(result.error || 'Failed to retrieve transactions');
                }
                return result.data || [];
            }
            catch (error) {
                logger_1.default.error('Transactions query error:', error);
                if (error instanceof apollo_server_express_1.AuthenticationError || error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error('An error occurred while retrieving transactions');
            }
        }),
        transaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id }, context) {
            if (!context.user) {
                throw new apollo_server_express_1.AuthenticationError('You must be logged in to access transactions');
            }
            try {
                const result = yield transactionService.getTransaction(parseInt(id), context.user.id);
                if (!result.success) {
                    if (result.error === 'Access denied') {
                        throw new apollo_server_express_1.ForbiddenError('You do not have permission to access this transaction');
                    }
                    throw new Error(result.error || 'Transaction not found');
                }
                return result.data;
            }
            catch (error) {
                logger_1.default.error('Transaction query error:', error);
                if (error instanceof apollo_server_express_1.AuthenticationError || error instanceof apollo_server_express_1.ForbiddenError) {
                    throw error;
                }
                throw new Error('An error occurred while retrieving the transaction');
            }
        }),
        summary: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            if (!context.user) {
                throw new apollo_server_express_1.AuthenticationError('You must be logged in to access summary');
            }
            try {
                const result = yield transactionService.getSummary(context.user.id);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to retrieve summary');
                }
                return result.data;
            }
            catch (error) {
                logger_1.default.error('Summary query error:', error);
                if (error instanceof apollo_server_express_1.AuthenticationError) {
                    throw error;
                }
                throw new Error('An error occurred while retrieving summary');
            }
        }),
    },
    Mutation: {
        addTransaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { input }, context) {
            if (!context.user) {
                throw new apollo_server_express_1.AuthenticationError('You must be logged in to add transactions');
            }
            try {
                const result = yield transactionService.createTransaction(context.user.id, input);
                if (!result.success) {
                    throw new apollo_server_express_1.UserInputError(result.error || 'Failed to create transaction');
                }
                return result.data;
            }
            catch (error) {
                logger_1.default.error('Add transaction mutation error:', error);
                if (error instanceof apollo_server_express_1.AuthenticationError || error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error('An error occurred while creating the transaction');
            }
        }),
        updateTransaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id, input }, context) {
            if (!context.user) {
                throw new apollo_server_express_1.AuthenticationError('You must be logged in to update transactions');
            }
            try {
                const result = yield transactionService.updateTransaction(parseInt(id), context.user.id, input);
                if (!result.success) {
                    if (result.error === 'Access denied') {
                        throw new apollo_server_express_1.ForbiddenError('You do not have permission to update this transaction');
                    }
                    throw new apollo_server_express_1.UserInputError(result.error || 'Failed to update transaction');
                }
                return result.data;
            }
            catch (error) {
                logger_1.default.error('Update transaction mutation error:', error);
                if (error instanceof apollo_server_express_1.AuthenticationError || error instanceof apollo_server_express_1.ForbiddenError || error instanceof apollo_server_express_1.UserInputError) {
                    throw error;
                }
                throw new Error('An error occurred while updating the transaction');
            }
        }),
        deleteTransaction: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id }, context) {
            if (!context.user) {
                throw new apollo_server_express_1.AuthenticationError('You must be logged in to delete transactions');
            }
            try {
                const result = yield transactionService.deleteTransaction(parseInt(id), context.user.id);
                if (!result.success) {
                    if (result.error === 'Access denied') {
                        throw new apollo_server_express_1.ForbiddenError('You do not have permission to delete this transaction');
                    }
                    throw new Error(result.error || 'Failed to delete transaction');
                }
                return result.data;
            }
            catch (error) {
                logger_1.default.error('Delete transaction mutation error:', error);
                if (error instanceof apollo_server_express_1.AuthenticationError || error instanceof apollo_server_express_1.ForbiddenError) {
                    throw error;
                }
                throw new Error('An error occurred while deleting the transaction');
            }
        }),
    },
    // Field resolvers
    Transaction: {
        user: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                return yield userRepository.findById(parent.userId);
            }
            catch (error) {
                logger_1.default.error('Transaction.user resolver error:', error);
                return null;
            }
        }),
    },
};
