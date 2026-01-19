import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  getMyRequests
} from '../controllers/request.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// My requests (for all authenticated users - requesters see their own, admins see their own too)
router.get('/my-requests', getMyRequests);

// Create request (all authenticated users can create requests)
router.post('/', createRequest);

// All requests (ADMIN only - can see all requests)
router.get('/', authorize('ADMIN'), getRequests);

// Get single request (all authenticated users can view individual requests)
router.get('/:id', getRequestById);

// Update request (all authenticated users can update)
router.put('/:id', updateRequest);

// Delete request (ADMIN only)
router.delete('/:id', authorize('ADMIN'), deleteRequest);

export default router;

