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
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.default.info('Starting database seed...');
            // Create a test user
            const hashedPassword = yield auth_1.AuthUtils.hashPassword('password123');
            const user = yield prisma.user.upsert({
                where: { email: 'demo@example.com' },
                update: {},
                create: {
                    email: 'demo@example.com',
                    password: hashedPassword,
                },
            });
            logger_1.default.info(`Created user: ${user.email}`);
            // Create sample transactions
            const transactions = [
                {
                    userId: user.id,
                    type: client_1.TransactionType.INCOME,
                    amount: 5000.00,
                    description: 'Monthly Salary',
                    date: new Date('2023-12-01'),
                },
                {
                    userId: user.id,
                    type: client_1.TransactionType.EXPENSE,
                    amount: 1200.00,
                    description: 'Rent Payment',
                    date: new Date('2023-12-01'),
                },
                {
                    userId: user.id,
                    type: client_1.TransactionType.EXPENSE,
                    amount: 300.50,
                    description: 'Groceries',
                    date: new Date('2023-12-02'),
                },
                {
                    userId: user.id,
                    type: client_1.TransactionType.EXPENSE,
                    amount: 50.00,
                    description: 'Gas Station',
                    date: new Date('2023-12-03'),
                },
                {
                    userId: user.id,
                    type: client_1.TransactionType.INCOME,
                    amount: 200.00,
                    description: 'Freelance Work',
                    date: new Date('2023-12-05'),
                },
                {
                    userId: user.id,
                    type: client_1.TransactionType.EXPENSE,
                    amount: 75.25,
                    description: 'Restaurant',
                    date: new Date('2023-12-06'),
                },
                {
                    userId: user.id,
                    type: client_1.TransactionType.EXPENSE,
                    amount: 120.00,
                    description: 'Utilities',
                    date: new Date('2023-12-07'),
                },
                {
                    userId: user.id,
                    type: client_1.TransactionType.INCOME,
                    amount: 150.00,
                    description: 'Gift',
                    date: new Date('2023-12-10'),
                },
            ];
            for (const transactionData of transactions) {
                yield prisma.transaction.upsert({
                    where: {
                        id: -1, // This will never match, so it will always create
                    },
                    update: {},
                    create: transactionData,
                });
            }
            logger_1.default.info(`Created ${transactions.length} sample transactions`);
            logger_1.default.info('Database seed completed successfully!');
            // Log summary
            const summary = yield prisma.transaction.aggregate({
                where: { userId: user.id },
                _sum: { amount: true },
                _count: true,
            });
            logger_1.default.info(`Total transactions: ${summary._count}`);
            logger_1.default.info(`Total amount: $${summary._sum.amount}`);
        }
        catch (error) {
            logger_1.default.error('Error seeding database:', error);
            throw error;
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Run the seed function
if (require.main === module) {
    seed()
        .then(() => {
        logger_1.default.info('Seed script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Seed script failed:', error);
        process.exit(1);
    });
}
exports.default = seed;
