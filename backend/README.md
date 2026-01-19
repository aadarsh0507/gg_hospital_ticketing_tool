# Ticketing Tool Backend API

Backend API for the ticketing/request management system built with Node.js, Express, and PostgreSQL.

## Features

- 🔐 User authentication (JWT)
- 📋 Request management (CRUD operations)
- 📊 Dashboard statistics and metrics
- 📍 Location and department management
- 🏆 Leaderboard system
- 🔗 Request link generation
- 📈 Analytics and reporting

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ticketing_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

3. **Set up the database:**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

4. **Start the development server:**
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (Protected)

### Requests
- `GET /api/requests` - Get all requests (Staff/Admin)
- `GET /api/requests/my-requests` - Get my requests
- `GET /api/requests/:id` - Get request by ID
- `POST /api/requests` - Create a new request
- `PUT /api/requests/:id` - Update a request
- `DELETE /api/requests/:id` - Delete a request (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Locations
- `GET /api/locations` - Get all locations
- `GET /api/locations/blocks` - Get all blocks
- `GET /api/locations/departments` - Get all departments
- `POST /api/locations` - Create location (Admin)
- `POST /api/locations/blocks` - Create block (Admin)
- `POST /api/locations/departments` - Create department (Admin)

### Metrics
- `GET /api/metrics` - Get request metrics (with optional `days` query param)

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard (with optional `month`, `year`, `department` query params)

### Request Links
- `POST /api/request-links` - Create request link (Protected)
- `GET /api/request-links/:token` - Get request link by token (Public)
- `POST /api/request-links/:token/submit` - Submit request via link (Public)

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:
- Users (with roles: ADMIN, STAFF, REQUESTER)
- Requests (with statuses and SLA tracking)
- Locations (Blocks, Areas, Rooms)
- Departments
- Request Activities (audit log)
- Achievements (for leaderboard)
- Request Links (for external request creation)

## Development

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio to view/edit database

## Security

- JWT authentication for protected routes
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation with express-validator

## License

ISC

