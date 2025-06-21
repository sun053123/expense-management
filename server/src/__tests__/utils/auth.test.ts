import { AuthUtils } from '../../utils/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await AuthUtils.hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await AuthUtils.comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await AuthUtils.comparePassword(password, hashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = 'generated-token';

      mockedJwt.sign.mockReturnValue(token as never);

      const result = AuthUtils.generateToken(user);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      expect(result).toBe(token);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = 'valid-token';
      const decoded = { id: 1, email: 'test@example.com' };

      mockedJwt.verify.mockReturnValue(decoded as never);

      const result = AuthUtils.verifyToken(token);

      expect(mockedJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(result).toEqual(decoded);
    });

    it('should return null for invalid token', () => {
      const token = 'invalid-token';

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = AuthUtils.verifyToken(token);

      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const authHeader = 'Bearer valid-token';
      const result = AuthUtils.extractTokenFromHeader(authHeader);
      expect(result).toBe('valid-token');
    });

    it('should return null for invalid header format', () => {
      const authHeader = 'Invalid header';
      const result = AuthUtils.extractTokenFromHeader(authHeader);
      expect(result).toBeNull();
    });

    it('should return null for undefined header', () => {
      const result = AuthUtils.extractTokenFromHeader(undefined);
      expect(result).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(AuthUtils.isValidEmail('test@example.com')).toBe(true);
      expect(AuthUtils.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(AuthUtils.isValidEmail('invalid-email')).toBe(false);
      expect(AuthUtils.isValidEmail('test@')).toBe(false);
      expect(AuthUtils.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return valid for good password', () => {
      const result = AuthUtils.isValidPassword('goodpassword');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for short password', () => {
      const result = AuthUtils.isValidPassword('short');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 6 characters');
    });

    it('should return invalid for too long password', () => {
      const longPassword = 'a'.repeat(129);
      const result = AuthUtils.isValidPassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('less than 128 characters');
    });
  });
});
