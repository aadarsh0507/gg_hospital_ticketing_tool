# How to Get SQLite Cloud Credentials

## The Problem
SQLite Cloud requires authentication to connect. You need to provide one of:
- **API Key** (recommended)
- **Token**
- **Username and Password**

## How to Get Your Credentials

### Option 1: Check Your SQLite Cloud Dashboard

1. **Log in** to your SQLite Cloud account at: https://sqlitecloud.io (or your provider's dashboard)

2. **Navigate to your project/cluster:**
   - Find the project: `cdzimws7dz.g3.sqlite.cloud`
   - Or database: `ticketinf tool`

3. **Look for API Keys or Credentials:**
   - Go to **Settings** or **API Keys** section
   - Look for **Authentication** or **Credentials**
   - You might see:
     - API Key
     - Access Token
     - Username/Password

4. **Copy the credentials** and add to your `.env` file

### Option 2: Create New Credentials

1. In your SQLite Cloud dashboard
2. Go to **API Keys** or **Credentials** section
3. Click **Create New API Key** or **Generate Token**
4. Copy the generated key/token
5. Add to your `.env` file

### Option 3: Check Connection String Format

Some SQLite Cloud services allow credentials in the connection string:

```env
# With API Key in URL
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool?apikey=YOUR_API_KEY"

# With Token in URL
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool?token=YOUR_TOKEN"
```

## Add to .env File

Once you have your credentials, add to `backend/.env`:

```env
# Option 1: API Key (Recommended)
SQLITE_CLOUD_APIKEY="your-api-key-here"

# Option 2: Token
SQLITE_CLOUD_TOKEN="your-token-here"

# Option 3: Username/Password
SQLITE_CLOUD_USERNAME="your-username"
SQLITE_CLOUD_PASSWORD="your-password"
```

## Current Status

**Right now:** The app is using a **local SQLite database** as a fallback. This works, but data is stored locally, not in SQLite Cloud.

**After adding credentials:** The app will automatically switch to SQLite Cloud and store all data there.

## Test Connection

After adding credentials, restart the server:

```bash
cd backend
npm start
```

You should see:
- ✅ `Connected to SQLite Cloud` (instead of fallback message)
- ✅ `Database schema initialized in SQLite Cloud`

## Need Help?

If you can't find your credentials:
1. Check your SQLite Cloud account email for setup instructions
2. Contact SQLite Cloud support
3. Check your SQLite Cloud dashboard documentation

