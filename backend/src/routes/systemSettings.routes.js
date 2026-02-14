import express from 'express';
import { getSystemStatus, updateSystemStatus } from '../controllers/systemSettings.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get system status - visible to all authenticated users
router.get('/status', authenticate, getSystemStatus);

// Update system status - all authenticated users can update
router.put('/status', authenticate, updateSystemStatus);

export default router;

