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

// My requests (for requesters)
router.get('/my-requests', getMyRequests);

// All requests (for staff/admin)
router.get('/', authorize('ADMIN', 'STAFF'), getRequests);
router.get('/:id', getRequestById);
router.post('/', createRequest);
router.put('/:id', updateRequest);
router.delete('/:id', authorize('ADMIN'), deleteRequest);

export default router;

