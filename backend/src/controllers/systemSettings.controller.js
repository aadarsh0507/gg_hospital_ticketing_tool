import { queryRow, execute } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_STATUS_KEY = 'system_active_status';

/**
 * Get system status (visible to all authenticated users)
 */
export const getSystemStatus = async (req, res, next) => {
  try {
    // Try to get the system status setting
    let setting = await queryRow(
      'SELECT * FROM system_settings WHERE key = ?',
      [SYSTEM_STATUS_KEY]
    );

    // If setting doesn't exist, create it with default value (active = true)
    if (!setting) {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      await execute(
        `INSERT INTO system_settings (id, key, value, "updatedAt") VALUES (?, ?, ?, ?)`,
        [id, SYSTEM_STATUS_KEY, 'true', now]
      );
      
      setting = await queryRow(
        'SELECT * FROM system_settings WHERE key = ?',
        [SYSTEM_STATUS_KEY]
      );
    }

    const isActive = setting.value === 'true' || setting.value === '1';

    res.json({
      isActive,
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy || null
    });
  } catch (error) {
    console.error('Get system status error:', error);
    next(new AppError('Failed to get system status', 500));
  }
};

/**
 * Update system status (only admin and HOD can update)
 */
export const updateSystemStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean value', 400);
    }

    // Check if setting exists
    let setting = await queryRow(
      'SELECT * FROM system_settings WHERE key = ?',
      [SYSTEM_STATUS_KEY]
    );

    const now = new Date().toISOString();
    const value = isActive ? 'true' : 'false';

    if (setting) {
      // Update existing setting
      await execute(
        `UPDATE system_settings SET value = ?, "updatedAt" = ?, "updatedBy" = ? WHERE key = ?`,
        [value, now, userId || null, SYSTEM_STATUS_KEY]
      );
    } else {
      // Create new setting
      const id = uuidv4();
      await execute(
        `INSERT INTO system_settings (id, key, value, "updatedAt", "updatedBy") VALUES (?, ?, ?, ?, ?)`,
        [id, SYSTEM_STATUS_KEY, value, now, userId || null]
      );
    }

    // Fetch updated setting
    setting = await queryRow(
      'SELECT * FROM system_settings WHERE key = ?',
      [SYSTEM_STATUS_KEY]
    );

    res.json({
      message: `System ${isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: setting.value === 'true' || setting.value === '1',
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy || null
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Update system status error:', error);
      next(new AppError('Failed to update system status', 500));
    }
  }
};

