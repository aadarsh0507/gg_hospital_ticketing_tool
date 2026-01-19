/**
 * SQLite Cloud Database Client
 * This client uses SQLite Cloud directly for all database operations
 * Falls back to local SQLite if credentials are not provided
 */

import { SQLiteCloudConnection } from '@sqlitecloud/drivers';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQLite Cloud connection configuration
const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL || 'sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool';
const SQLITE_CLOUD_USERNAME = process.env.SQLITE_CLOUD_USERNAME;
const SQLITE_CLOUD_PASSWORD = process.env.SQLITE_CLOUD_PASSWORD;
const SQLITE_CLOUD_APIKEY = process.env.SQLITE_CLOUD_APIKEY;
const SQLITE_CLOUD_TOKEN = process.env.SQLITE_CLOUD_TOKEN;

// Check if we have credentials
const hasCredentials = !!(SQLITE_CLOUD_APIKEY || SQLITE_CLOUD_TOKEN || (SQLITE_CLOUD_USERNAME && SQLITE_CLOUD_PASSWORD));

let connection = null;
let localDb = null;
let useLocalFallback = false;

/**
 * Initialize local SQLite database as fallback
 */
function initLocalDb() {
  if (!localDb) {
    const dbPath = join(__dirname, '../../prisma/dev.db');
    // Ensure directory exists
    const dbDir = dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    localDb = new Database(dbPath);
    localDb.pragma('foreign_keys = ON');
    console.log('📁 Using local SQLite database (fallback mode)');
    console.log('💡 To use SQLite Cloud, add SQLITE_CLOUD_APIKEY, SQLITE_CLOUD_TOKEN, or SQLITE_CLOUD_USERNAME/PASSWORD to .env');
  }
  return localDb;
}

/**
 * Get or create SQLite Cloud connection
 */
export function getConnection() {
  // If no credentials, use local fallback
  if (!hasCredentials) {
    useLocalFallback = true;
    return initLocalDb();
  }

  if (!connection) {
    try {
      // Build connection config
      const config = {
        connectionstring: SQLITE_CLOUD_URL,
      };

      // Add authentication if provided
      if (SQLITE_CLOUD_APIKEY) {
        config.apikey = SQLITE_CLOUD_APIKEY;
      } else if (SQLITE_CLOUD_TOKEN) {
        config.token = SQLITE_CLOUD_TOKEN;
      } else if (SQLITE_CLOUD_USERNAME && SQLITE_CLOUD_PASSWORD) {
        config.username = SQLITE_CLOUD_USERNAME;
        config.password = SQLITE_CLOUD_PASSWORD;
      } else {
        // Try to extract from connection string
        try {
          const url = new URL(SQLITE_CLOUD_URL.replace('sqlitecloud://', 'http://'));
          if (url.searchParams.get('apikey')) {
            config.apikey = url.searchParams.get('apikey');
          } else if (url.searchParams.get('token')) {
            config.token = url.searchParams.get('token');
          }
        } catch (e) {
          // URL parsing failed, will fall back to local
        }
      }

      // Only create connection if we have auth
      if (config.apikey || config.token || config.username) {
        connection = new SQLiteCloudConnection(config);
        console.log('✅ Connected to SQLite Cloud');
        useLocalFallback = false;
      } else {
        throw new Error('No authentication credentials provided');
      }
    } catch (error) {
      console.warn('⚠️  Could not connect to SQLite Cloud:', error.message);
      console.log('📁 Falling back to local SQLite database');
      useLocalFallback = true;
      return initLocalDb();
    }
  }
  return connection;
}

/**
 * Execute a query on SQLite Cloud or local database
 */
export async function query(sql, params = []) {
  const conn = getConnection();
  
  if (useLocalFallback || localDb) {
    // Use local SQLite
    try {
      const stmt = localDb.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return { rows: stmt.all(...params) };
      } else {
        const result = stmt.run(...params);
        return { changes: result.changes || 0, lastInsertRowid: result.lastInsertRowid };
      }
    } catch (error) {
      console.error('Local database query error:', error);
      throw error;
    }
  } else {
    // Use SQLite Cloud
    try {
      const result = await conn.query(sql, params);
      return result;
    } catch (error) {
      console.error('SQLite Cloud query error:', error);
      throw error;
    }
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
 * Execute a query and return affected rows count
 */
export async function execute(sql, params = []) {
  const result = await query(sql, params);
  // SQLite Cloud returns changes/affectedRows
  if (result && result.changes !== undefined) {
    return result.changes;
  }
  if (result && result.affectedRows !== undefined) {
    return result.affectedRows;
  }
  return 0;
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
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("locationId") REFERENCES locations(id) ON DELETE SET NULL,
      FOREIGN KEY ("departmentId") REFERENCES departments(id) ON DELETE SET NULL,
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
  ];

  try {
    // Execute all CREATE TABLE statements
    for (const statement of createTablesSQL) {
      await execute(statement);
    }
    const dbType = useLocalFallback ? 'local SQLite' : 'SQLite Cloud';
    console.log(`✅ Database schema initialized in ${dbType}`);
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
  if (connection) {
    try {
      await connection.close();
      connection = null;
      console.log('✅ SQLite Cloud connection closed');
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
  if (localDb) {
    try {
      localDb.close();
      localDb = null;
      console.log('✅ Local database connection closed');
    } catch (error) {
      console.error('Error closing local database:', error);
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
