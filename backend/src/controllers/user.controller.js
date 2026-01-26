import bcrypt from 'bcryptjs';
import { queryRows, queryRow, execute } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

export const getUsers = async (req, res, next) => {
  try {
    const { search, role, isActive } = req.query;

    let sql = `
      SELECT id, email, "firstName", "lastName", "phoneNumber", role, department, 
             "isActive", "createdAt", "updatedAt"
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

    sql += ' ORDER BY CASE WHEN department IS NULL THEN 1 ELSE 0 END, department ASC, "firstName" ASC, "lastName" ASC';

    const usersRaw = await queryRows(sql, params);

    const users = usersRaw.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      department: user.department,
      isActive: user.isActive === 1 || user.isActive === true || user.isActive === null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

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
    const { email, password, firstName, lastName, phoneNumber, role, department } = req.body;

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
        id, email, password, "firstName", "lastName", "phoneNumber", role, department, "isActive", "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email.trim().toLowerCase(),
        hashedPassword,
        firstName.trim(),
        lastName.trim(),
        phoneNumber?.trim() || null,
        userRole,
        department?.trim() || null,
        1, // isActive
        now,
        now
      ]
    );

    // Fetch created user
    const userRaw = await queryRow(
      'SELECT id, email, "firstName", "lastName", "phoneNumber", role, department, "isActive", "createdAt", "updatedAt" FROM users WHERE id = ?',
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
    const { email, password, firstName, lastName, phoneNumber, role, department, isActive } = req.body;

    // Check if user exists
    const existingUser = await queryRow(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Validate role if provided
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
      'SELECT id, email, "firstName", "lastName", "phoneNumber", role, department, "isActive", "createdAt", "updatedAt" FROM users WHERE id = ?',
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

