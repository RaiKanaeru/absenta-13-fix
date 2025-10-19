// Admin routes - New modular version
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
    getAdminInfo, 
    updateAdminProfile, 
    getAllUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser, 
    getSystemStats, 
    getDashboardData 
} from '../controllers/adminController.js';

const router = express.Router();

// Apply authentication and admin role to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Admin info endpoints
router.get('/info', getAdminInfo);
router.put('/update-profile', updateAdminProfile);

// User management endpoints
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// System endpoints
router.get('/stats', getSystemStats);
router.get('/dashboard', getDashboardData);

export default router;
