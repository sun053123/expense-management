import { AuthService } from '../../services/AuthService';
import { UserRepository } from '../../repositories/UserRepository';
import { AuthUtils } from '../../utils/auth';

// Mock dependencies
jest.mock('../../repositories/UserRepository');
jest.mock('../../utils/auth');

const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const MockedAuthUtils = AuthUtils as jest.Mocked<typeof AuthUtils>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = new MockedUserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService();
    // Replace the repository instance
    (authService as any).userRepository = mockUserRepository;
  });

  describe('login', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'password123';
    const hashedPassword = 'hashedpassword';
    const mockUser = {
      id: 1,
      email: validEmail,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      MockedAuthUtils.comparePassword.mockResolvedValue(true);
      MockedAuthUtils.generateToken.mockReturnValue('jwt-token');

      const result = await authService.login(validEmail, validPassword);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        token: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should fail with missing email or password', async () => {
      const result = await authService.login('', validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
    });

    it('should fail with invalid email format', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(false);

      const result = await authService.login('invalid-email', validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail with non-existent user', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.login(validEmail, validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should fail with incorrect password', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      MockedAuthUtils.comparePassword.mockResolvedValue(false);

      const result = await authService.login(validEmail, 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });
  });

  describe('register', () => {
    const validEmail = 'newuser@example.com';
    const validPassword = 'password123';
    const hashedPassword = 'hashedpassword';

    it('should register successfully with valid data', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      MockedAuthUtils.isValidPassword.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      MockedAuthUtils.hashPassword.mockResolvedValue(hashedPassword);
      
      const newUser = {
        id: 1,
        email: validEmail,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserRepository.create.mockResolvedValue(newUser);
      MockedAuthUtils.generateToken.mockReturnValue('jwt-token');

      const result = await authService.register(validEmail, validPassword);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        token: 'jwt-token',
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
      });
    });

    it('should fail with missing email or password', async () => {
      const result = await authService.register('', validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
    });

    it('should fail with invalid email format', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(false);

      const result = await authService.register('invalid-email', validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail with invalid password', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      MockedAuthUtils.isValidPassword.mockReturnValue({ 
        valid: false, 
        message: 'Password too short' 
      });

      const result = await authService.register(validEmail, 'short');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password too short');
    });

    it('should fail with existing user', async () => {
      MockedAuthUtils.isValidEmail.mockReturnValue(true);
      MockedAuthUtils.isValidPassword.mockReturnValue({ valid: true });
      
      const existingUser = {
        id: 1,
        email: validEmail,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      const result = await authService.register(validEmail, validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
    });
  });

  describe('verifyToken', () => {
    const validToken = 'valid-jwt-token';
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should verify valid token successfully', async () => {
      MockedAuthUtils.verifyToken.mockReturnValue({ id: 1, email: 'test@example.com' });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.verifyToken(validToken);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should fail with invalid token', async () => {
      MockedAuthUtils.verifyToken.mockReturnValue(null);

      const result = await authService.verifyToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should fail when user not found', async () => {
      MockedAuthUtils.verifyToken.mockReturnValue({ id: 1, email: 'test@example.com' });
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.verifyToken(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });
});
