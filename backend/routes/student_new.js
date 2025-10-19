// Student routes - New modular version
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
    getStudentInfo, 
    updateStudentProfile, 
    getStudentSchedule, 
    getStudentAttendanceHistory, 
    getStudentDashboard, 
    getStudentAttendanceSummary 
} from '../controllers/studentController.js';

const router = express.Router();

// Apply authentication and student role to all routes
router.use(authenticateToken);
router.use(requireRole(['siswa', 'admin']));

// Student info endpoints
router.get('/info', getStudentInfo);
router.put('/update-profile', updateStudentProfile);

// Schedule endpoints
router.get('/schedule', getStudentSchedule);

// Attendance endpoints
router.get('/attendance/history', getStudentAttendanceHistory);
router.get('/attendance/summary', getStudentAttendanceSummary);

// Dashboard endpoint
router.get('/dashboard', getStudentDashboard);

export default router;
