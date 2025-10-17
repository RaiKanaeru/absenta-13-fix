// tests/unit/backend/middleware/auth.test.js
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole } from '../../../backend/middleware/auth.js';

// Mock database
const mockDb = {
  execute: jest.fn(),
};

jest.mock('../../../db.js', () => ({
  db: mockDb,
}));

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const user = { id: 1, username: 'testuser', role: 'admin' };
      const token = jwt.sign(user, 'test-secret');
      
      req.headers.authorization = `Bearer ${token}`;

      await authenticateToken(req, res, next);

      expect(req.user).toEqual(expect.objectContaining({
        id: user.id,
        username: user.username,
        role: user.role,
      }));
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token format',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const user = { id: 1, username: 'testuser', role: 'admin' };
      const token = jwt.sign(user, 'test-secret');
      
      req.headers.authorization = `Bearer ${token}`;
      mockDb.execute.mockRejectedValueOnce(new Error('Database error'));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.user = { id: 1, username: 'testuser', role: 'admin' };
    });

    it('should allow access for admin role', () => {
      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access for multiple roles', () => {
      req.user.role = 'guru';
      const middleware = requireRole(['admin', 'guru']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for insufficient role', () => {
      req.user.role = 'siswa';
      const middleware = requireRole(['admin', 'guru']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      req.user = null;
      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      const middleware = requireRole([]);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
