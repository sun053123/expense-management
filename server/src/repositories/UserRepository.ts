import { User, IUserRepository } from '../types';
import { prisma } from '../database/connection';
import logger from '../utils/logger';

export class UserRepository implements IUserRepository {
  async findById(id: number): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error) {
      logger.error(`Error finding user by id ${id}:`, error);
      throw new Error('Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw new Error('Failed to find user');
    }
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
        },
      });
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('User with this email already exists');
      }
      throw new Error('Failed to create user');
    }
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(userData.email && { email: userData.email }),
          ...(userData.password && { password: userData.password }),
        },
      });
      return user;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return null;
      }
      throw new Error('Failed to update user');
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return false;
      }
      throw new Error('Failed to delete user');
    }
  }
}
