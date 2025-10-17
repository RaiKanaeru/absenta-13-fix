// tests/unit/backend/middleware/accountLockout.test.js
import { recordFailedAttempt, recordSuccessfulAttempt, accountLockoutMiddleware } from '../../../backend/middleware/accountLockout.js';

// Mock database
const mockDb = {
  execute: jest.fn(),
};

jest.mock('../../../db.js', () => ({
  db: mockDb,
}));

// Mock logger
const mockLogger = {
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock('../../../backend/utils/logger.js', () => ({
  logger: mockLogger,
}));

describe('Account Lockout Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordFailedAttempt', () => {
    it('should record failed attempt and return lockout status', async () => {
      const username = 'testuser';
      const ipAddress = '127.0.0.1';
      const reason = 'invalid_password';

      // Mock database responses
      mockDb.execute
        .mockResolvedValueOnce([{ count: 4 }]) // Current failed attempts
        .mockResolvedValueOnce([]); // No existing lockouts

      const result = await recordFailedAttempt(username, ipAddress, reason);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO login_attempts (username, ip_address, success, reason) VALUES (?, ?, FALSE, ?)',
        [username, ipAddress, reason]
      );

      expect(mockDb.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM login_attempts WHERE username = ? AND success = FALSE AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)',
        [username, 15] // LOCKOUT_DURATION_MINUTES
      );

      expect(result).toEqual({
        isLocked: false,
        lockedUntil: null,
        message: '',
        isPermanent: false,
        attempts: 4,
        remainingAttempts: 1,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Failed Login Attempt',
        { username, ipAddress, reason, failedAttempts: 4 }
      );
    });

    it('should lock account after max failed attempts', async () => {
      const username = 'testuser';
      const ipAddress = '127.0.0.1';
      const reason = 'invalid_password';

      // Mock database responses - 5 failed attempts (threshold reached)
      mockDb.execute
        .mockResolvedValueOnce([{ count: 5 }]) // Current failed attempts
        .mockResolvedValueOnce([]); // No existing lockouts

      const result = await recordFailedAttempt(username, ipAddress, reason);

      expect(result.isLocked).toBe(true);
      expect(result.lockedUntil).toBeDefined();
      expect(result.message).toContain('Account locked due to too many failed login attempts');
      expect(result.isPermanent).toBe(false);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO account_lockouts (username, locked_until, is_permanent, reason) VALUES (?, ?, FALSE, ?)',
        [username, expect.any(Date), 'Too many failed login attempts']
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Account Locked',
        { username, ipAddress, failedAttempts: 5, isPermanent: false }
      );
    });

    it('should permanently lock account after excessive failed attempts', async () => {
      const username = 'testuser';
      const ipAddress = '127.0.0.1';
      const reason = 'invalid_password';

      // Mock database responses - 10 failed attempts (permanent threshold)
      mockDb.execute
        .mockResolvedValueOnce([{ count: 10 }]) // Current failed attempts
        .mockResolvedValueOnce([]); // No existing lockouts

      const result = await recordFailedAttempt(username, ipAddress, reason);

      expect(result.isLocked).toBe(true);
      expect(result.isPermanent).toBe(true);
      expect(result.message).toContain('Account permanently locked');

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO account_lockouts (username, locked_until, is_permanent, reason) VALUES (?, ?, TRUE, ?)',
        [username, null, 'Excessive failed login attempts']
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Account Locked',
        { username, ipAddress, failedAttempts: 10, isPermanent: true }
      );
    });

    it('should handle database errors', async () => {
      const username = 'testuser';
      const ipAddress = '127.0.0.1';
      const reason = 'invalid_password';

      mockDb.execute.mockRejectedValueOnce(new Error('Database error'));

      await expect(recordFailedAttempt(username, ipAddress, reason)).rejects.toThrow('Database error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error recording failed login attempt',
        { error: 'Database error', username, ipAddress }
      );
    });
  });

  describe('recordSuccessfulAttempt', () => {
    it('should record successful attempt and clear lockouts', async () => {
      const username = 'testuser';
      const ipAddress = '127.0.0.1';

      await recordSuccessfulAttempt(username, ipAddress);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO login_attempts (username, ip_address, success, reason) VALUES (?, ?, TRUE, ?)',
        [username, ipAddress, 'Successful login']
      );

      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM account_lockouts WHERE username = ? AND is_permanent = FALSE',
        [username]
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successful Login',
        { username, ipAddress }
      );
    });

    it('should handle database errors', async () => {
      const username = 'testuser';
      const ipAddress = '127.0.0.1';

      mockDb.execute.mockRejectedValueOnce(new Error('Database error'));

      await expect(recordSuccessfulAttempt(username, ipAddress)).rejects.toThrow('Database error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error recording successful login attempt',
        { error: 'Database error', username, ipAddress }
      );
    });
  });

  describe('accountLockoutMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {},
        ip: '127.0.0.1',
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should allow request when no username provided', async () => {
      const middleware = accountLockoutMiddleware();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockDb.execute).not.toHaveBeenCalled();
    });

    it('should allow request when account is not locked', async () => {
      req.body.username = 'testuser';
      mockDb.execute.mockResolvedValueOnce([]); // No active lockouts

      const middleware = accountLockoutMiddleware();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockDb.execute).toHaveBeenCalledWith(
        'SELECT * FROM account_lockouts WHERE username = ? AND (is_permanent = TRUE OR locked_until > NOW())',
        ['testuser']
      );
    });

    it('should block request when account is temporarily locked', async () => {
      req.body.username = 'testuser';
      const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      mockDb.execute.mockResolvedValueOnce([{
        username: 'testuser',
        locked_until: lockoutUntil,
        is_permanent: false,
        reason: 'Too many failed login attempts'
      }]);

      const middleware = accountLockoutMiddleware();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: `Account locked until ${lockoutUntil.toLocaleString()}.`,
        code: 'ACCOUNT_LOCKED_TEMPORARY',
        data: { lockedUntil: lockoutUntil }
      });
      expect(next).not.toHaveBeenCalled();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Attempt to login to temporarily locked account',
        { username: 'testuser', ipAddress: '127.0.0.1', lockedUntil: lockoutUntil }
      );
    });

    it('should block request when account is permanently locked', async () => {
      req.body.username = 'testuser';
      mockDb.execute.mockResolvedValueOnce([{
        username: 'testuser',
        locked_until: null,
        is_permanent: true,
        reason: 'Excessive failed login attempts'
      }]);

      const middleware = accountLockoutMiddleware();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account permanently locked. Please contact support.',
        code: 'ACCOUNT_LOCKED_PERMANENT'
      });
      expect(next).not.toHaveBeenCalled();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Attempt to login to permanently locked account',
        { username: 'testuser', ipAddress: '127.0.0.1' }
      );
    });

    it('should handle database errors', async () => {
      req.body.username = 'testuser';
      mockDb.execute.mockRejectedValueOnce(new Error('Database error'));

      const middleware = accountLockoutMiddleware();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error during lockout check'
      });
      expect(next).not.toHaveBeenCalled();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in account lockout middleware',
        { error: 'Database error', username: 'testuser', ipAddress: '127.0.0.1' }
      );
    });
  });
});
