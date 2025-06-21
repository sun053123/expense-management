import { PrismaClient, TransactionType } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Create a test user
    const hashedPassword = await AuthUtils.hashPassword('password123');
    
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        password: hashedPassword,
      },
    });

    logger.info(`Created user: ${user.email}`);

    // Create sample transactions
    const transactions = [
      {
        userId: user.id,
        type: TransactionType.INCOME,
        amount: 5000.00,
        description: 'Monthly Salary',
        date: new Date('2023-12-01'),
      },
      {
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: 1200.00,
        description: 'Rent Payment',
        date: new Date('2023-12-01'),
      },
      {
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: 300.50,
        description: 'Groceries',
        date: new Date('2023-12-02'),
      },
      {
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: 50.00,
        description: 'Gas Station',
        date: new Date('2023-12-03'),
      },
      {
        userId: user.id,
        type: TransactionType.INCOME,
        amount: 200.00,
        description: 'Freelance Work',
        date: new Date('2023-12-05'),
      },
      {
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: 75.25,
        description: 'Restaurant',
        date: new Date('2023-12-06'),
      },
      {
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: 120.00,
        description: 'Utilities',
        date: new Date('2023-12-07'),
      },
      {
        userId: user.id,
        type: TransactionType.INCOME,
        amount: 150.00,
        description: 'Gift',
        date: new Date('2023-12-10'),
      },
    ];

    for (const transactionData of transactions) {
      await prisma.transaction.upsert({
        where: {
          id: -1, // This will never match, so it will always create
        },
        update: {},
        create: transactionData,
      });
    }

    logger.info(`Created ${transactions.length} sample transactions`);
    logger.info('Database seed completed successfully!');

    // Log summary
    const summary = await prisma.transaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
      _count: true,
    });

    logger.info(`Total transactions: ${summary._count}`);
    logger.info(`Total amount: $${summary._sum.amount}`);

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seed()
    .then(() => {
      logger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

export default seed;
