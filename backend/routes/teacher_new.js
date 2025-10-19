// Teacher routes - New modular version
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
    getTeacherInfo, 
    updateTeacherProfile, 
    getTeacherSchedule, 
    getStudentsForSchedule, 
    submitTeacherAttendance, 
    getTeacherAttendanceHistory, 
    getTeacherDashboard 
} from '../controllers/teacherController.js';

const router = express.Router();

// Apply authentication and teacher role to all routes
router.use(authenticateToken);
router.use(requireRole(['guru', 'admin']));

// Teacher info endpoints
router.get('/info', getTeacherInfo);
router.put('/update-profile', updateTeacherProfile);

// Schedule endpoints
router.get('/schedule', getTeacherSchedule);

// Attendance endpoints
router.get('/schedule/:id/students', getStudentsForSchedule);
router.post('/attendance/submit', submitTeacherAttendance);
router.get('/attendance/history', getTeacherAttendanceHistory);

// Dashboard endpoint
router.get('/dashboard', getTeacherDashboard);

export default router;
