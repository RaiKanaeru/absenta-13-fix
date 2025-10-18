// Authentication and Authorization Middleware
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || '';

// Get JWT_SECRET at runtime to ensure environment variables are loaded
function getJWTSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwtSecret;
}

// Authenticate JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = getJWTSecret();
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Role-based authorization with case-insensitive role checking
export const requireRole = (roles) => {
  return (req, res, next) => {
    // Normalize roles to lowercase for comparison
    const normalizedRoles = roles.map(r => r.toLowerCase());
    const userRole = req.user.role?.toLowerCase();
    
    console.log(`🔍 RBAC Check - Required: ${roles.join(', ')} | User role: ${req.user.role} | Match: ${normalizedRoles.includes(userRole)}`);
    
    if (!normalizedRoles.includes(userRole)) {
      console.log(`❌ RBAC: Access denied for role ${req.user.role}`);
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    console.log(`✅ RBAC: Access granted for role ${req.user.role}`);
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
  try {
    const jwtSecret = getJWTSecret();
    return jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role.toLowerCase(), // Convert role to lowercase for frontend compatibility
      iat: Math.floor(Date.now() / 1000)
    }, jwtSecret, { expiresIn: '24h' });
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};
