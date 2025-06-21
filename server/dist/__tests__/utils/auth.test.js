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
const auth_1 = require("../../utils/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
const mockedJwt = jsonwebtoken_1.default;
const mockedBcrypt = bcryptjs_1.default;
describe('AuthUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('hashPassword', () => {
        it('should hash a password successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const password = 'testpassword';
            const hashedPassword = 'hashedpassword';
            mockedBcrypt.hash.mockResolvedValue(hashedPassword);
            const result = yield auth_1.AuthUtils.hashPassword(password);
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
            expect(result).toBe(hashedPassword);
        }));
    });
    describe('comparePassword', () => {
        it('should return true for matching passwords', () => __awaiter(void 0, void 0, void 0, function* () {
            const password = 'testpassword';
            const hashedPassword = 'hashedpassword';
            mockedBcrypt.compare.mockResolvedValue(true);
            const result = yield auth_1.AuthUtils.comparePassword(password, hashedPassword);
            expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
            expect(result).toBe(true);
        }));
        it('should return false for non-matching passwords', () => __awaiter(void 0, void 0, void 0, function* () {
            const password = 'testpassword';
            const hashedPassword = 'hashedpassword';
            mockedBcrypt.compare.mockResolvedValue(false);
            const result = yield auth_1.AuthUtils.comparePassword(password, hashedPassword);
            expect(result).toBe(false);
        }));
    });
    describe('generateToken', () => {
        it('should generate a JWT token', () => {
            const user = {
                id: 1,
                email: 'test@example.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const token = 'generated-token';
            mockedJwt.sign.mockReturnValue(token);
            const result = auth_1.AuthUtils.generateToken(user);
            expect(mockedJwt.sign).toHaveBeenCalledWith({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
            expect(result).toBe(token);
        });
    });
    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const token = 'valid-token';
            const decoded = { id: 1, email: 'test@example.com' };
            mockedJwt.verify.mockReturnValue(decoded);
            const result = auth_1.AuthUtils.verifyToken(token);
            expect(mockedJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(result).toEqual(decoded);
        });
        it('should return null for invalid token', () => {
            const token = 'invalid-token';
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            const result = auth_1.AuthUtils.verifyToken(token);
            expect(result).toBeNull();
        });
    });
    describe('extractTokenFromHeader', () => {
        it('should extract token from Bearer header', () => {
            const authHeader = 'Bearer valid-token';
            const result = auth_1.AuthUtils.extractTokenFromHeader(authHeader);
            expect(result).toBe('valid-token');
        });
        it('should return null for invalid header format', () => {
            const authHeader = 'Invalid header';
            const result = auth_1.AuthUtils.extractTokenFromHeader(authHeader);
            expect(result).toBeNull();
        });
        it('should return null for undefined header', () => {
            const result = auth_1.AuthUtils.extractTokenFromHeader(undefined);
            expect(result).toBeNull();
        });
    });
    describe('isValidEmail', () => {
        it('should return true for valid email', () => {
            expect(auth_1.AuthUtils.isValidEmail('test@example.com')).toBe(true);
            expect(auth_1.AuthUtils.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
        });
        it('should return false for invalid email', () => {
            expect(auth_1.AuthUtils.isValidEmail('invalid-email')).toBe(false);
            expect(auth_1.AuthUtils.isValidEmail('test@')).toBe(false);
            expect(auth_1.AuthUtils.isValidEmail('@example.com')).toBe(false);
        });
    });
    describe('isValidPassword', () => {
        it('should return valid for good password', () => {
            const result = auth_1.AuthUtils.isValidPassword('goodpassword');
            expect(result.valid).toBe(true);
        });
        it('should return invalid for short password', () => {
            const result = auth_1.AuthUtils.isValidPassword('short');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('at least 6 characters');
        });
        it('should return invalid for too long password', () => {
            const longPassword = 'a'.repeat(129);
            const result = auth_1.AuthUtils.isValidPassword(longPassword);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('less than 128 characters');
        });
    });
});
