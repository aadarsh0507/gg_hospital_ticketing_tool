import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/location.controller.js';

const router = express.Router();

router.use(authenticate);

// Blocks
router.get('/blocks', getBlocks);
router.post('/blocks', createBlock); // Allow all authenticated users
router.put('/blocks/:id', authorize('ADMIN'), updateBlock);
router.delete('/blocks/:id', authorize('ADMIN'), deleteBlock);

// Locations
router.get('/', getLocations);
router.post('/', createLocation); // Allow all authenticated users
router.put('/:id', authorize('ADMIN'), updateLocation);
router.delete('/:id', authorize('ADMIN'), deleteLocation);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', createDepartment); // Allow all authenticated users
router.put('/departments/:id', authorize('ADMIN'), updateDepartment);
router.delete('/departments/:id', authorize('ADMIN'), deleteDepartment);

export default router;

