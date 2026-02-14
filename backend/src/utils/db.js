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
 * Transform database row to match frontend format
 * Handles different column name formats from SQLite Cloud
 * @param {Object} row - The database row
 * @param {boolean} includePassword - Whether to include password in the result (for login)
 */
function transformUserRow(row, includePassword = false) {
  if (!row) return null;
  
  // Try to get values with different possible column name formats
  const getValue = (row, ...keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return row[key];
      }
    }
    return null;
  };
  
  const transformed = {
    id: getValue(row, 'id', 'ID', 'Id') || null,
    email: getValue(row, 'email', 'EMAIL', 'Email') || null,
    firstName: getValue(row, 'firstName', 'firstname', 'FIRSTNAME', 'FirstName') || null,
    lastName: getValue(row, 'lastName', 'lastname', 'LASTNAME', 'LastName') || null,
    phoneNumber: getValue(row, 'phoneNumber', 'phonenumber', 'PHONENUMBER', 'PhoneNumber') || null,
    role: getValue(row, 'role', 'ROLE', 'Role') || 'REQUESTER',
    department: getValue(row, 'department', 'DEPARTMENT', 'Department') || null,
    isActive: (() => {
      const val = getValue(row, 'isActive', 'isactive', 'ISACTIVE', 'IsActive');
      if (val === undefined || val === null) return true;
      return val === 1 || val === true || val === '1';
    })(),
    createdAt: getValue(row, 'createdAt', 'createdat', 'CREATEDAT', 'CreatedAt') || null,
    updatedAt: getValue(row, 'updatedAt', 'updatedat', 'UPDATEDAT', 'UpdatedAt') || null
  };
  
  // Include password only if explicitly requested (for login)
  if (includePassword) {
    transformed.password = getValue(row, 'password', 'PASSWORD', 'Password') || null;
  }
  
  return transformed;
}

/**
 * User operations
 */
export const userDB = {
  async findUnique(where, options = {}) {
    let row = null;
    // Explicitly select columns to ensure correct format
    const selectColumns = 'id, email, password, "firstName", "lastName", "phoneNumber", role, department, "isActive", "createdAt", "updatedAt"';
    
    if (where.email) {
      const sql = `SELECT ${selectColumns} FROM users WHERE email = ?`;
      row = await sqliteCloud.queryRow(sql, [where.email]);
    }
    if (where.id && !row) {
      const sql = `SELECT ${selectColumns} FROM users WHERE id = ?`;
      row = await sqliteCloud.queryRow(sql, [where.id]);
    }
    // Include password if requested (for login)
    return transformUserRow(row, options.includePassword || false);
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
    // Explicitly select columns to ensure correct format
    const selectColumns = 'id, email, password, "firstName", "lastName", "phoneNumber", role, department, "isActive", "createdAt", "updatedAt"';
    let sql = `SELECT ${selectColumns} FROM users WHERE 1=1`;
    const params = [];

    if (where.role) {
      sql += ' AND role = ?';
      params.push(where.role);
    }
    if (where.isActive !== undefined) {
      sql += ' AND "isActive" = ?';
      params.push(where.isActive ? 1 : 0);
    }

    const rows = await sqliteCloud.queryRows(sql, params);
    return rows.map(transformUserRow);
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

    // Simple approach: try to use scheduled columns, if error, try to add them
    let hasScheduledColumns = false;
    try {
      // Try a simple query to see if column exists
      await sqliteCloud.query('SELECT "scheduledDate" FROM requests LIMIT 1');
      hasScheduledColumns = true;
    } catch (err) {
      // Column doesn't exist, try to add all scheduled columns
      const errorMsg = err.message || err.toString() || '';
      if (errorMsg.includes('no such column') || errorMsg.includes('has no column')) {
        console.log('📝 Scheduled columns missing, attempting to add them...');
        try {
          await sqliteCloud.execute('ALTER TABLE requests ADD COLUMN "scheduledDate" DATETIME');
          await sqliteCloud.execute('ALTER TABLE requests ADD COLUMN "scheduledTime" TEXT');
          await sqliteCloud.execute('ALTER TABLE requests ADD COLUMN "recurring" INTEGER NOT NULL DEFAULT 0');
          await sqliteCloud.execute('ALTER TABLE requests ADD COLUMN "recurringPattern" TEXT');
          console.log('✅ Added scheduled columns to requests table');
          hasScheduledColumns = true;
        } catch (alterErr) {
          const alterErrorMsg = alterErr.message || alterErr.toString() || '';
          if (alterErrorMsg.includes('duplicate column') || alterErrorMsg.includes('already exists')) {
            // Columns actually exist, use them
            hasScheduledColumns = true;
          } else {
            // Can't add columns, use basic INSERT
            console.warn('⚠️  Could not add scheduled columns, using basic INSERT:', alterErrorMsg);
            hasScheduledColumns = false;
          }
        }
      } else {
        // Different error - assume columns don't exist
        hasScheduledColumns = false;
      }
    }

    let sql, params;
    if (hasScheduledColumns) {
      sql = `
        INSERT INTO requests 
        (id, "requestId", "serviceType", title, description, priority, status, 
         "locationId", "departmentId", "createdById", "assignedToId", "requestedBy", 
         "estimatedTime", "scheduledDate", "scheduledTime", "recurring", "recurringPattern",
         "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
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
        data.scheduledDate || null,
        data.scheduledTime || null,
        data.recurring ? 1 : 0,
        data.recurringPattern || null,
        now,   // createdAt
        now    // updatedAt
      ];
    } else {
      // Fallback: INSERT without scheduled columns
      sql = `
        INSERT INTO requests 
        (id, "requestId", "serviceType", title, description, priority, status, 
         "locationId", "departmentId", "createdById", "assignedToId", "requestedBy", 
         "estimatedTime", "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
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
      ];
    }

    await sqliteCloud.execute(sql, params);

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
