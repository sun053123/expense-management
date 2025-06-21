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
const AuthService_1 = require("../../services/AuthService");
const UserRepository_1 = require("../../repositories/UserRepository");
const auth_1 = require("../../utils/auth");
// Mock dependencies
jest.mock('../../repositories/UserRepository');
jest.mock('../../utils/auth');
const MockedUserRepository = UserRepository_1.UserRepository;
const MockedAuthUtils = auth_1.AuthUtils;
describe('AuthService', () => {
    let authService;
    let mockUserRepository;
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepository = new MockedUserRepository();
        authService = new AuthService_1.AuthService();
        // Replace the repository instance
        authService.userRepository = mockUserRepository;
    });
    describe('login', () => {
        const validEmail = 'test@example.com';
        const validPassword = 'password123';
        const hashedPassword = 'hashedpassword';
        const mockUser = {
            id: 1,
            email: validEmail,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        it('should login successfully with valid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(true);
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            MockedAuthUtils.comparePassword.mockResolvedValue(true);
            MockedAuthUtils.generateToken.mockReturnValue('jwt-token');
            const result = yield authService.login(validEmail, validPassword);
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                token: 'jwt-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    createdAt: mockUser.createdAt,
                    updatedAt: mockUser.updatedAt,
                },
            });
        }));
        it('should fail with missing email or password', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield authService.login('', validPassword);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Email and password are required');
        }));
        it('should fail with invalid email format', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(false);
            const result = yield authService.login('invalid-email', validPassword);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid email format');
        }));
        it('should fail with non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(true);
            mockUserRepository.findByEmail.mockResolvedValue(null);
            const result = yield authService.login(validEmail, validPassword);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid email or password');
        }));
        it('should fail with incorrect password', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(true);
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            MockedAuthUtils.comparePassword.mockResolvedValue(false);
            const result = yield authService.login(validEmail, 'wrongpassword');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid email or password');
        }));
    });
    describe('register', () => {
        const validEmail = 'newuser@example.com';
        const validPassword = 'password123';
        const hashedPassword = 'hashedpassword';
        it('should register successfully with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(true);
            MockedAuthUtils.isValidPassword.mockReturnValue({ valid: true });
            mockUserRepository.findByEmail.mockResolvedValue(null);
            MockedAuthUtils.hashPassword.mockResolvedValue(hashedPassword);
            const newUser = {
                id: 1,
                email: validEmail,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockUserRepository.create.mockResolvedValue(newUser);
            MockedAuthUtils.generateToken.mockReturnValue('jwt-token');
            const result = yield authService.register(validEmail, validPassword);
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                token: 'jwt-token',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    createdAt: newUser.createdAt,
                    updatedAt: newUser.updatedAt,
                },
            });
        }));
        it('should fail with missing email or password', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield authService.register('', validPassword);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Email and password are required');
        }));
        it('should fail with invalid email format', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(false);
            const result = yield authService.register('invalid-email', validPassword);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid email format');
        }));
        it('should fail with invalid password', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(true);
            MockedAuthUtils.isValidPassword.mockReturnValue({
                valid: false,
                message: 'Password too short'
            });
            const result = yield authService.register(validEmail, 'short');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Password too short');
        }));
        it('should fail with existing user', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.isValidEmail.mockReturnValue(true);
            MockedAuthUtils.isValidPassword.mockReturnValue({ valid: true });
            const existingUser = {
                id: 1,
                email: validEmail,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockUserRepository.findByEmail.mockResolvedValue(existingUser);
            const result = yield authService.register(validEmail, validPassword);
            expect(result.success).toBe(false);
            expect(result.error).toBe('User with this email already exists');
        }));
    });
    describe('verifyToken', () => {
        const validToken = 'valid-jwt-token';
        const mockUser = {
            id: 1,
            email: 'test@example.com',
            password: 'hashedpassword',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        it('should verify valid token successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.verifyToken.mockReturnValue({ id: 1, email: 'test@example.com' });
            mockUserRepository.findById.mockResolvedValue(mockUser);
            const result = yield authService.verifyToken(validToken);
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                createdAt: mockUser.createdAt,
                updatedAt: mockUser.updatedAt,
            });
        }));
        it('should fail with invalid token', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.verifyToken.mockReturnValue(null);
            const result = yield authService.verifyToken('invalid-token');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid or expired token');
        }));
        it('should fail when user not found', () => __awaiter(void 0, void 0, void 0, function* () {
            MockedAuthUtils.verifyToken.mockReturnValue({ id: 1, email: 'test@example.com' });
            mockUserRepository.findById.mockResolvedValue(null);
            const result = yield authService.verifyToken(validToken);
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not found');
        }));
    });
});
