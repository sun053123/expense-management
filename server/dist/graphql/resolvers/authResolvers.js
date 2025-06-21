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
exports.authResolvers = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const services_1 = require("../../services");
const logger_1 = __importDefault(require("../../utils/logger"));
const authService = new services_1.AuthService();
exports.authResolvers = {
    Query: {
        me: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            if (!context.user) {
                throw new apollo_server_express_1.AuthenticationError('You must be logged in to access this resource');
            }
            return context.user;
        }),
        health: () => {
            return 'Server is running!';
        },
    },
    Mutation: {
        login: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { input }) {
            try {
                const result = yield authService.login(input.email, input.password);
                if (!result.success) {
                    throw new apollo_server_express_1.AuthenticationError(result.error || 'Login failed');
                }
                return result.data;
            }
            catch (error) {
                logger_1.default.error('Login resolver error:', error);
                if (error instanceof apollo_server_express_1.AuthenticationError) {
                    throw error;
                }
                throw new Error('An error occurred during login');
            }
        }),
        register: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { input }) {
            try {
                const result = yield authService.register(input.email, input.password);
                if (!result.success) {
                    throw new Error(result.error || 'Registration failed');
                }
                return result.data;
            }
            catch (error) {
                logger_1.default.error('Register resolver error:', error);
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error('An error occurred during registration');
            }
        }),
    },
};
