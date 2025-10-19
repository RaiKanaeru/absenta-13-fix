// Schedule routes
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
    getAllSchedules, 
    getScheduleByIdController, 
    getSchedulesByTeacherController, 
    getSchedulesByClassController, 
    createScheduleController, 
    updateScheduleController, 
    deleteScheduleController, 
    checkScheduleConflicts, 
    importSchedules, 
    exportSchedules, 
    getScheduleStats, 
    getScheduleTemplate 
} from '../controllers/scheduleController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all schedules (all roles)
router.get('/', getAllSchedules);

// Get schedule by ID (all roles)
router.get('/:id', getScheduleByIdController);

// Get schedules by teacher (teachers and admin)
router.get('/teacher/:teacherId', requireRole(['guru', 'admin']), getSchedulesByTeacherController);

// Get schedules by class (all roles)
router.get('/class/:classId', getSchedulesByClassController);

// Create schedule (admin only)
router.post('/', requireRole(['admin']), createScheduleController);

// Update schedule (admin only)
router.put('/:id', requireRole(['admin']), updateScheduleController);

// Delete schedule (admin only)
router.delete('/:id', requireRole(['admin']), deleteScheduleController);

// Check schedule conflicts (admin only)
router.post('/check-conflicts', requireRole(['admin']), checkScheduleConflicts);

// Import schedules (admin only)
router.post('/import', requireRole(['admin']), importSchedules);

// Export schedules (admin only)
router.get('/export', requireRole(['admin']), exportSchedules);

// Get schedule statistics (admin only)
router.get('/stats', requireRole(['admin']), getScheduleStats);

// Get schedule template (admin only)
router.get('/template', requireRole(['admin']), getScheduleTemplate);

export default router;
