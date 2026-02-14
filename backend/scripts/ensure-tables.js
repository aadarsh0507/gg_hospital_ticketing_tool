/**
 * Script to ensure all database tables exist and match Prisma schema
 * This script will:
 * 1. Check if tables exist
 * 2. Create missing tables
 * 3. Add missing columns to existing tables
 * 
 * Run: node scripts/ensure-tables.js
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Execute SQL directly on the database
 */
async function executeSQL(sql) {
  try {
    // Use Prisma's $executeRawUnsafe for direct SQL execution
    await prisma.$executeRawUnsafe(sql);
    return true;
  } catch (error) {
    // Ignore errors for "already exists" cases
    const errorMsg = error.message || '';
    if (errorMsg.includes('already exists') || 
        errorMsg.includes('duplicate column') ||
        errorMsg.includes('duplicate name') ||
        errorMsg.includes('no such table')) {
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName, columnName) {
  try {
    // SQLite pragma to get table info
    const result = await prisma.$queryRawUnsafe(
      `PRAGMA table_info("${tableName}")`
    );
    return Array.isArray(result) && result.some(col => col.name === columnName);
  } catch (error) {
    return false;
  }
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name="${tableName}"`
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Add missing column to a table
 */
async function addColumnIfMissing(tableName, columnName, columnDefinition) {
  const exists = await columnExists(tableName, columnName);
  if (!exists) {
    try {
      await executeSQL(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      console.log(`✅ Added column ${columnName} to ${tableName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error adding column ${columnName} to ${tableName}:`, error.message);
      return false;
    }
  } else {
    console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
    return true;
  }
}

/**
 * Main function to ensure all tables exist
 */
async function ensureTables() {
  console.log('🔄 Checking database tables...\n');

  try {
    // Check and create tables in dependency order
    
    // 1. Departments (no dependencies)
    if (!(await tableExists('departments'))) {
      console.log('📝 Creating departments table...');
      await executeSQL(`
        CREATE TABLE "departments" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "description" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created departments table');
    }

    // 2. Blocks (no dependencies)
    if (!(await tableExists('blocks'))) {
      console.log('📝 Creating blocks table...');
      await executeSQL(`
        CREATE TABLE "blocks" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "description" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created blocks table');
    }

    // 3. Locations (depends on blocks and departments)
    if (!(await tableExists('locations'))) {
      console.log('📝 Creating locations table...');
      await executeSQL(`
        CREATE TABLE "locations" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "blockId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "floor" INTEGER,
          "areaType" TEXT,
          "departmentId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("blockId") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          UNIQUE("blockId", "name")
        )
      `);
      console.log('✅ Created locations table');
    }

    // 4. Users (depends on locations)
    if (!(await tableExists('users'))) {
      console.log('📝 Creating users table...');
      await executeSQL(`
        CREATE TABLE "users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "phoneNumber" TEXT,
          "role" TEXT NOT NULL DEFAULT 'REQUESTER',
          "department" TEXT,
          "isActive" INTEGER NOT NULL DEFAULT 1,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created users table');
    } else {
      // Add locationId column if missing
      await addColumnIfMissing('users', 'locationId', 'TEXT REFERENCES locations(id) ON DELETE SET NULL');
    }

    // 5. Services (depends on departments and locations)
    if (!(await tableExists('services'))) {
      console.log('📝 Creating services table...');
      await executeSQL(`
        CREATE TABLE "services" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "description" TEXT,
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
          FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);
      console.log('✅ Created services table');
    }

    // 6. Requests (depends on locations, departments, services, users)
    if (!(await tableExists('requests'))) {
      console.log('📝 Creating requests table...');
      await executeSQL(`
        CREATE TABLE "requests" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "requestId" TEXT NOT NULL UNIQUE,
          "serviceType" TEXT NOT NULL,
          "serviceId" TEXT,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "priority" INTEGER NOT NULL DEFAULT 3,
          "status" TEXT NOT NULL DEFAULT 'NEW',
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
          FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);
      console.log('✅ Created requests table');
    } else {
      // Add missing columns if they don't exist
      await addColumnIfMissing('requests', 'serviceId', 'TEXT REFERENCES services(id) ON DELETE SET NULL');
      await addColumnIfMissing('requests', 'scheduledDate', 'DATETIME');
      await addColumnIfMissing('requests', 'scheduledTime', 'TEXT');
      await addColumnIfMissing('requests', 'recurring', 'INTEGER NOT NULL DEFAULT 0');
      await addColumnIfMissing('requests', 'recurringPattern', 'TEXT');
    }

    // 7. Request Activities (depends on requests and users)
    if (!(await tableExists('request_activities'))) {
      console.log('📝 Creating request_activities table...');
      await executeSQL(`
        CREATE TABLE "request_activities" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "requestId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      console.log('✅ Created request_activities table');
    }

    // 8. Request Links (depends on requests)
    if (!(await tableExists('request_links'))) {
      console.log('📝 Creating request_links table...');
      await executeSQL(`
        CREATE TABLE "request_links" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "requestId" TEXT NOT NULL UNIQUE,
          "linkType" TEXT NOT NULL,
          "locationId" TEXT,
          "phoneNumber" TEXT,
          "token" TEXT NOT NULL UNIQUE,
          "expiresAt" DATETIME,
          "isUsed" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      console.log('✅ Created request_links table');
    }

    console.log('\n✅ All tables are ready!');
    
  } catch (error) {
    console.error('\n❌ Error ensuring tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export the function for use in other modules
export { ensureTables };

// Run the script if called directly
// Check if this is the main entry point by comparing file paths
const currentFile = new URL(import.meta.url).pathname.replace(/\\/g, '/');
const mainFile = process.argv[1]?.replace(/\\/g, '/') || '';

if (currentFile.endsWith('ensure-tables.js') && mainFile.includes('ensure-tables')) {
  ensureTables()
    .then(() => {
      console.log('\n🎉 Database initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to initialize database:', error);
      process.exit(1);
    });
}

