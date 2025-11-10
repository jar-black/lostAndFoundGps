# Lost and Found GPS - Backend API

Node.js/TypeScript/Express backend with PostgreSQL and PostGIS for location-based queries.

## Features

- User authentication with JWT
- Lost/found item management
- Location-based search (1km radius)
- Rate limiting (5 items per week per user)
- Anonymous contact system via email
- Optimized database indexes for performance

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:
```bash
createdb lost_and_found
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run database migrations:
```bash
npm run build
npm run db:migrate
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Things (Lost/Found Items)
All endpoints require `Authorization: Bearer <token>` header

- `POST /api/things` - Create new item
- `GET /api/things/nearby?lat=X&lng=Y&radius=1000` - Get nearby items
- `GET /api/things/:id` - Get item by ID
- `GET /api/things/my-things` - Get user's own items
- `PUT /api/things/:id` - Update item
- `DELETE /api/things/:id` - Delete item
- `POST /api/things/:id/contact` - Send anonymous message to item owner

### Health Check
- `GET /health` - API health status

## Database Schema

See `src/config/migrate.ts` for complete schema with indexes.

## Testing

The API can be tested with curl, Postman, or any HTTP client.
