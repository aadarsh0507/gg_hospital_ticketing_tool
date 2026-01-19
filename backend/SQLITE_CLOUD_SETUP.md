# SQLite Cloud Setup Guide

## Overview

This project uses **Prisma ORM** with **SQLite**, but you want to use **SQLite Cloud** for your database. Since Prisma's SQLite provider only supports local files (`file:` protocol), we use a **hybrid approach**:

- **Prisma** uses a local SQLite file (`dev.db`) for all operations
- **SQLite Cloud** is used for cloud storage and syncing
- A sync utility allows you to upload your local database to SQLite Cloud

## Current Configuration

Your `.env` file is configured as:

```env
# Prisma uses this local file (required)
DATABASE_URL="file:./prisma/dev.db"

# SQLite Cloud URL (for syncing)
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool"
```

## How It Works

1. **Development**: All Prisma operations (migrations, queries) use the local `dev.db` file
2. **Syncing**: When you want to backup or use SQLite Cloud, run the sync script
3. **Production**: You can sync your local database to SQLite Cloud periodically

## Usage

### 1. Start Development (Local Database)

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (creates local database)
npm run prisma:migrate

# Start server
npm start
```

### 2. Sync to SQLite Cloud

After making changes to your local database, sync to SQLite Cloud:

```bash
npm run sync:cloud
```

**Note**: You may need to implement the actual upload logic in `src/utils/sqliteCloudSync.js` based on SQLite Cloud's API documentation.

### 3. Setup Environment

If you need to reconfigure:

```bash
npm run setup:env
```

## SQLite Cloud Integration

The sync utility (`src/utils/sqliteCloudSync.js`) uses the `@sqlitecloud/drivers` package. You'll need to:

1. Check SQLite Cloud documentation for their API endpoints
2. Implement the actual upload/download logic in the sync utility
3. Add authentication if required (API keys, tokens, etc.)

## Why This Approach?

- **Prisma Limitation**: Prisma's SQLite provider only supports `file:` URLs, not `sqlitecloud://`
- **Best of Both Worlds**: Use Prisma's powerful ORM locally, sync to cloud when needed
- **Flexibility**: You can work offline and sync when ready

## Future Options

1. **Wait for Prisma Support**: Prisma may add SQLite Cloud support in future versions
2. **Use PostgreSQL**: If you need full cloud support, consider switching to PostgreSQL (Prisma fully supports it)
3. **Custom Driver**: Implement a custom Prisma driver adapter (advanced)

## Troubleshooting

### Error: "URL must start with protocol file:"

- Make sure `DATABASE_URL` in `.env` uses `file:./prisma/dev.db`
- Run `npm run setup:env` to fix it automatically

### Database not syncing to SQLite Cloud

- Check `SQLITE_CLOUD_URL` in `.env` is correct
- Implement the upload logic in `sqliteCloudSync.js` based on SQLite Cloud's API
- Check SQLite Cloud dashboard for upload status

## Files

- `src/utils/sqliteCloudSync.js` - Sync utility for SQLite Cloud
- `scripts/sync-to-cloud.js` - Script to run sync
- `scripts/setup-env.js` - Environment setup script

