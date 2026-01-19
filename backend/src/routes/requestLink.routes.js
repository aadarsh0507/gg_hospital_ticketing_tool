import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createRequestLink,
  getRequestLinkByToken,
  submitRequestViaLink
} from '../controllers/requestLink.controller.js';

const router = express.Router();

// Public route for token access
router.get('/:token', getRequestLinkByToken);
router.post('/:token/submit', submitRequestViaLink);

// Protected routes
router.post('/', authenticate, createRequestLink);

export default router;

