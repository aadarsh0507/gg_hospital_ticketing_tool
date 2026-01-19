/**
 * Setup script to configure .env file for SQLite Cloud
 * Run: node scripts/setup-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

const envContent = `# Prisma requires a local file path (file: protocol)
# This is used for Prisma migrations and queries
DATABASE_URL="file:./prisma/dev.db"

# SQLite Cloud connection URL (for syncing)
# Your SQLite Cloud URL for syncing operations
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
`;

try {
  // Check if .env exists
  if (fs.existsSync(envPath)) {
    // Read existing .env
    const existing = fs.readFileSync(envPath, 'utf8');
    
    // Update DATABASE_URL to use local file if it's using sqlitecloud://
    if (existing.includes('sqlitecloud://')) {
      const updated = existing.replace(
        /DATABASE_URL="sqlitecloud:[^"]*"/,
        'DATABASE_URL="file:./prisma/dev.db"'
      );
      
      // Add SQLITE_CLOUD_URL if not present
      if (!updated.includes('SQLITE_CLOUD_URL')) {
        const lines = updated.split('\n');
        const dbUrlIndex = lines.findIndex(line => line.startsWith('DATABASE_URL='));
        if (dbUrlIndex !== -1) {
          lines.splice(dbUrlIndex + 1, 0, '', 'SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool"');
        }
        fs.writeFileSync(envPath, lines.join('\n'));
        console.log('✅ Updated .env file:');
        console.log('   - DATABASE_URL set to local file (required for Prisma)');
        console.log('   - SQLITE_CLOUD_URL added for syncing');
      } else {
        fs.writeFileSync(envPath, updated);
        console.log('✅ Updated .env file: DATABASE_URL set to local file');
      }
    } else {
      console.log('ℹ️  .env file already configured correctly');
    }
  } else {
    // Create new .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with correct configuration');
  }
  
  console.log('\n📝 Configuration:');
  console.log('   - Prisma will use: file:./prisma/dev.db (local file)');
  console.log('   - SQLite Cloud URL saved for syncing');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npm run prisma:migrate (to create database)');
  console.log('   2. Run: npm start (to start server)');
  console.log('   3. Use sync script to upload to SQLite Cloud when needed');
  
} catch (error) {
  console.error('❌ Error setting up .env:', error);
  process.exit(1);
}

