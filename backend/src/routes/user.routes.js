import express from 'express';
import { getUsers, createUser, updateUser } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (grouped by department) - Admin and HOD
router.get('/', authenticate, getUsers);

// Create user - Admin and HOD
router.post('/', authenticate, authorize('ADMIN', 'HOD'), createUser);

// Update user - Admin and HOD
router.put('/:id', authenticate, authorize('ADMIN', 'HOD'), updateUser);

export default router;

