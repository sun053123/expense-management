import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import { typeDefs } from "./graphql/schemas/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { createContext } from "./graphql/context";
import { formatError } from "./graphql/errorHandler";
import DatabaseConnection from "./database/connection";
import { config } from "./config";
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  generalRateLimiter,
} from "./middleware";
import { MonitoringUtils, logger } from "./utils";

async function startServer() {
  try {
    // Initialize database connection
    await DatabaseConnection.connect();

    // Create Express app
    const app = express();

    // Trust proxy for rate limiting
    app.set("trust proxy", 1);

    // Apply middleware
    app.use(cors(config.cors));
    app.use(express.json({ limit: "10mb" }));
    app.use(requestLogger);
    app.use(generalRateLimiter.middleware);
    app.use(MonitoringUtils.requestMetrics);

    // Health check endpoint
    app.get("/health", MonitoringUtils.healthCheckHandler);

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: createContext,
      formatError,
      introspection: config.graphql.introspection,
    });

    await server.start();
    server.applyMiddleware({ app: app as any, path: "/graphql" });

    // Error handling middleware (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Start server
    const httpServer = app.listen(config.port, () => {
      logger.info(
        `🚀 Server ready at http://localhost:${config.port}${server.graphqlPath}`
      );
      logger.info(
        `📊 Health check available at http://localhost:${config.port}/health`
      );
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });

    // Start metrics logging
    MonitoringUtils.startMetricsLogging(60000); // Log every minute

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      httpServer.close(async () => {
        logger.info("HTTP server closed");

        try {
          await server.stop();
          logger.info("Apollo server stopped");

          await DatabaseConnection.disconnect();
          logger.info("Database disconnected");

          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start the server
startServer();
