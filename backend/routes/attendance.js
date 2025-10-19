// Attendance routes
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
    submitScheduleAttendance, 
    getScheduleStudentAttendance, 
    getStudentAttendanceHistoryController, 
    getTeacherAttendanceHistoryController, 
    getAttendanceStats, 
    getClassAttendanceSummary, 
    getDailyAttendanceReport, 
    getAttendanceTrends 
} from '../controllers/attendanceController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Attendance submission (teachers only)
router.post('/submit', requireRole(['guru', 'admin']), submitScheduleAttendance);

// Get student attendance for schedule (teachers only)
router.get('/schedule/:id/students', requireRole(['guru', 'admin']), getScheduleStudentAttendance);

// Student attendance history (students and teachers)
router.get('/student/:studentId/history', requireRole(['siswa', 'guru', 'admin']), getStudentAttendanceHistoryController);

// Teacher attendance history (teachers and admin)
router.get('/teacher/:teacherId/history', requireRole(['guru', 'admin']), getTeacherAttendanceHistoryController);

// Attendance statistics (admin only)
router.get('/stats', requireRole(['admin']), getAttendanceStats);

// Class attendance summary (teachers and admin)
router.get('/class/:classId/summary', requireRole(['guru', 'admin']), getClassAttendanceSummary);

// Daily attendance report (admin only)
router.get('/daily-report', requireRole(['admin']), getDailyAttendanceReport);

// Attendance trends (admin only)
router.get('/trends', requireRole(['admin']), getAttendanceTrends);

export default router;