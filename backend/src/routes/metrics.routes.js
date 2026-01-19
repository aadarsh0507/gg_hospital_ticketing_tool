import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getRequestMetrics } from '../controllers/metrics.controller.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getRequestMetrics);

export default router;

