import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from '../controllers/service.controller.js';

const router = express.Router();

router.use(authenticate);

// Get all services
router.get('/', getServices);

// Get service by ID
router.get('/:id', getServiceById);

// Create service (allow all authenticated users)
router.post('/', createService);

// Update service (admin only)
router.put('/:id', authorize('ADMIN'), updateService);

// Delete service (admin only)
router.delete('/:id', authorize('ADMIN'), deleteService);

export default router;

