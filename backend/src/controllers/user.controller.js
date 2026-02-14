import bcrypt from 'bcryptjs';
import { queryRows, queryRow, execute } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

export const getUsers = async (req, res, next) => {
  try {
    const { search, role, isActive } = req.query;

    let sql = `
      SELECT id, email, "firstName", "lastName", "phoneNumber", role, department, 
             "locationId", "isActive", "createdAt", "updatedAt"
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (isActive !== undefined) {
      sql += ' AND "isActive" = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      sql += ' AND ("firstName" LIKE ? OR "lastName" LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Optimized: Use JOIN instead of N+1 queries
    let optimizedSql = `
      SELECT 
        u.id, u.email, u."firstName", u."lastName", u."phoneNumber", u.role, u.department,
        u."locationId", u."isActive", u."createdAt", u."updatedAt",
        l.id as "location_id", l.name as "location_name", l.floor as "location_floor",
        l."areaType" as "location_areaType", b.name as "block_name"
      FROM users u
      LEFT JOIN locations l ON u."locationId" = l.id
      LEFT JOIN blocks b ON l."blockId" = b.id
      WHERE 1=1
    `;
    const optimizedParams = [];

    if (isActive !== undefined) {
      optimizedSql += ' AND u."isActive" = ?';
      optimizedParams.push(isActive === 'true' ? 1 : 0);
    }

    if (role) {
      optimizedSql += ' AND u.role = ?';
      optimizedParams.push(role);
    }

    if (search) {
      optimizedSql += ' AND (u."firstName" LIKE ? OR u."lastName" LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      optimizedParams.push(searchPattern, searchPattern, searchPattern);
    }

    optimizedSql += ' ORDER BY CASE WHEN u.department IS NULL THEN 1 ELSE 0 END, u.department ASC, u."firstName" ASC, u."lastName" ASC';

    const usersRaw = await queryRows(optimizedSql, optimizedParams);

    // Transform results
    const usersWithLocations = usersRaw.map((user) => {
      let location = null;
      if (user.location_id) {
        location = {
          id: user.location_id,
          name: user.location_name,
          floor: user.location_floor,
          areaType: user.location_areaType,
          blockName: user.block_name
        };
      }
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        department: user.department,
        locationId: user.locationId,
        location: location,
        isActive: user.isActive === 1 || user.isActive === true || user.isActive === null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });

    const users = usersWithLocations;

    // Group users by department
    const usersByDepartment = {};
    const usersWithoutDepartment = [];

    users.forEach(user => {
      if (user.department) {
        if (!usersByDepartment[user.department]) {
          usersByDepartment[user.department] = [];
        }
        usersByDepartment[user.department].push(user);
      } else {
        usersWithoutDepartment.push(user);
      }
    });

    // Format response with departments
    const departments = Object.keys(usersByDepartment)
      .sort()
      .map(deptName => ({
        name: deptName,
        users: usersByDepartment[deptName]
      }));

    // Add users without department at the end if any
    if (usersWithoutDepartment.length > 0) {
      departments.push({
        name: null,
        users: usersWithoutDepartment
      });
    }

    res.json({ 
      users,
      usersByDepartment: departments,
      total: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    next(new AppError('Failed to get users', 500));
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role, department, locationId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Missing required fields: email, password, firstName, and lastName are required', 400);
    }

    // Validate role if provided
    const validRoles = ['ADMIN', 'STAFF', 'HOD'];
    const userRole = role || 'STAFF';
    if (!validRoles.includes(userRole)) {
      throw new AppError('Invalid role. Must be ADMIN, STAFF, or HOD', 400);
    }

    // Check if user exists
    const existingUser = await queryRow(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO users (
        id, email, password, "firstName", "lastName", "phoneNumber", role, department, "locationId", "isActive", "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email.trim().toLowerCase(),
        hashedPassword,
        firstName.trim(),
        lastName.trim(),
        phoneNumber?.trim() || null,
        userRole,
        department?.trim() || null,
        locationId || null,
        1, // isActive
        now,
        now
      ]
    );

    // Fetch created user
    const userRaw = await queryRow(
      'SELECT id, email, "firstName", "lastName", "phoneNumber", role, department, "locationId", "isActive", "createdAt", "updatedAt" FROM users WHERE id = ?',
      [id]
    );

    const user = {
      id: userRaw.id,
      email: userRaw.email,
      firstName: userRaw.firstName,
      lastName: userRaw.lastName,
      phoneNumber: userRaw.phoneNumber,
      role: userRaw.role,
      department: userRaw.department,
      isActive: userRaw.isActive === 1 || userRaw.isActive === true,
      createdAt: userRaw.createdAt,
      updatedAt: userRaw.updatedAt
    };

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Create user error:', error);
      next(new AppError('Failed to create user', 500));
    }
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, phoneNumber, role, department, locationId, isActive } = req.body;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // Check if user exists
    const existingUser = await queryRow(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Check permissions: Users can only update their own isActive status
    // ADMIN and HOD can update any field for any user
    const isUpdatingOwnAccount = currentUserId === id;
    const isAdminOrHOD = currentUserRole === 'ADMIN' || currentUserRole === 'HOD';
    
    // If user is updating their own account and only changing isActive, allow it
    if (isUpdatingOwnAccount && !isAdminOrHOD) {
      // Check if only isActive is being updated
      const hasOtherFields = email !== undefined || password !== undefined || 
                            firstName !== undefined || lastName !== undefined || 
                            phoneNumber !== undefined || role !== undefined || 
                            department !== undefined;
      
      if (hasOtherFields) {
        throw new AppError('You can only update your own availability status. Contact an administrator to change other details.', 403);
      }
    } else if (!isAdminOrHOD) {
      throw new AppError('Only administrators and managers can update user details', 403);
    }

    // Validate role if provided (only ADMIN/HOD can change roles)
    if (role && !isAdminOrHOD) {
      throw new AppError('Only administrators can change user roles', 403);
    }
    
    if (role) {
      const validRoles = ['ADMIN', 'STAFF', 'HOD'];
      if (!validRoles.includes(role)) {
        throw new AppError('Invalid role. Must be ADMIN, STAFF, or HOD', 400);
      }
    }

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser.email) {
      const emailUser = await queryRow(
        'SELECT * FROM users WHERE email = ?',
        [email.trim().toLowerCase()]
      );
      if (emailUser) {
        throw new AppError('User with this email already exists', 400);
      }
    }

    const now = new Date().toISOString();
    const updateFields = [];
    const params = [];

    if (email !== undefined) {
      updateFields.push('email = ?');
      params.push(email.trim().toLowerCase());
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      params.push(hashedPassword);
    }
    if (firstName !== undefined) {
      updateFields.push('"firstName" = ?');
      params.push(firstName.trim());
    }
    if (lastName !== undefined) {
      updateFields.push('"lastName" = ?');
      params.push(lastName.trim());
    }
    if (phoneNumber !== undefined) {
      updateFields.push('"phoneNumber" = ?');
      params.push(phoneNumber?.trim() || null);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (department !== undefined) {
      updateFields.push('department = ?');
      params.push(department?.trim() || null);
    }
    if (locationId !== undefined) {
      updateFields.push('"locationId" = ?');
      params.push(locationId || null);
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
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated user
    const userRaw = await queryRow(
      'SELECT id, email, "firstName", "lastName", "phoneNumber", role, department, "locationId", "isActive", "createdAt", "updatedAt" FROM users WHERE id = ?',
      [id]
    );

    // Fetch location if exists
    let location = null;
    if (userRaw.locationId) {
      try {
        const locationRow = await queryRow(
          `SELECT l.id, l.name, l.floor, l."areaType", b.name as "blockName"
           FROM locations l
           LEFT JOIN blocks b ON l."blockId" = b.id
           WHERE l.id = ?`,
          [userRaw.locationId]
        );
        if (locationRow) {
          location = {
            id: locationRow.id,
            name: locationRow.name,
            floor: locationRow.floor,
            areaType: locationRow.areaType,
            blockName: locationRow.blockName
          };
        }
      } catch (err) {
        console.error('Error fetching location:', err);
      }
    }

    const user = {
      id: userRaw.id,
      email: userRaw.email,
      firstName: userRaw.firstName,
      lastName: userRaw.lastName,
      phoneNumber: userRaw.phoneNumber,
      role: userRaw.role,
      department: userRaw.department,
      locationId: userRaw.locationId,
      location: location,
      isActive: userRaw.isActive === 1 || userRaw.isActive === true,
      createdAt: userRaw.createdAt,
      updatedAt: userRaw.updatedAt
    };

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Update user error:', error);
      next(new AppError('Failed to update user', 500));
    }
  }
};

