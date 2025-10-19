// Report routes
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
    generateAttendanceReportController,
    generateTeacherReportController,
    generateStudentReportController,
    getSystemStats,
    getDashboardStats,
    generateMonthlyReportController,
    generateWeeklyReportController,
    exportReportToExcel,
    getReportTemplates,
    getReportHistory
} from '../controllers/reportController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Generate reports (admin only)
router.get('/attendance', requireRole(['admin']), generateAttendanceReportController);
router.get('/teacher', requireRole(['admin']), generateTeacherReportController);
router.get('/student', requireRole(['admin']), generateStudentReportController);

// System statistics (admin only)
router.get('/system-stats', requireRole(['admin']), getSystemStats);
router.get('/dashboard-stats', requireRole(['admin']), getDashboardStats);

// Period reports (admin only)
router.get('/monthly/:year/:month', requireRole(['admin']), generateMonthlyReportController);
router.get('/weekly', requireRole(['admin']), generateWeeklyReportController);

// Export reports (admin only)
router.post('/export/:reportType', requireRole(['admin']), exportReportToExcel);

// Report templates and history (admin only)
router.get('/templates', requireRole(['admin']), getReportTemplates);
router.get('/history', requireRole(['admin']), getReportHistory);

export default router;
