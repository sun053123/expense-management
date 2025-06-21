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
exports.UserRepository = void 0;
const connection_1 = require("../database/connection");
const logger_1 = __importDefault(require("../utils/logger"));
class UserRepository {
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield connection_1.prisma.user.findUnique({
                    where: { id },
                });
                return user;
            }
            catch (error) {
                logger_1.default.error(`Error finding user by id ${id}:`, error);
                throw new Error('Failed to find user');
            }
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield connection_1.prisma.user.findUnique({
                    where: { email },
                });
                return user;
            }
            catch (error) {
                logger_1.default.error(`Error finding user by email ${email}:`, error);
                throw new Error('Failed to find user');
            }
        });
    }
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield connection_1.prisma.user.create({
                    data: {
                        email: userData.email,
                        password: userData.password,
                    },
                });
                return user;
            }
            catch (error) {
                logger_1.default.error('Error creating user:', error);
                if (error instanceof Error && error.message.includes('Unique constraint')) {
                    throw new Error('User with this email already exists');
                }
                throw new Error('Failed to create user');
            }
        });
    }
    update(id, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield connection_1.prisma.user.update({
                    where: { id },
                    data: Object.assign(Object.assign({}, (userData.email && { email: userData.email })), (userData.password && { password: userData.password })),
                });
                return user;
            }
            catch (error) {
                logger_1.default.error(`Error updating user ${id}:`, error);
                if (error instanceof Error && error.message.includes('Record to update not found')) {
                    return null;
                }
                throw new Error('Failed to update user');
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield connection_1.prisma.user.delete({
                    where: { id },
                });
                return true;
            }
            catch (error) {
                logger_1.default.error(`Error deleting user ${id}:`, error);
                if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
                    return false;
                }
                throw new Error('Failed to delete user');
            }
        });
    }
}
exports.UserRepository = UserRepository;
