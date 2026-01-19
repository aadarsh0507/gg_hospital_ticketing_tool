import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty()
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validateRequest,
  login
);

router.get('/profile', authenticate, getProfile);

export default router;

