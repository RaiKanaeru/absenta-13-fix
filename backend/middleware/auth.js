// Authentication and Authorization Middleware
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET;
const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Authenticate JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Password hashing utility
export const hashPassword = async (password) => {
  const passwordWithPepper = password + PASSWORD_PEPPER;
  return await bcrypt.hash(passwordWithPepper, 10);
};

// Password verification utility
export const verifyPassword = async (password, hashedPassword) => {
  const passwordWithPepper = password + PASSWORD_PEPPER;
  return await bcrypt.compare(passwordWithPepper, hashedPassword);
};

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    username: user.nama_pengguna,
    role: user.peran,
    iat: Math.floor(Date.now() / 1000)
  }, JWT_SECRET, { expiresIn: '24h' });
};
