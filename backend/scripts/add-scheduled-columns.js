/**
 * Script to add scheduled columns to SQLite Cloud requests table
 * Run: node scripts/add-scheduled-columns.js
 */

import { getConnection, query, execute } from '../src/utils/sqliteCloudClient.js';

async function addScheduledColumns() {
  try {
    console.log('🔄 Adding scheduled columns to requests table...\n');

    const columns = [
      { name: 'scheduledDate', type: 'DATETIME' },
      { name: 'scheduledTime', type: 'TEXT' },
      { name: 'recurring', type: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'recurringPattern', type: 'TEXT' }
    ];

    // Check if requests table exists
    try {
      await query('SELECT * FROM requests LIMIT 1');
    } catch (err) {
      console.error('❌ Requests table does not exist. Please run ensure-tables first.');
      process.exit(1);
    }

    for (const col of columns) {
      let columnExists = false;
      try {
        await query(`SELECT "${col.name}" FROM requests LIMIT 1`);
        columnExists = true;
        console.log(`ℹ️  Column ${col.name} already exists`);
      } catch (err) {
        if (err.message && (err.message.includes('no such column') || err.message.includes(col.name))) {
          columnExists = false;
        } else {
          throw err;
        }
      }

      if (!columnExists) {
        try {
          console.log(`📝 Adding ${col.name} column...`);
          await execute(`ALTER TABLE requests ADD COLUMN "${col.name}" ${col.type}`);
          console.log(`✅ Added ${col.name} column`);
        } catch (alterErr) {
          if (alterErr.message && (
            alterErr.message.includes('duplicate column') || 
            alterErr.message.includes('already exists')
          )) {
            console.log(`ℹ️  Column ${col.name} already exists`);
          } else {
            console.error(`❌ Error adding ${col.name}:`, alterErr.message);
            throw alterErr;
          }
        }
      }
    }

    console.log('\n✅ All scheduled columns are ready!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error adding scheduled columns:', error);
    process.exit(1);
  }
}

addScheduledColumns();

