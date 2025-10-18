// Swagger UI setup (temporarily disabled - yamljs package needed)
import express from 'express';

const router = express.Router();

// Swagger is temporarily disabled due to missing yamljs package
// To enable: npm install yamljs
router.get('/', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'API documentation temporarily unavailable',
    note: 'Install yamljs package to enable Swagger UI: npm install yamljs'
  });
});

export default router;
