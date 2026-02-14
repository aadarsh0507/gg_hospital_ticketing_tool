/**
 * SQLite Cloud Database Client
 * This client uses SQLite Cloud directly for all database operations
 */

import { Database } from '@sqlitecloud/drivers';
import dotenv from 'dotenv';

dotenv.config();

// SQLite Cloud connection configuration
const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL || 'sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/auth.sqlitecloud?apikey=p64wz0wmi1gcXyTkxPbeis1lwVhaODiRKQaWcL8x2nU';

let database = null;

/**
 * Check if an error is a connection error that requires reconnection
 */
function isConnectionError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const errorCode = error.errorCode || '';
  const cause = error.cause;
  
  // Check for connection-related error codes
  const connectionErrorCodes = [
    'ERR_CONNECTION_ERROR',
    'ERR_CONNECTION_ENDED',
    'ERR_CONNECTION_CLOSED',
    'ERR_CONNECTION_TIMEOUT'
  ];
  
  if (connectionErrorCodes.includes(errorCode)) {
    return true;
  }
  
  // Check for connection-related error messages
  if (errorMessage.includes('Connection error') ||
      errorMessage.includes('Connection closed') ||
      errorMessage.includes('Connection ended') ||
      errorMessage.includes('Connection timeout')) {
    return true;
  }
  
  // Check for ECONNRESET, ECONNREFUSED, etc. in the cause
  if (cause) {
    const causeCode = cause.code || '';
    if (causeCode === 'ECONNRESET' ||
        causeCode === 'ECONNREFUSED' ||
        causeCode === 'ETIMEDOUT' ||
        causeCode === 'ENOTFOUND') {
      return true;
    }
  }
  
  return false;
}

/**
 * Reset the database connection
 */
function resetConnection() {
  if (database) {
    try {
      // Try to close the connection if it has a close method
      if (typeof database.close === 'function') {
        database.close().catch(() => {
          // Ignore errors when closing a dead connection
        });
      }
    } catch (error) {
      // Ignore errors when resetting
    }
    database = null;
  }
}

/**
 * Get or create SQLite Cloud database connection
 */
export function getConnection() {
  if (!database) {
    try {
      // Create database connection using the connection string directly
      database = new Database(SQLITE_CLOUD_URL);
      console.log('✅ Connected to SQLite Cloud');
    } catch (error) {
      console.error('❌ Could not connect to SQLite Cloud:', error.message);
      throw error;
    }
  }
  return database;
}

/**
 * Execute a query on SQLite Cloud with automatic reconnection on connection errors
 */
export async function query(sql, params = [], retryCount = 0) {
  const maxRetries = 2;
  
  try {
    const db = getConnection();
    // Use the sql() method from Database class
    // The sql() method expects individual parameters, not an array
    // So we spread the params array
    const result = await db.sql(sql, ...params);
    // The sql() method returns rows directly for SELECT queries
    if (Array.isArray(result)) {
      return { rows: result };
    }
    // For INSERT/UPDATE/DELETE, it might return an object with changes
    if (result && typeof result === 'object' && 'changes' in result) {
      return { rows: [], changes: result.changes };
    }
    // If it's a number (affected rows), return it as changes
    if (typeof result === 'number') {
      return { rows: [], changes: result };
    }
    // Default: return empty rows array
    return { rows: result || [] };
  } catch (error) {
    // Check if this is a connection error and we haven't exceeded retry limit
    if (isConnectionError(error) && retryCount < maxRetries) {
      console.warn(`⚠️  Connection error detected, resetting connection and retrying (attempt ${retryCount + 1}/${maxRetries})...`);
      // Reset the connection
      resetConnection();
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
      // Retry the query with a fresh connection
      return query(sql, params, retryCount + 1);
    }
    console.error('SQLite Cloud query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return rows
 */
export async function queryRows(sql, params = []) {
  const result = await query(sql, params);
  // SQLite Cloud returns rowset, extract rows
  if (result && result.rows) {
    return result.rows;
  }
  if (Array.isArray(result)) {
    return result;
  }
  return [];
}

/**
 * Execute a query and return first row
 */
export async function queryRow(sql, params = []) {
  const rows = await queryRows(sql, params);
  return rows[0] || null;
}

/**
 * Execute a query and return affected rows count with automatic reconnection on connection errors
 */
export async function execute(sql, params = [], retryCount = 0) {
  const maxRetries = 2;
  
  try {
    const db = getConnection();
    // Execute the query - spread params array as individual parameters
    const result = await db.sql(sql, ...params);
    // For INSERT/UPDATE/DELETE, result might be an object with changes property
    // or just the number of affected rows
    if (typeof result === 'number') {
      return result;
    }
    if (result && typeof result === 'object' && 'changes' in result) {
      return result.changes;
    }
    // If it's an array (SELECT query), return 0
    if (Array.isArray(result)) {
      return 0;
    }
    return 0;
  } catch (error) {
    // Check if this is a connection error and we haven't exceeded retry limit
    if (isConnectionError(error) && retryCount < maxRetries) {
      console.warn(`⚠️  Connection error detected, resetting connection and retrying (attempt ${retryCount + 1}/${maxRetries})...`);
      // Reset the connection
      resetConnection();
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
      // Retry the query with a fresh connection
      return execute(sql, params, retryCount + 1);
    }
    console.error('SQLite Cloud execute error:', error);
    throw error;
  }
}

/**
 * Add missing columns to existing tables (migration)
 */
async function migrateSchema() {
  try {
    // Check if locations table exists first
    try {
      await query('SELECT * FROM locations LIMIT 1');
      
      // Check if isActive column exists by trying to query it
      let columnExists = false;
      try {
        await query('SELECT isActive FROM locations LIMIT 1');
        columnExists = true;
      } catch (err) {
        if (err.message && (err.message.includes('no such column') || err.message.includes('isActive'))) {
          columnExists = false;
        } else {
          // Some other error, rethrow
          throw err;
        }
      }
      
      // Add column if it doesn't exist
      if (!columnExists) {
        console.log('📝 Adding isActive column to locations table...');
        try {
          await execute('ALTER TABLE locations ADD COLUMN isActive INTEGER NOT NULL DEFAULT 1');
          console.log('✅ Added isActive column to locations table');
        } catch (alterErr) {
          // Silently ignore duplicate column errors - column already exists
          if (alterErr.message && (
            alterErr.message.includes('duplicate column') || 
            alterErr.message.includes('already exists') ||
            alterErr.message.includes('UNIQUE constraint')
          )) {
            // Column already exists, that's fine
          } else {
            // Some other error, log it but don't fail
            console.warn('⚠️  Could not add isActive column:', alterErr.message);
          }
        }
      }
    } catch (tableErr) {
      // Table doesn't exist yet, will be created by schema initialization
      // Silently ignore - table will be created by schema init
    }

    // Check if requests table exists and add serviceId column if needed
    try {
      await query('SELECT * FROM requests LIMIT 1');
      
      // Check if serviceId column exists
      let serviceIdExists = false;
      try {
        await query('SELECT "serviceId" FROM requests LIMIT 1');
        serviceIdExists = true;
      } catch (err) {
        if (err.message && (err.message.includes('no such column') || err.message.includes('serviceId'))) {
          serviceIdExists = false;
        } else {
          throw err;
        }
      }
      
      // Add column if it doesn't exist
      if (!serviceIdExists) {
        console.log('📝 Adding serviceId column to requests table...');
        try {
          await execute('ALTER TABLE requests ADD COLUMN "serviceId" TEXT');
          console.log('✅ Added serviceId column to requests table');
        } catch (alterErr) {
          if (alterErr.message && (
            alterErr.message.includes('duplicate column') || 
            alterErr.message.includes('already exists')
          )) {
            // Column already exists, that's fine
          } else {
            console.warn('⚠️  Could not add serviceId column:', alterErr.message);
          }
        }
      }

      // Check and add scheduled columns
      const scheduledColumns = [
        { name: 'scheduledDate', type: 'DATETIME' },
        { name: 'scheduledTime', type: 'TEXT' },
        { name: 'recurring', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'recurringPattern', type: 'TEXT' }
      ];

      // Check if each column exists before trying to add it
      for (const col of scheduledColumns) {
        let columnExists = false;
        try {
          await query(`SELECT "${col.name}" FROM requests LIMIT 1`);
          columnExists = true;
        } catch (err) {
          const errorMsg = err.message || err.toString() || '';
          if (errorMsg.includes('no such column') || errorMsg.includes('has no column') || errorMsg.includes(col.name)) {
            columnExists = false;
          } else {
            // Some other error, assume column doesn't exist and try to add it
            columnExists = false;
          }
        }
        
        // Add column if it doesn't exist
        if (!columnExists) {
          try {
            await execute(`ALTER TABLE requests ADD COLUMN "${col.name}" ${col.type}`);
            console.log(`✅ Added ${col.name} column to requests table`);
          } catch (alterErr) {
            const alterErrorMsg = alterErr.message || alterErr.toString() || '';
            if (alterErrorMsg.includes('duplicate column') || 
                alterErrorMsg.includes('already exists')) {
              // Column already exists (race condition or just added), that's fine
              // Silently ignore - no need to log
            } else {
              console.warn(`⚠️  Could not add ${col.name} column:`, alterErrorMsg);
            }
          }
        }
        // If column exists, skip silently (no log needed)
      }
    } catch (tableErr) {
      // Table doesn't exist yet, will be created by schema initialization
      // Silently ignore
    }

    // Check if services table exists and add missing columns if needed
    try {
      await query('SELECT * FROM services LIMIT 1');
      // Table exists, check for missing columns and add them
      // List of columns that should exist in services table
      const servicesColumns = [
        { name: 'isActive', type: 'INTEGER NOT NULL DEFAULT 1' }
      ];

      for (const col of servicesColumns) {
        let columnExists = false;
        try {
          await query(`SELECT "${col.name}" FROM services LIMIT 1`);
          columnExists = true;
        } catch (err) {
          const errorMsg = err.message || err.toString() || '';
          if (errorMsg.includes('no such column') || errorMsg.includes('has no column') || errorMsg.includes(col.name)) {
            columnExists = false;
          } else {
            columnExists = false;
          }
        }
        
        // Add column if it doesn't exist
        if (!columnExists) {
          try {
            await execute(`ALTER TABLE services ADD COLUMN "${col.name}" ${col.type}`);
            console.log(`✅ Added ${col.name} column to services table`);
          } catch (alterErr) {
            const alterErrorMsg = alterErr.message || alterErr.toString() || '';
            if (alterErrorMsg.includes('duplicate column') || 
                alterErrorMsg.includes('already exists')) {
              // Column already exists, that's fine
            } else {
              console.warn(`⚠️  Could not add ${col.name} column to services:`, alterErrorMsg);
            }
          }
        }
      }
    } catch (tableErr) {
      // Table doesn't exist yet, will be created by schema initialization
      // Silently ignore
    }

    // Check if system_settings table exists, create if it doesn't
    try {
      await query('SELECT * FROM system_settings LIMIT 1');
      // Table exists, that's fine
    } catch (tableErr) {
      // Table doesn't exist, create it
      console.log('📝 Creating system_settings table...');
      try {
        await execute(`
          CREATE TABLE IF NOT EXISTS system_settings (
            id TEXT PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedBy" TEXT,
            FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE SET NULL
          )
        `);
        console.log('✅ Created system_settings table');
      } catch (createErr) {
        console.warn('⚠️  Could not create system_settings table:', createErr.message);
      }
    }

    // Check if users table exists and add locationId column if needed
    try {
      await query('SELECT * FROM users LIMIT 1');
      // Table exists, check if locationId column exists
      let locationIdExists = false;
      try {
        await query('SELECT "locationId" FROM users LIMIT 1');
        locationIdExists = true;
      } catch (err) {
        if (err.message && (err.message.includes('no such column') || err.message.includes('locationId'))) {
          locationIdExists = false;
        } else {
          throw err;
        }
      }
      
      // Add column if it doesn't exist
      if (!locationIdExists) {
        console.log('📝 Adding locationId column to users table...');
        try {
          await execute('ALTER TABLE users ADD COLUMN "locationId" TEXT');
          console.log('✅ Added locationId column to users table');
        } catch (alterErr) {
          // Silently ignore duplicate column errors - column already exists
          if (alterErr.message && (
            alterErr.message.includes('duplicate column') || 
            alterErr.message.includes('already exists') ||
            alterErr.message.includes('UNIQUE constraint')
          )) {
            // Column already exists, that's fine
            console.log('ℹ️  locationId column already exists in users table');
          } else {
            // Some other error, log it but don't fail
            console.warn('⚠️  Could not add locationId column:', alterErr.message);
          }
        }
      } else {
        console.log('ℹ️  locationId column already exists in users table');
      }
      
      // Create index for better query performance (always try, IF NOT EXISTS handles duplicates)
      try {
        await execute('CREATE INDEX IF NOT EXISTS idx_users_locationId ON users("locationId")');
        console.log('✅ Created/verified index on locationId column');
      } catch (idxErr) {
        // Index might already exist, that's fine
        console.log('ℹ️  Index may already exist');
      }
    } catch (tableErr) {
      // Table doesn't exist yet, will be created by schema initialization with locationId column
      // Silently ignore - table will be created by schema init
      console.log('ℹ️  users table does not exist yet, will be created with locationId column');
    }

  } catch (error) {
    // Migration errors are not critical - suppress the error message
    // The error is expected if the column doesn't exist
  }
}

/**
 * Initialize database schema (create tables if they don't exist)
 * This should be run once to set up the database structure
 */
export async function initializeSchema() {
  const createTablesSQL = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "phoneNumber" TEXT,
      role TEXT NOT NULL DEFAULT 'REQUESTER',
      department TEXT,
      "locationId" TEXT,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("locationId") REFERENCES locations(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      "blockId" TEXT NOT NULL,
      name TEXT NOT NULL,
      floor INTEGER,
      "areaType" TEXT,
      "departmentId" TEXT,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("blockId") REFERENCES blocks(id) ON DELETE CASCADE,
      FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
      UNIQUE("blockId", name)
    )`,
    `CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      "requestId" TEXT UNIQUE NOT NULL,
      "serviceType" TEXT NOT NULL,
      "serviceId" TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'NEW',
      "locationId" TEXT,
      "departmentId" TEXT,
      "createdById" TEXT NOT NULL,
      "assignedToId" TEXT,
      "requestedBy" TEXT,
      "estimatedTime" INTEGER,
      "completedAt" DATETIME,
      "scheduledDate" DATETIME,
      "scheduledTime" TEXT,
      "recurring" INTEGER NOT NULL DEFAULT 0,
      "recurringPattern" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("locationId") REFERENCES locations(id) ON DELETE SET NULL,
      FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY ("serviceId") REFERENCES services(id) ON DELETE SET NULL,
      FOREIGN KEY ("createdById") REFERENCES users(id),
      FOREIGN KEY ("assignedToId") REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS request_activities (
      id TEXT PRIMARY KEY,
      "requestId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("requestId") REFERENCES requests(id) ON DELETE CASCADE,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS request_links (
      id TEXT PRIMARY KEY,
      "requestId" TEXT UNIQUE NOT NULL,
      "linkType" TEXT NOT NULL,
      "locationId" TEXT,
      "phoneNumber" TEXT,
      token TEXT UNIQUE NOT NULL,
      "expiresAt" DATETIME,
      "isUsed" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("requestId") REFERENCES requests(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      "areaType" TEXT,
      "departmentId" TEXT,
      "locationId" TEXT,
      "slaEnabled" INTEGER NOT NULL DEFAULT 0,
      "slaHours" INTEGER NOT NULL DEFAULT 0,
      "slaMinutes" INTEGER NOT NULL DEFAULT 0,
      "otpVerificationRequired" INTEGER NOT NULL DEFAULT 0,
      "displayToCustomer" INTEGER NOT NULL DEFAULT 1,
      "iconUrl" TEXT,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY ("locationId") REFERENCES locations(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedBy" TEXT,
      FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE SET NULL
    )`,
  ];

  try {
    // Run migrations first (to drop services table if needed)
    await migrateSchema();
    
    // Execute all CREATE TABLE statements
    for (const statement of createTablesSQL) {
      await execute(statement);
    }
    
    // Create performance indexes for frequently queried columns
    const createIndexesSQL = [
      // Requests table indexes
      'CREATE INDEX IF NOT EXISTS idx_requests_createdById ON requests("createdById")',
      'CREATE INDEX IF NOT EXISTS idx_requests_assignedToId ON requests("assignedToId")',
      'CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_requests_createdAt ON requests("createdAt")',
      'CREATE INDEX IF NOT EXISTS idx_requests_scheduledDate ON requests("scheduledDate")',
      'CREATE INDEX IF NOT EXISTS idx_requests_locationId ON requests("locationId")',
      'CREATE INDEX IF NOT EXISTS idx_requests_departmentId ON requests("departmentId")',
      'CREATE INDEX IF NOT EXISTS idx_requests_serviceType ON requests("serviceType")',
      'CREATE INDEX IF NOT EXISTS idx_requests_completedAt ON requests("completedAt")',
      // Composite indexes for common query patterns
      'CREATE INDEX IF NOT EXISTS idx_requests_status_createdAt ON requests(status, "createdAt" DESC)',
      'CREATE INDEX IF NOT EXISTS idx_requests_createdById_status ON requests("createdById", status)',
      'CREATE INDEX IF NOT EXISTS idx_requests_assignedToId_status ON requests("assignedToId", status)',
      'CREATE INDEX IF NOT EXISTS idx_requests_scheduledDate_createdById ON requests("scheduledDate", "createdById")',
      
      // Users table indexes
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_isActive ON users("isActive")',
      'CREATE INDEX IF NOT EXISTS idx_users_department ON users(department)',
      'CREATE INDEX IF NOT EXISTS idx_users_locationId ON users("locationId")',
      
      // Request activities indexes
      'CREATE INDEX IF NOT EXISTS idx_request_activities_requestId ON request_activities("requestId")',
      'CREATE INDEX IF NOT EXISTS idx_request_activities_userId ON request_activities("userId")',
      'CREATE INDEX IF NOT EXISTS idx_request_activities_createdAt ON request_activities("createdAt" DESC)',
      
      // Locations indexes
      'CREATE INDEX IF NOT EXISTS idx_locations_blockId ON locations("blockId")',
      'CREATE INDEX IF NOT EXISTS idx_locations_departmentId ON locations("departmentId")',
    ];
    
    console.log('📊 Creating performance indexes...');
    for (const indexSQL of createIndexesSQL) {
      try {
        await execute(indexSQL);
      } catch (idxError) {
        // Index might already exist, that's fine
        if (!idxError.message || !idxError.message.includes('already exists')) {
          console.warn(`⚠️  Could not create index: ${indexSQL}`, idxError.message);
        }
      }
    }
    console.log('✅ Performance indexes created');
    console.log('✅ Database schema initialized in SQLite Cloud');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing schema:', error.message);
    throw error;
  }
}

/**
 * Close connection
 */
export async function close() {
  if (database) {
    try {
      // Database class might have a close method, or we just set to null
      if (typeof database.close === 'function') {
        await database.close();
      }
      database = null;
      console.log('✅ SQLite Cloud connection closed');
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
}

export default {
  getConnection,
  query,
  queryRows,
  queryRow,
  execute,
  initializeSchema,
  close,
};
