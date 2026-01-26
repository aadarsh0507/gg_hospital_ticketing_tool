import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../utils/db.js';
import { AppError } from '../middleware/errorHandler.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role, department } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Missing required fields', 400);
    }

    // Validate role if provided
    const validRoles = ['REQUESTER', 'ADMIN', 'STAFF', 'HOD'];
    const userRole = role || 'REQUESTER';
    if (!validRoles.includes(userRole)) {
      throw new AppError('Invalid role. Must be REQUESTER, ADMIN, STAFF, or HOD', 400);
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      email
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber: phoneNumber || null,
      role: userRole,
      department: department || null,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    // If it's already an AppError, pass it through
    if (error instanceof AppError) {
      return next(error);
    }
    // Handle database errors
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return next(new AppError('User with this email already exists', 400));
    }
    if (error.message && error.message.includes('no such table')) {
      return next(new AppError('Database not initialized. Please restart the server.', 500));
    }
    // Generic error
    next(new AppError(error.message || 'Registration failed', 500));
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password (needed for verification)
    const user = await db.user.findUnique({
      email
    }, { includePassword: true });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await db.user.findUnique({
      id: req.user.id
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};
