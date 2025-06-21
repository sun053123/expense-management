"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.config = {
    // Server Configuration
    port: parseInt(process.env.PORT || '8888', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    // Database Configuration
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/expense_management?schema=public',
    },
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    },
    // GraphQL Configuration
    graphql: {
        introspection: process.env.NODE_ENV !== 'production',
        playground: process.env.NODE_ENV !== 'production',
    },
};
// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.warn(`Warning: ${envVar} environment variable is not set`);
    }
}
exports.default = exports.config;
