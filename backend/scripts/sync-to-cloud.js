/**
 * Script to sync local database to SQLite Cloud
 * Run this after making changes: node scripts/sync-to-cloud.js
 */

import { syncToSQLiteCloud } from '../src/utils/sqliteCloudSync.js';

async function main() {
  console.log('🔄 Starting database sync to SQLite Cloud...\n');
  
  const success = await syncToSQLiteCloud();
  
  if (success) {
    console.log('\n✅ Sync completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Sync failed. Check the error messages above.');
    process.exit(1);
  }
}

main();

