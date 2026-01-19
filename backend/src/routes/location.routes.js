import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getBlocks,
  createBlock,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getDepartments,
  createDepartment
} from '../controllers/location.controller.js';

const router = express.Router();

router.use(authenticate);

// Blocks
router.get('/blocks', getBlocks);
router.post('/blocks', authorize('ADMIN'), createBlock);

// Locations
router.get('/', getLocations);
router.post('/', authorize('ADMIN'), createLocation);
router.put('/:id', authorize('ADMIN'), updateLocation);
router.delete('/:id', authorize('ADMIN'), deleteLocation);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', authorize('ADMIN'), createDepartment);

export default router;

