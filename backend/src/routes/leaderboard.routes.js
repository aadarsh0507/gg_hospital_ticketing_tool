import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getLeaderboard, downloadLeaderboard } from '../controllers/leaderboard.controller.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getLeaderboard);
router.get('/download', downloadLeaderboard);

export default router;

