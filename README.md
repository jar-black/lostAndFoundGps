# Lost and Found GPS Application

A complete full-stack application for finding lost and found items using GPS location. Users can register, post lost/found items, and search for items within 1km of their location.

## Project Structure

```
lostAndFoundGps/
├── backend/          # Node.js/TypeScript/Express API
└── android/          # Native Android application (Kotlin)
```

## Features

### Backend API
- ✅ User authentication with JWT
- ✅ PostgreSQL database with PostGIS for geospatial queries
- ✅ Location-based search (1km radius)
- ✅ Rate limiting (5 items per week per user)
- ✅ Anonymous contact system via email
- ✅ Optimized database indexes for performance
- ✅ RESTful API design
- ✅ Input validation and security

### Android App
- ✅ User registration and login
- ✅ Google Maps integration
- ✅ Current location tracking
- ✅ Display items on map within 1km
- ✅ Add new lost/found items
- ✅ Contact item owners anonymously
- ✅ Firebase Cloud Messaging for push notifications
- ✅ Material Design UI

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ with PostGIS extension
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **Security**: Helmet, CORS

### Android
- **Language**: Kotlin
- **Maps**: Google Maps SDK
- **Location**: Google Play Services Location
- **HTTP Client**: Retrofit with OkHttp
- **Push Notifications**: Firebase Cloud Messaging
- **UI**: Material Design Components
- **Architecture**: MVVM pattern

## Database Schema

### users
- `id` (UUID, primary key)
- `email` (unique, indexed)
- `password_hash`
- `created_at`

### things (lost/found items)
- `id` (UUID, primary key)
- `user_id` (foreign key, indexed)
- `headline`
- `description`
- `latitude`, `longitude`
- `location` (PostGIS geography type, GIST indexed)
- `contact_email`
- `created_at` (indexed)
- `status` (active/resolved, partial indexed)

### user_item_count (rate limiting)
- `user_id`, `week_start_date` (composite primary key, indexed)
- `item_count`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Items (requires authentication)
- `POST /api/things` - Create item (rate limited)
- `GET /api/things/nearby?lat=X&lng=Y&radius=1000` - Get nearby items
- `GET /api/things/:id` - Get item by ID
- `GET /api/things/my-things` - Get user's items
- `PUT /api/things/:id` - Update item
- `DELETE /api/things/:id` - Delete item
- `POST /api/things/:id/contact` - Contact item owner

### Health
- `GET /health` - API health check

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb lost_and_found

# Or using Docker:
docker-compose up -d
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run database migrations:
```bash
npm run build
npm run db:migrate
```

6. Start the server:
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

The API will be available at `http://localhost:3000`

### Android Setup

1. Open `android/` directory in Android Studio

2. Configure Google Maps API:
   - Get API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Add to `AndroidManifest.xml`

3. Configure Firebase:
   - Create project at [Firebase Console](https://console.firebase.google.com/)
   - Download `google-services.json` to `app/` directory
   - Enable Firebase Cloud Messaging

4. Update backend URL in `ApiClient.kt`:
   - Emulator: `http://10.0.2.2:3000/`
   - Device: `http://YOUR_IP:3000/`

5. Sync Gradle and run the app

## Testing the API

Make the test script executable and run it:

```bash
cd backend
chmod +x test-api.sh
./test-api.sh
```

This will test all API endpoints:
1. Health check
2. User registration
3. User login
4. Create item
5. Get nearby items
6. Get item by ID
7. Get user's items
8. Update item
9. Contact owner
10. Rate limiting
11. Delete item

## Performance Optimizations

### Database Indexes
- **GIST index** on `location` column for fast geospatial queries
- **B-tree index** on `email` for fast user lookups
- **B-tree index** on `user_id` for fast user item queries
- **DESC index** on `created_at` for recent items sorting
- **Partial index** on `status='active'` to reduce index size

### Query Optimization
- PostGIS `ST_DWithin` for efficient radius searches
- Composite primary keys for rate limiting lookups
- Automatic location field population via database trigger

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT authentication with expiration
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- CORS and Helmet security headers
- Rate limiting to prevent abuse
- Anonymous email system (no email exposure)

## Rate Limiting

Users can add maximum **5 items per week** (Monday-Sunday). The system tracks this using the `user_item_count` table with weekly resets.

## Push Notifications

The Android app includes Firebase Cloud Messaging setup for receiving notifications when:
- New items are added within 1km of user's location
- Someone contacts the user about their item
- System announcements

## Development Notes

### Backend
- TypeScript for type safety
- Async/await for database operations
- Error handling middleware
- Structured logging
- Environment-based configuration

### Android
- Kotlin coroutines for async operations
- View binding for type-safe view access
- Lifecycle-aware components
- Secure token storage
- Material Design 3

## Future Enhancements

- [ ] Real-time notifications backend integration
- [ ] Image upload for items
- [ ] Search filters (date, category, etc.)
- [ ] User profiles and ratings
- [ ] Item categories
- [ ] Admin dashboard
- [ ] Email verification
- [ ] Password reset
- [ ] Social media sharing
- [ ] Item expiration dates

## License

See [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Backend issues: See `backend/README.md`
- Android issues: See `android/README.md`
