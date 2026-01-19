/**
 * Fix database path in .env to use absolute path with proper encoding
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
const dbPath = path.join(__dirname, '../prisma/dev.db');

// Convert to absolute path
const absoluteDbPath = path.resolve(dbPath);

// For SQLite file URLs, use forward slashes and encode spaces
const dbUrl = `file:${absoluteDbPath.replace(/\\/g, '/')}`;

try {
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update DATABASE_URL
  const newDbUrl = `DATABASE_URL="${dbUrl}"`;
  
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /DATABASE_URL="[^"]*"/,
      newDbUrl
    );
  } else {
    envContent = newDbUrl + '\n' + envContent;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Updated DATABASE_URL:');
  console.log(`   ${newDbUrl}`);
  console.log('\n💡 Restart your server for changes to take effect');
  console.log('   Stop the server (Ctrl+C) and run: npm start');
  
} catch (error) {
  console.error('❌ Error fixing database path:', error);
  process.exit(1);
}
