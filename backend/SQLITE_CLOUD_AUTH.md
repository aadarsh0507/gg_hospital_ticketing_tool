# SQLite Cloud Authentication Setup

## Required Configuration

SQLite Cloud requires authentication. You need to add one of the following to your `.env` file:

### Option 1: API Key (Recommended)
```env
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool"
SQLITE_CLOUD_APIKEY="your-api-key-here"
```

### Option 2: Token
```env
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool"
SQLITE_CLOUD_TOKEN="your-token-here"
```

### Option 3: Username/Password
```env
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool"
SQLITE_CLOUD_USERNAME="your-username"
SQLITE_CLOUD_PASSWORD="your-password"
```

### Option 4: In Connection String
You can also include the API key or token directly in the connection string:
```env
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool?apikey=your-api-key"
# OR
SQLITE_CLOUD_URL="sqlitecloud://cdzimws7dz.g3.sqlite.cloud:8860/ticketinf tool?token=your-token"
```

## How to Get Your Credentials

1. Log in to your SQLite Cloud dashboard
2. Navigate to your project/cluster settings
3. Find your API key, token, or create credentials
4. Add them to your `.env` file

## After Adding Credentials

1. Restart your server:
   ```bash
   npm start
   ```

2. The server will automatically initialize the database schema on startup

3. All data will now be stored directly in SQLite Cloud! ☁️

