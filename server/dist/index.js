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
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const cors_1 = __importDefault(require("cors"));
const typeDefs_1 = require("./graphql/schemas/typeDefs");
const resolvers_1 = require("./graphql/resolvers");
const context_1 = require("./graphql/context");
const errorHandler_1 = require("./graphql/errorHandler");
const connection_1 = __importDefault(require("./database/connection"));
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize database connection
            yield connection_1.default.connect();
            // Create Express app
            const app = (0, express_1.default)();
            // Trust proxy for rate limiting
            app.set("trust proxy", 1);
            // Apply middleware
            app.use((0, cors_1.default)(config_1.config.cors));
            app.use(express_1.default.json({ limit: "10mb" }));
            app.use(middleware_1.requestLogger);
            app.use(middleware_1.generalRateLimiter.middleware);
            app.use(utils_1.MonitoringUtils.requestMetrics);
            // Health check endpoint
            app.get("/health", utils_1.MonitoringUtils.healthCheckHandler);
            // Create Apollo Server
            const server = new apollo_server_express_1.ApolloServer({
                typeDefs: typeDefs_1.typeDefs,
                resolvers: resolvers_1.resolvers,
                context: context_1.createContext,
                formatError: errorHandler_1.formatError,
                introspection: config_1.config.graphql.introspection,
            });
            yield server.start();
            server.applyMiddleware({ app: app, path: "/graphql" });
            // Error handling middleware (must be last)
            app.use(middleware_1.notFoundHandler);
            app.use(middleware_1.errorHandler);
            // Start server
            const httpServer = app.listen(config_1.config.port, () => {
                utils_1.logger.info(`🚀 Server ready at http://localhost:${config_1.config.port}${server.graphqlPath}`);
                utils_1.logger.info(`📊 Health check available at http://localhost:${config_1.config.port}/health`);
                utils_1.logger.info(`🌍 Environment: ${config_1.config.nodeEnv}`);
            });
            // Start metrics logging
            utils_1.MonitoringUtils.startMetricsLogging(60000); // Log every minute
            // Graceful shutdown
            const gracefulShutdown = (signal) => __awaiter(this, void 0, void 0, function* () {
                utils_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
                httpServer.close(() => __awaiter(this, void 0, void 0, function* () {
                    utils_1.logger.info("HTTP server closed");
                    try {
                        yield server.stop();
                        utils_1.logger.info("Apollo server stopped");
                        yield connection_1.default.disconnect();
                        utils_1.logger.info("Database disconnected");
                        process.exit(0);
                    }
                    catch (error) {
                        utils_1.logger.error("Error during shutdown:", error);
                        process.exit(1);
                    }
                }));
            });
            process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
            process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        }
        catch (error) {
            utils_1.logger.error("Failed to start server:", error);
            process.exit(1);
        }
    });
}
// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    utils_1.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    utils_1.logger.error("Uncaught Exception:", error);
    process.exit(1);
});
// Start the server
startServer();
