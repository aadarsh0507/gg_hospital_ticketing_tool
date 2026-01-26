import { queryRows, queryRow, execute } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

export const getServices = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;

    let sql = `
      SELECT s.*, 
             d.name as "departmentName", d.description as "departmentDescription",
             l.name as "locationName", l.floor as "locationFloor",
             b.name as "blockName"
      FROM services s
      LEFT JOIN departments d ON s."departmentId" = d.id
      LEFT JOIN locations l ON s."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      WHERE 1=1
    `;
    const params = [];

    if (isActive !== undefined) {
      sql += ' AND s."isActive" = ?';
      params.push(isActive === 'true' ? 1 : 0);
    } else {
      // By default, show active services
      sql += ' AND (s."isActive" = 1 OR s."isActive" IS NULL)';
    }

    if (search) {
      sql += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    sql += ' ORDER BY s.name ASC';

    const servicesRaw = await queryRows(sql, params);

    const services = servicesRaw.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      areaType: service.areaType,
      departmentId: service.departmentId,
      locationId: service.locationId,
      slaEnabled: service.slaEnabled === 1 || service.slaEnabled === true,
      slaHours: service.slaHours || 0,
      slaMinutes: service.slaMinutes || 0,
      otpVerificationRequired: service.otpVerificationRequired === 1 || service.otpVerificationRequired === true,
      displayToCustomer: service.displayToCustomer !== 0 && service.displayToCustomer !== false,
      iconUrl: service.iconUrl,
      isActive: service.isActive === 1 || service.isActive === true || service.isActive === null,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      department: service.departmentName ? {
        id: service.departmentId,
        name: service.departmentName,
        description: service.departmentDescription
      } : null,
      location: service.locationName ? {
        id: service.locationId,
        name: service.locationName,
        floor: service.locationFloor,
        block: service.blockName ? {
          name: service.blockName
        } : null
      } : null
    }));

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.json({ services: [] });
  }
};

export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const serviceRaw = await queryRow(`
      SELECT s.*, 
             d.name as "departmentName", d.description as "departmentDescription",
             l.name as "locationName", l.floor as "locationFloor",
             b.name as "blockName"
      FROM services s
      LEFT JOIN departments d ON s."departmentId" = d.id
      LEFT JOIN locations l ON s."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      WHERE s.id = ?
    `, [id]);

    if (!serviceRaw) {
      throw new AppError('Service not found', 404);
    }

    const service = {
      id: serviceRaw.id,
      name: serviceRaw.name,
      description: serviceRaw.description,
      areaType: serviceRaw.areaType,
      departmentId: serviceRaw.departmentId,
      locationId: serviceRaw.locationId,
      slaEnabled: serviceRaw.slaEnabled === 1 || serviceRaw.slaEnabled === true,
      slaHours: serviceRaw.slaHours || 0,
      slaMinutes: serviceRaw.slaMinutes || 0,
      otpVerificationRequired: serviceRaw.otpVerificationRequired === 1 || serviceRaw.otpVerificationRequired === true,
      displayToCustomer: serviceRaw.displayToCustomer !== 0 && serviceRaw.displayToCustomer !== false,
      iconUrl: serviceRaw.iconUrl,
      isActive: serviceRaw.isActive === 1 || serviceRaw.isActive === true || serviceRaw.isActive === null,
      createdAt: serviceRaw.createdAt,
      updatedAt: serviceRaw.updatedAt,
      department: serviceRaw.departmentName ? {
        id: serviceRaw.departmentId,
        name: serviceRaw.departmentName,
        description: serviceRaw.departmentDescription
      } : null,
      location: serviceRaw.locationName ? {
        id: serviceRaw.locationId,
        name: serviceRaw.locationName,
        floor: serviceRaw.locationFloor,
        block: serviceRaw.blockName ? {
          name: serviceRaw.blockName
        } : null
      } : null
    };

    res.json({ service });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Get service by ID error:', error);
      next(new AppError('Failed to get service', 500));
    }
  }
};

export const createService = async (req, res, next) => {
  try {
    const {
      name,
      description,
      areaType,
      departmentId,
      locationId,
      slaEnabled,
      slaHours,
      slaMinutes,
      otpVerificationRequired,
      displayToCustomer,
      iconUrl
    } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('Service name is required', 400);
    }

    // Check if service with same name exists
    const existingService = await queryRow(
      'SELECT * FROM services WHERE name = ?',
      [name.trim()]
    );

    if (existingService) {
      throw new AppError('Service with this name already exists', 400);
    }

    // Validate department if provided
    if (departmentId) {
      const department = await queryRow(
        'SELECT * FROM departments WHERE id = ?',
        [departmentId]
      );
      if (!department) {
        throw new AppError('Department not found', 400);
      }
    }

    // Validate location if provided
    if (locationId) {
      const location = await queryRow(
        'SELECT * FROM locations WHERE id = ?',
        [locationId]
      );
      if (!location) {
        throw new AppError('Location not found', 400);
      }
    }

    // Create service
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO services (
        id, name, description, "areaType", "departmentId", "locationId",
        "slaEnabled", "slaHours", "slaMinutes", "otpVerificationRequired",
        "displayToCustomer", "iconUrl", "isActive", "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        description?.trim() || null,
        areaType || null,
        departmentId || null,
        locationId || null,
        slaEnabled ? 1 : 0,
        slaHours || 0,
        slaMinutes || 0,
        otpVerificationRequired ? 1 : 0,
        displayToCustomer !== false ? 1 : 0,
        iconUrl || null,
        1, // isActive
        now,
        now
      ]
    );

    // Fetch created service with related data
    const serviceRaw = await queryRow(`
      SELECT s.*, 
             d.name as "departmentName", d.description as "departmentDescription",
             l.name as "locationName", l.floor as "locationFloor",
             b.name as "blockName"
      FROM services s
      LEFT JOIN departments d ON s."departmentId" = d.id
      LEFT JOIN locations l ON s."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      WHERE s.id = ?
    `, [id]);

    const service = {
      id: serviceRaw.id,
      name: serviceRaw.name,
      description: serviceRaw.description,
      areaType: serviceRaw.areaType,
      departmentId: serviceRaw.departmentId,
      locationId: serviceRaw.locationId,
      slaEnabled: serviceRaw.slaEnabled === 1 || serviceRaw.slaEnabled === true,
      slaHours: serviceRaw.slaHours || 0,
      slaMinutes: serviceRaw.slaMinutes || 0,
      otpVerificationRequired: serviceRaw.otpVerificationRequired === 1 || serviceRaw.otpVerificationRequired === true,
      displayToCustomer: serviceRaw.displayToCustomer !== 0 && serviceRaw.displayToCustomer !== false,
      iconUrl: serviceRaw.iconUrl,
      isActive: serviceRaw.isActive === 1 || serviceRaw.isActive === true,
      createdAt: serviceRaw.createdAt,
      updatedAt: serviceRaw.updatedAt,
      department: serviceRaw.departmentName ? {
        id: serviceRaw.departmentId,
        name: serviceRaw.departmentName,
        description: serviceRaw.departmentDescription
      } : null,
      location: serviceRaw.locationName ? {
        id: serviceRaw.locationId,
        name: serviceRaw.locationName,
        floor: serviceRaw.locationFloor,
        block: serviceRaw.blockName ? {
          name: serviceRaw.blockName
        } : null
      } : null
    };

    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Create service error:', error);
      next(new AppError('Failed to create service', 500));
    }
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      areaType,
      departmentId,
      locationId,
      slaEnabled,
      slaHours,
      slaMinutes,
      otpVerificationRequired,
      displayToCustomer,
      iconUrl,
      isActive
    } = req.body;

    // Check if service exists
    const existingService = await queryRow(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (!existingService) {
      throw new AppError('Service not found', 404);
    }

    // If name is being updated, check for duplicates
    if (name !== undefined && name.trim() !== existingService.name) {
      const duplicateService = await queryRow(
        'SELECT * FROM services WHERE name = ? AND id != ?',
        [name.trim(), id]
      );

      if (duplicateService) {
        throw new AppError('Service with this name already exists', 400);
      }
    }

    // Validate department if provided
    if (departmentId !== undefined && departmentId !== null) {
      const department = await queryRow(
        'SELECT * FROM departments WHERE id = ?',
        [departmentId]
      );
      if (!department) {
        throw new AppError('Department not found', 400);
      }
    }

    // Validate location if provided
    if (locationId !== undefined && locationId !== null) {
      const location = await queryRow(
        'SELECT * FROM locations WHERE id = ?',
        [locationId]
      );
      if (!location) {
        throw new AppError('Location not found', 400);
      }
    }

    const now = new Date().toISOString();
    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description?.trim() || null);
    }
    if (areaType !== undefined) {
      updateFields.push('"areaType" = ?');
      params.push(areaType || null);
    }
    if (departmentId !== undefined) {
      updateFields.push('"departmentId" = ?');
      params.push(departmentId || null);
    }
    if (locationId !== undefined) {
      updateFields.push('"locationId" = ?');
      params.push(locationId || null);
    }
    if (slaEnabled !== undefined) {
      updateFields.push('"slaEnabled" = ?');
      params.push(slaEnabled ? 1 : 0);
    }
    if (slaHours !== undefined) {
      updateFields.push('"slaHours" = ?');
      params.push(slaHours || 0);
    }
    if (slaMinutes !== undefined) {
      updateFields.push('"slaMinutes" = ?');
      params.push(slaMinutes || 0);
    }
    if (otpVerificationRequired !== undefined) {
      updateFields.push('"otpVerificationRequired" = ?');
      params.push(otpVerificationRequired ? 1 : 0);
    }
    if (displayToCustomer !== undefined) {
      updateFields.push('"displayToCustomer" = ?');
      params.push(displayToCustomer ? 1 : 0);
    }
    if (iconUrl !== undefined) {
      updateFields.push('"iconUrl" = ?');
      params.push(iconUrl || null);
    }
    if (isActive !== undefined) {
      updateFields.push('"isActive" = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push('"updatedAt" = ?');
    params.push(now);
    params.push(id);

    await execute(
      `UPDATE services SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated service with related data
    const serviceRaw = await queryRow(`
      SELECT s.*, 
             d.name as "departmentName", d.description as "departmentDescription",
             l.name as "locationName", l.floor as "locationFloor",
             b.name as "blockName"
      FROM services s
      LEFT JOIN departments d ON s."departmentId" = d.id
      LEFT JOIN locations l ON s."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      WHERE s.id = ?
    `, [id]);

    const service = {
      id: serviceRaw.id,
      name: serviceRaw.name,
      description: serviceRaw.description,
      areaType: serviceRaw.areaType,
      departmentId: serviceRaw.departmentId,
      locationId: serviceRaw.locationId,
      slaEnabled: serviceRaw.slaEnabled === 1 || serviceRaw.slaEnabled === true,
      slaHours: serviceRaw.slaHours || 0,
      slaMinutes: serviceRaw.slaMinutes || 0,
      otpVerificationRequired: serviceRaw.otpVerificationRequired === 1 || serviceRaw.otpVerificationRequired === true,
      displayToCustomer: serviceRaw.displayToCustomer !== 0 && serviceRaw.displayToCustomer !== false,
      iconUrl: serviceRaw.iconUrl,
      isActive: serviceRaw.isActive === 1 || serviceRaw.isActive === true,
      createdAt: serviceRaw.createdAt,
      updatedAt: serviceRaw.updatedAt,
      department: serviceRaw.departmentName ? {
        id: serviceRaw.departmentId,
        name: serviceRaw.departmentName,
        description: serviceRaw.departmentDescription
      } : null,
      location: serviceRaw.locationName ? {
        id: serviceRaw.locationId,
        name: serviceRaw.locationName,
        floor: serviceRaw.locationFloor,
        block: serviceRaw.blockName ? {
          name: serviceRaw.blockName
        } : null
      } : null
    };

    res.json({ message: 'Service updated successfully', service });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Update service error:', error);
      next(new AppError('Failed to update service', 500));
    }
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const existingService = await queryRow(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (!existingService) {
      throw new AppError('Service not found', 404);
    }

    // Check if service has associated requests
    const requestCount = await queryRow(
      'SELECT COUNT(*) as count FROM requests WHERE "serviceId" = ?',
      [id]
    );

    if (Number(requestCount?.count) > 0) {
      // Soft delete instead of hard delete
      const now = new Date().toISOString();
      await execute(
        'UPDATE services SET "isActive" = 0, "updatedAt" = ? WHERE id = ?',
        [now, id]
      );
      res.json({ message: 'Service deactivated successfully (has associated requests)' });
    } else {
      // Hard delete if no requests
      await execute('DELETE FROM services WHERE id = ?', [id]);
      res.json({ message: 'Service deleted successfully' });
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Delete service error:', error);
      next(new AppError('Failed to delete service', 500));
    }
  }
};

