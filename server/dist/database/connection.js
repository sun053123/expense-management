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
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
// Create a singleton Prisma client instance
class DatabaseConnection {
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new client_1.PrismaClient({
                log: config_1.config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
                datasources: {
                    db: {
                        url: config_1.config.database.url,
                    },
                },
            });
        }
        return DatabaseConnection.instance;
    }
    static connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = DatabaseConnection.getInstance();
                yield prisma.$connect();
                console.log('✅ Database connected successfully');
            }
            catch (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }
        });
    }
    static disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = DatabaseConnection.getInstance();
                yield prisma.$disconnect();
                console.log('✅ Database disconnected successfully');
            }
            catch (error) {
                console.error('❌ Database disconnection failed:', error);
                throw error;
            }
        });
    }
    static healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = DatabaseConnection.getInstance();
                yield prisma.$queryRaw `SELECT 1`;
                return true;
            }
            catch (error) {
                console.error('❌ Database health check failed:', error);
                return false;
            }
        });
    }
}
exports.prisma = DatabaseConnection.getInstance();
exports.default = DatabaseConnection;
