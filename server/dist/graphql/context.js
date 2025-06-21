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
exports.createContext = void 0;
const services_1 = require("../services");
const utils_1 = require("../utils");
const logger_1 = __importDefault(require("../utils/logger"));
const authService = new services_1.AuthService();
const createContext = (_a) => __awaiter(void 0, [_a], void 0, function* ({ req }) {
    const context = {};
    try {
        // Extract token from request headers
        const authHeader = req.headers.authorization;
        const token = utils_1.AuthUtils.extractTokenFromHeader(authHeader);
        if (token) {
            // Verify token and get user
            const result = yield authService.verifyToken(token);
            if (result.success && result.data) {
                context.user = result.data;
                context.token = token;
            }
        }
    }
    catch (error) {
        // Log error but don't throw - allow unauthenticated requests
        logger_1.default.warn('Context creation error:', error);
    }
    return context;
});
exports.createContext = createContext;
