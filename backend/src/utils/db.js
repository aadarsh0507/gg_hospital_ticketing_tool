/**
 * Unified Database Client
 * Uses SQLite Cloud for all operations
 */

import { v4 as uuidv4 } from 'uuid';
import * as sqliteCloud from './sqliteCloudClient.js';

// Re-export SQLite Cloud functions
export const query = sqliteCloud.query;
export const queryRows = sqliteCloud.queryRows;
export const queryRow = sqliteCloud.queryRow;
export const execute = sqliteCloud.execute;
export const initializeSchema = sqliteCloud.initializeSchema;

/**
 * User operations
 */
export const userDB = {
  async findUnique(where) {
    if (where.email) {
      const sql = 'SELECT * FROM users WHERE email = ?';
      return await sqliteCloud.queryRow(sql, [where.email]);
    }
    if (where.id) {
      const sql = 'SELECT * FROM users WHERE id = ?';
      return await sqliteCloud.queryRow(sql, [where.id]);
    }
    return null;
  },

  async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();   // ⭐ timestamp

    const sql = `
      INSERT INTO users 
      (id, email, password, "firstName", "lastName", "phoneNumber", role, department, "isActive", "createdAt", "updatedAt")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sqliteCloud.execute(sql, [
      id,
      data.email,
      data.password,
      data.firstName,
      data.lastName,
      data.phoneNumber || null,
      data.role || 'REQUESTER',
      data.department || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      now,   // createdAt
      now    // updatedAt
    ]);

    return await this.findUnique({ id });
  },

  async findMany(where = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (where.role) {
      sql += ' AND role = ?';
      params.push(where.role);
    }
    if (where.isActive !== undefined) {
      sql += ' AND "isActive" = ?';
      params.push(where.isActive ? 1 : 0);
    }

    return await sqliteCloud.queryRows(sql, params);
  },

  async count(where = {}) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];

    if (where.role) {
      sql += ' AND role = ?';
      params.push(where.role);
    }
    if (where.isActive !== undefined) {
      sql += ' AND "isActive" = ?';
      params.push(where.isActive ? 1 : 0);
    }

    const result = await sqliteCloud.queryRow(sql, params);
    return result?.count || 0;
  },
};

/**
 * Request operations
 */
export const requestDB = {
  async findUnique(where) {
    if (where.id) {
      const sql = 'SELECT * FROM requests WHERE id = ?';
      return await sqliteCloud.queryRow(sql, [where.id]);
    }
    if (where.requestId) {
      const sql = 'SELECT * FROM requests WHERE "requestId" = ?';
      return await sqliteCloud.queryRow(sql, [where.requestId]);
    }
    return null;
  },

  async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();   // ⭐ timestamp

    const sql = `
      INSERT INTO requests 
      (id, "requestId", "serviceType", title, description, priority, status, 
       "locationId", "departmentId", "createdById", "assignedToId", "requestedBy", 
       "estimatedTime", "createdAt", "updatedAt")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sqliteCloud.execute(sql, [
      id,
      data.requestId,
      data.serviceType,
      data.title,
      data.description || null,
      data.priority || 3,
      data.status || 'NEW',
      data.locationId || null,
      data.departmentId || null,
      data.createdById,
      data.assignedToId || null,
      data.requestedBy || null,
      data.estimatedTime || null,
      now,   // createdAt
      now    // updatedAt
    ]);

    return await this.findUnique({ id });
  },

  async findMany(where = {}, options = {}) {
    let sql = 'SELECT * FROM requests WHERE 1=1';
    const params = [];

    if (where.status) {
      sql += ' AND status = ?';
      params.push(where.status);
    }
    if (where.createdById) {
      sql += ' AND "createdById" = ?';
      params.push(where.createdById);
    }
    if (where.assignedToId) {
      sql += ' AND "assignedToId" = ?';
      params.push(where.assignedToId);
    }

    sql += ' ORDER BY "createdAt" DESC';

    if (options.skip) {
      sql += ` LIMIT ${options.take || 10} OFFSET ${options.skip}`;
    } else if (options.take) {
      sql += ` LIMIT ${options.take}`;
    }

    return await sqliteCloud.queryRows(sql, params);
  },

  async count(where = {}) {
    let sql = 'SELECT COUNT(*) as count FROM requests WHERE 1=1';
    const params = [];

    if (where.status) {
      sql += ' AND status = ?';
      params.push(where.status);
    }

    const result = await sqliteCloud.queryRow(sql, params);
    return result?.count || 0;
  },
};

// Export a Prisma-like interface
export const db = {
  user: userDB,
  request: requestDB,
};

export default db;
