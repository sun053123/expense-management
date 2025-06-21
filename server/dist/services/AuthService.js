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
exports.AuthService = void 0;
const repositories_1 = require("../repositories");
const utils_1 = require("../utils");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    constructor() {
        this.userRepository = new repositories_1.UserRepository();
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input
                if (!email || !password) {
                    return {
                        success: false,
                        error: 'Email and password are required',
                    };
                }
                if (!utils_1.AuthUtils.isValidEmail(email)) {
                    return {
                        success: false,
                        error: 'Invalid email format',
                    };
                }
                // Find user by email
                const user = yield this.userRepository.findByEmail(email);
                if (!user) {
                    return {
                        success: false,
                        error: 'Invalid email or password',
                    };
                }
                // Verify password
                const isPasswordValid = yield utils_1.AuthUtils.comparePassword(password, user.password);
                if (!isPasswordValid) {
                    return {
                        success: false,
                        error: 'Invalid email or password',
                    };
                }
                // Generate token
                const userWithoutPassword = {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };
                const token = utils_1.AuthUtils.generateToken(userWithoutPassword);
                logger_1.default.info(`User ${user.email} logged in successfully`);
                return {
                    success: true,
                    data: {
                        token,
                        user: userWithoutPassword,
                    },
                };
            }
            catch (error) {
                logger_1.default.error('Login error:', error);
                return {
                    success: false,
                    error: 'An error occurred during login',
                };
            }
        });
    }
    register(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input
                if (!email || !password) {
                    return {
                        success: false,
                        error: 'Email and password are required',
                    };
                }
                if (!utils_1.AuthUtils.isValidEmail(email)) {
                    return {
                        success: false,
                        error: 'Invalid email format',
                    };
                }
                const passwordValidation = utils_1.AuthUtils.isValidPassword(password);
                if (!passwordValidation.valid) {
                    return {
                        success: false,
                        error: passwordValidation.message || 'Invalid password',
                    };
                }
                // Check if user already exists
                const existingUser = yield this.userRepository.findByEmail(email);
                if (existingUser) {
                    return {
                        success: false,
                        error: 'User with this email already exists',
                    };
                }
                // Hash password
                const hashedPassword = yield utils_1.AuthUtils.hashPassword(password);
                // Create user
                const user = yield this.userRepository.create({
                    email,
                    password: hashedPassword,
                });
                // Generate token
                const userWithoutPassword = {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };
                const token = utils_1.AuthUtils.generateToken(userWithoutPassword);
                logger_1.default.info(`User ${user.email} registered successfully`);
                return {
                    success: true,
                    data: {
                        token,
                        user: userWithoutPassword,
                    },
                };
            }
            catch (error) {
                logger_1.default.error('Registration error:', error);
                return {
                    success: false,
                    error: 'An error occurred during registration',
                };
            }
        });
    }
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify token
                const decoded = utils_1.AuthUtils.verifyToken(token);
                if (!decoded) {
                    return {
                        success: false,
                        error: 'Invalid or expired token',
                    };
                }
                // Find user
                const user = yield this.userRepository.findById(decoded.id);
                if (!user) {
                    return {
                        success: false,
                        error: 'User not found',
                    };
                }
                const userWithoutPassword = {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };
                return {
                    success: true,
                    data: userWithoutPassword,
                };
            }
            catch (error) {
                logger_1.default.error('Token verification error:', error);
                return {
                    success: false,
                    error: 'Token verification failed',
                };
            }
        });
    }
}
exports.AuthService = AuthService;
