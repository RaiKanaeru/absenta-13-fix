// Input validation middleware
import { body, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
export const validateLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

export const validateTeacher = [
  body('nama').notEmpty().withMessage('Nama is required'),
  body('nip').notEmpty().withMessage('NIP is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mapel_id').isInt().withMessage('Mapel ID must be a number'),
  handleValidationErrors
];

export const validateStudent = [
  body('nama').notEmpty().withMessage('Nama is required'),
  body('nis').notEmpty().withMessage('NIS is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('kelas_id').isInt().withMessage('Kelas ID must be a number'),
  handleValidationErrors
];

export const validateSubject = [
  body('kode_mapel').notEmpty().withMessage('Kode mapel is required'),
  body('nama_mapel').notEmpty().withMessage('Nama mapel is required'),
  handleValidationErrors
];

export const validateClass = [
  body('nama_kelas').notEmpty().withMessage('Nama kelas is required'),
  body('tingkat').isIn(['X', 'XI', 'XII']).withMessage('Tingkat must be X, XI, or XII'),
  body('kapasitas').isInt({ min: 1 }).withMessage('Kapasitas must be a positive number'),
  handleValidationErrors
];

export const validateRoom = [
  body('nama_ruang').notEmpty().withMessage('Nama ruang is required'),
  body('kode_ruang').notEmpty().withMessage('Kode ruang is required'),
  body('kapasitas').isInt({ min: 1 }).withMessage('Kapasitas must be a positive number'),
  body('lokasi').notEmpty().withMessage('Lokasi is required'),
  handleValidationErrors
];

export const validateSchedule = [
  body('kelas_id').isInt().withMessage('Kelas ID must be a number'),
  body('mapel_id').isInt().withMessage('Mapel ID must be a number'),
  body('guru_id').isInt().withMessage('Guru ID must be a number'),
  body('hari').isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']).withMessage('Invalid hari'),
  body('jam_ke').isInt({ min: 1, max: 8 }).withMessage('Jam ke must be between 1 and 8'),
  handleValidationErrors
];
