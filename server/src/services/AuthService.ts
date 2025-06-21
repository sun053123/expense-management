import { IAuthService, ServiceResponse, AuthPayload, User } from '../types';
import { UserRepository } from '../repositories';
import { AuthUtils } from '../utils';
import logger from '../utils/logger';

export class AuthService implements IAuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(email: string, password: string): Promise<ServiceResponse<AuthPayload>> {
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      if (!AuthUtils.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Verify password
      const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
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

      const token = AuthUtils.generateToken(userWithoutPassword);

      logger.info(`User ${user.email} logged in successfully`);

      return {
        success: true,
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }

  async register(email: string, password: string): Promise<ServiceResponse<AuthPayload>> {
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      if (!AuthUtils.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      const passwordValidation = AuthUtils.isValidPassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.message || 'Invalid password',
        };
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Create user
      const user = await this.userRepository.create({
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

      const token = AuthUtils.generateToken(userWithoutPassword);

      logger.info(`User ${user.email} registered successfully`);

      return {
        success: true,
        data: {
          token,
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      logger.error('Registration error:', error);
      return {
        success: false,
        error: 'An error occurred during registration',
      };
    }
  }

  async verifyToken(token: string): Promise<ServiceResponse<Omit<User, 'password'>>> {
    try {
      // Verify token
      const decoded = AuthUtils.verifyToken(token);
      if (!decoded) {
        return {
          success: false,
          error: 'Invalid or expired token',
        };
      }

      // Find user
      const user = await this.userRepository.findById(decoded.id);
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
    } catch (error) {
      logger.error('Token verification error:', error);
      return {
        success: false,
        error: 'Token verification failed',
      };
    }
  }
}
