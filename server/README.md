# Expense Management System - Backend Server

A robust GraphQL API server for expense management built with Express.js, Apollo Server, TypeScript, and PostgreSQL.

## Features

- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 📊 **GraphQL API** - Modern, flexible API with Apollo Server
- 💾 **PostgreSQL Database** - Reliable data storage with Prisma ORM
- 🏗️ **Clean Architecture** - Well-structured codebase with separation of concerns
- 🛡️ **Security** - Rate limiting, input validation, and error handling
- 📝 **Logging** - Comprehensive logging with Winston
- 🧪 **Testing** - Unit tests with Jest
- 🐳 **Docker Support** - Easy deployment with Docker Compose
- 📈 **Monitoring** - Health checks and performance metrics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **GraphQL**: Apollo Server
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Testing**: Jest
- **Logging**: Winston
- **Validation**: Custom validators
- **Security**: bcryptjs, rate limiting

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-management/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL database**
   ```bash
   # Using Docker
   docker-compose up -d db
   
   # Or start your local PostgreSQL instance
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The server will be available at `http://localhost:8888/graphql`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed the database with sample data

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 8888 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | CORS allowed origins | http://localhost:5173 |

## API Documentation

The GraphQL API documentation is available at:
- **GraphQL Playground**: `http://localhost:8888/graphql` (development only)
- **API Documentation**: [docs/API_DOCS.md](../docs/API_DOCS.md)

### Key Endpoints

- **GraphQL API**: `POST /graphql`
- **Health Check**: `GET /health`

## Project Structure

```
src/
├── config/           # Configuration management
├── database/         # Database connection and utilities
├── graphql/          # GraphQL schema and resolvers
│   ├── schemas/      # Type definitions
│   └── resolvers/    # Query and mutation resolvers
├── middleware/       # Express middleware
├── repositories/     # Data access layer
├── services/         # Business logic layer
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── __tests__/        # Test files
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f server

# Stop services
docker-compose down
```

### Building Docker Image

```bash
# Build the image
docker build -t expense-management-server .

# Run the container
docker run -p 8888:8888 expense-management-server
```

## Production Deployment

1. **Set production environment variables**
2. **Build the application**
   ```bash
   npm run build
   ```
3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```
4. **Start the server**
   ```bash
   npm start
   ```

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Error handling without information leakage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.
