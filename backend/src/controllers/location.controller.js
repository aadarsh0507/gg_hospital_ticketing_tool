import { queryRows, queryRow, execute } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

export const getBlocks = async (req, res, next) => {
  try {
    const blocks = await queryRows('SELECT * FROM blocks ORDER BY name ASC');
    
    const formattedBlocks = await Promise.all(blocks.map(async (block) => {
      // Try to get locations with isActive filter, fallback to all if column doesn't exist
      let locations;
      let locationCount;
      
      try {
        locations = await queryRows(
          'SELECT l.*, d.name as "departmentName", d.description as "departmentDescription" FROM locations l LEFT JOIN departments d ON l."departmentId" = d.id WHERE l."blockId" = ? AND (l."isActive" = 1 OR l."isActive" IS NULL)',
          [block.id]
        );
        
        locationCount = await queryRow(
          'SELECT COUNT(*) as count FROM locations WHERE "blockId" = ? AND ("isActive" = 1 OR "isActive" IS NULL)',
          [block.id]
        );
      } catch (err) {
        // If isActive column doesn't exist, query without it
        if (err.message && err.message.includes('no such column')) {
          locations = await queryRows(
            'SELECT l.*, d.name as "departmentName", d.description as "departmentDescription" FROM locations l LEFT JOIN departments d ON l."departmentId" = d.id WHERE l."blockId" = ?',
            [block.id]
          );
          
          locationCount = await queryRow(
            'SELECT COUNT(*) as count FROM locations WHERE "blockId" = ?',
            [block.id]
          );
        } else {
          throw err;
        }
      }

      return {
        id: block.id,
        name: block.name,
        description: block.description,
        floors: Math.max(...locations.map(loc => loc.floor || 0), 0) || 0,
        areas: Number(locationCount?.count) || 0,
        locations: locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          floor: loc.floor,
          areaType: loc.areaType,
          department: loc.departmentName ? {
            name: loc.departmentName,
            description: loc.departmentDescription
          } : null
        }))
      };
    }));

    res.json({ blocks: formattedBlocks });
  } catch (error) {
    console.error('Get blocks error:', error);
    res.json({ blocks: [] });
  }
};

export const createBlock = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('Block name is required', 400);
    }

    // Check if block exists
    const existingBlock = await queryRow(
      'SELECT * FROM blocks WHERE name = ?',
      [name]
    );

    if (existingBlock) {
      throw new AppError('Block already exists', 400);
    }

    // Create block
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO blocks (id, name, description, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)',
      [id, name, description || null, now, now]
    );

    const block = await queryRow('SELECT * FROM blocks WHERE id = ?', [id]);

    res.status(201).json({ message: 'Block created successfully', block });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Create block error:', error);
      next(new AppError('Failed to create block', 500));
    }
  }
};

export const getLocations = async (req, res, next) => {
  try {
    const { blockId, departmentId, search } = req.query;

    // Check if isActive column exists by trying a simple query
    let hasIsActiveColumn = true;
    try {
      await queryRow('SELECT "isActive" FROM locations LIMIT 1');
    } catch (err) {
      if (err.message && err.message.includes('no such column')) {
        hasIsActiveColumn = false;
      }
    }

    let sql = `
      SELECT l.*, b.name as "blockName", b.description as "blockDescription",
             d.name as "departmentName", d.description as "departmentDescription"
      FROM locations l
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON l."departmentId" = d.id
      WHERE 1=1
    `;
    const params = [];

    if (hasIsActiveColumn) {
      sql += ' AND (l."isActive" = 1 OR l."isActive" IS NULL)';
    }

    if (blockId) {
      sql += ' AND l."blockId" = ?';
      params.push(blockId);
    }
    if (departmentId) {
      sql += ' AND l."departmentId" = ?';
      params.push(departmentId);
    }
    if (search) {
      sql += ' AND (l.name LIKE ? OR l."areaType" LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    sql += ' ORDER BY b.name ASC, l.floor ASC, l.name ASC';

    console.log('Fetching locations with SQL:', sql);
    console.log('Params:', params);
    
    const locationsRaw = await queryRows(sql, params);
    console.log('Raw locations from DB:', locationsRaw);

    const locations = locationsRaw.map(loc => ({
      id: loc.id,
      name: loc.name,
      floor: loc.floor,
      areaType: loc.areaType,
      blockId: loc.blockId,
      departmentId: loc.departmentId,
      isActive: loc.isActive,
      block: loc.blockName ? {
        id: loc.blockId,
        name: loc.blockName,
        description: loc.blockDescription
      } : null,
      department: loc.departmentName ? {
        id: loc.departmentId,
        name: loc.departmentName,
        description: loc.departmentDescription
      } : null
    }));

    console.log('Formatted locations:', locations);
    res.json({ locations });
  } catch (error) {
    console.error('Get locations error:', error);
    console.error('Error stack:', error.stack);
    res.json({ locations: [] });
  }
};

export const createLocation = async (req, res, next) => {
  try {
    const { blockId, name, floor, areaType, departmentId } = req.body;

    if (!blockId || !name) {
      throw new AppError('Block ID and location name are required', 400);
    }

    // Check if location exists in this block
    const existingLocation = await queryRow(
      'SELECT * FROM locations WHERE "blockId" = ? AND name = ?',
      [blockId, name]
    );

    if (existingLocation) {
      throw new AppError('Location already exists in this block', 400);
    }

    // Create location
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO locations (id, "blockId", name, floor, "areaType", "departmentId", "isActive", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, blockId, name, floor ? parseInt(floor) : null, areaType || null, departmentId || null, 1, now, now]
    );

    // Fetch created location with related data
    const locationRaw = await queryRow(`
      SELECT l.*, b.name as "blockName", b.description as "blockDescription",
             d.name as "departmentName", d.description as "departmentDescription"
      FROM locations l
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON l."departmentId" = d.id
      WHERE l.id = ?
    `, [id]);

    const location = {
      ...locationRaw,
      block: locationRaw.blockName ? {
        id: locationRaw.blockId,
        name: locationRaw.blockName,
        description: locationRaw.blockDescription
      } : null,
      department: locationRaw.departmentName ? {
        id: locationRaw.departmentId,
        name: locationRaw.departmentName,
        description: locationRaw.departmentDescription
      } : null
    };

    res.status(201).json({ message: 'Location created successfully', location });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Create location error:', error);
      next(new AppError('Failed to create location', 500));
    }
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, floor, areaType, departmentId, isActive } = req.body;

    const now = new Date().toISOString();
    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (floor !== undefined) {
      updateFields.push('floor = ?');
      params.push(floor ? parseInt(floor) : null);
    }
    if (areaType !== undefined) {
      updateFields.push('"areaType" = ?');
      params.push(areaType);
    }
    if (departmentId !== undefined) {
      updateFields.push('"departmentId" = ?');
      params.push(departmentId);
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
      `UPDATE locations SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated location with related data
    const locationRaw = await queryRow(`
      SELECT l.*, b.name as "blockName", b.description as "blockDescription",
             d.name as "departmentName", d.description as "departmentDescription"
      FROM locations l
      LEFT JOIN blocks b ON l."blockId" = b.id
      LEFT JOIN departments d ON l."departmentId" = d.id
      WHERE l.id = ?
    `, [id]);

    const location = {
      ...locationRaw,
      block: locationRaw.blockName ? {
        id: locationRaw.blockId,
        name: locationRaw.blockName,
        description: locationRaw.blockDescription
      } : null,
      department: locationRaw.departmentName ? {
        id: locationRaw.departmentId,
        name: locationRaw.departmentName,
        description: locationRaw.departmentDescription
      } : null
    };

    res.json({ message: 'Location updated successfully', location });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Update location error:', error);
      next(new AppError('Failed to update location', 500));
    }
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    await execute(
      'UPDATE locations SET "isActive" = 0, "updatedAt" = ? WHERE id = ?',
      [now, id]
    );

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    next(new AppError('Failed to delete location', 500));
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departmentsRaw = await queryRows('SELECT * FROM departments ORDER BY name ASC');
    
    const departments = await Promise.all(departmentsRaw.map(async (dept) => {
      const requestCount = await queryRow(
        'SELECT COUNT(*) as count FROM requests WHERE "departmentId" = ?',
        [dept.id]
      );
      const locationCount = await queryRow(
        'SELECT COUNT(*) as count FROM locations WHERE "departmentId" = ?',
        [dept.id]
      );

      return {
        ...dept,
        _count: {
          requests: Number(requestCount?.count) || 0,
          locations: Number(locationCount?.count) || 0
        }
      };
    }));

    res.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.json({ departments: [] });
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('Department name is required', 400);
    }

    // Check if department exists
    const existingDepartment = await queryRow(
      'SELECT * FROM departments WHERE name = ?',
      [name]
    );

    if (existingDepartment) {
      throw new AppError('Department already exists', 400);
    }

    // Create department
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO departments (id, name, description, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)',
      [id, name, description || null, now, now]
    );

    const department = await queryRow('SELECT * FROM departments WHERE id = ?', [id]);

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Create department error:', error);
      next(new AppError('Failed to create department', 500));
    }
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if department exists
    const existingDepartment = await queryRow(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (!existingDepartment) {
      throw new AppError('Department not found', 404);
    }

    const now = new Date().toISOString();
    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      // Check if another department with the same name exists
      const duplicateCheck = await queryRow(
        'SELECT * FROM departments WHERE name = ? AND id != ?',
        [name, id]
      );

      if (duplicateCheck) {
        throw new AppError('Department name already exists', 400);
      }

      updateFields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description || null);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push('"updatedAt" = ?');
    params.push(now);
    params.push(id);

    await execute(
      `UPDATE departments SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const department = await queryRow('SELECT * FROM departments WHERE id = ?', [id]);

    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Update department error:', error);
      next(new AppError('Failed to update department', 500));
    }
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const existingDepartment = await queryRow(
      'SELECT * FROM departments WHERE id = ?',
      [id]
    );

    if (!existingDepartment) {
      throw new AppError('Department not found', 404);
    }

    // Soft delete or check for dependencies before hard delete
    // For now, we'll do a hard delete
    await execute('DELETE FROM departments WHERE id = ?', [id]);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Delete department error:', error);
      next(new AppError('Failed to delete department', 500));
    }
  }
};

export const updateBlock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if block exists
    const existingBlock = await queryRow(
      'SELECT * FROM blocks WHERE id = ?',
      [id]
    );

    if (!existingBlock) {
      throw new AppError('Block not found', 404);
    }

    const now = new Date().toISOString();
    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      // Check if another block with the same name exists
      const duplicateCheck = await queryRow(
        'SELECT * FROM blocks WHERE name = ? AND id != ?',
        [name, id]
      );

      if (duplicateCheck) {
        throw new AppError('Block name already exists', 400);
      }

      updateFields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description || null);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push('"updatedAt" = ?');
    params.push(now);
    params.push(id);

    await execute(
      `UPDATE blocks SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const block = await queryRow('SELECT * FROM blocks WHERE id = ?', [id]);

    res.json({ message: 'Block updated successfully', block });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Update block error:', error);
      next(new AppError('Failed to update block', 500));
    }
  }
};

export const deleteBlock = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if block exists
    const existingBlock = await queryRow(
      'SELECT * FROM blocks WHERE id = ?',
      [id]
    );

    if (!existingBlock) {
      throw new AppError('Block not found', 404);
    }

    // Check if block has locations
    const locationCount = await queryRow(
      'SELECT COUNT(*) as count FROM locations WHERE "blockId" = ?',
      [id]
    );

    if (Number(locationCount?.count) > 0) {
      throw new AppError('Cannot delete block with existing locations', 400);
    }

    await execute('DELETE FROM blocks WHERE id = ?', [id]);

    res.json({ message: 'Block deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Delete block error:', error);
      next(new AppError('Failed to delete block', 500));
    }
  }
};

