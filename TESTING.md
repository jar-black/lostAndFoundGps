# Testing Guide for Lost and Found GPS Application

This document provides comprehensive testing instructions for both the backend API and Android application.

## Prerequisites

### Backend Testing
- PostgreSQL 14+ with PostGIS extension
- Node.js 18+
- curl or Postman

### Android Testing
- Android device or emulator (Android 7.0+)
- Google Maps API key
- Firebase project (for notifications)

## Backend API Testing

### 1. Database Setup

```bash
# Start PostgreSQL with PostGIS (from repository root)
docker-compose up -d

# Or use existing PostgreSQL
createdb lost_and_found
```

### 2. Install Dependencies and Migrate

```bash
cd backend
npm install
npm run build
npm run db:migrate
```

Expected output:
```
✓ PostGIS extension enabled
✓ Users table created
✓ Users email index created
✓ Things table created
✓ Things location GIST index created
✓ Things user_id index created
✓ Things created_at index created
✓ Things status partial index created
✓ User item count table created
✓ User item count index created
✓ Location trigger created
✅ Database migration completed successfully!
```

### 3. Start the Server

```bash
npm run dev
```

Expected output:
```
🚀 Server is running on port 3000
📍 Health check: http://localhost:3000/health
🔐 Auth endpoints: http://localhost:3000/api/auth
📦 Things endpoints: http://localhost:3000/api/things
```

### 4. Run Automated Tests

```bash
chmod +x test-api.sh
./test-api.sh
```

### 5. Manual API Testing

#### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-15T10:00:00.000Z"}
```

#### Test 2: Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response (201):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Test 3: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response (200): Same as registration

#### Test 4: Create Item (use token from login)
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/things \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "headline": "Lost Blue Backpack",
    "description": "Blue backpack with laptop inside, lost near Central Park",
    "latitude": 40.785091,
    "longitude": -73.968285
  }'
```

Expected response (201):
```json
{
  "message": "Item created successfully",
  "thing": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "headline": "Lost Blue Backpack",
    "description": "Blue backpack with laptop inside, lost near Central Park",
    "latitude": 40.785091,
    "longitude": -73.968285,
    "contact_email": "test@example.com",
    "created_at": "2024-01-15T10:00:00.000Z",
    "status": "active"
  }
}
```

#### Test 5: Get Nearby Items
```bash
curl -X GET "http://localhost:3000/api/things/nearby?lat=40.785091&lng=-73.968285&radius=1000" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response (200):
```json
{
  "count": 1,
  "things": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "headline": "Lost Blue Backpack",
      "description": "Blue backpack with laptop inside, lost near Central Park",
      "latitude": 40.785091,
      "longitude": -73.968285,
      "distance": 0,
      ...
    }
  ]
}
```

#### Test 6: Rate Limiting (Create 6 items in same week)
```bash
# Create 5 items successfully, 6th should fail with 429
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/things \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"headline\": \"Test Item $i\",
      \"description\": \"Test description $i\",
      \"latitude\": 40.785091,
      \"longitude\": -73.968285
    }"
  echo ""
done
```

Expected: First 5 succeed (201), 6th fails with:
```json
{
  "error": "Rate limit exceeded. You can only add 5 items per week."
}
```

## Android App Testing

### 1. Configure the App

1. Add Google Maps API key to `AndroidManifest.xml`
2. Download `google-services.json` from Firebase
3. Update backend URL in `ApiClient.kt`
4. Sync Gradle

### 2. Build and Install

```bash
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 3. Test Scenarios

#### Scenario 1: User Registration
1. Launch app
2. Tap "Don't have an account? Register"
3. Enter email and password (min 6 characters)
4. Tap "Register"
5. **Expected**: Successful registration, navigate to map

#### Scenario 2: User Login
1. Launch app
2. Enter registered email and password
3. Tap "Login"
4. **Expected**: Successful login, navigate to map

#### Scenario 3: View Map and Location
1. After login, grant location permission
2. **Expected**:
   - Map loads
   - Blue dot shows current location
   - Camera moves to current location

#### Scenario 4: Add Lost/Found Item
1. On map screen, tap FAB (+ button)
2. Enter headline and description
3. **Expected**: Current location displayed
4. Tap "Add Item"
5. **Expected**: Item created, return to map

#### Scenario 5: View Nearby Items
1. On map screen, tap "Refresh"
2. **Expected**: Markers appear on map for nearby items
3. Tap a marker
4. **Expected**: Info window shows headline and snippet

#### Scenario 6: View Item Details and Contact
1. Tap a marker on map
2. Item detail screen opens
3. Tap "Contact Owner"
4. Enter message
5. Tap "Send"
6. **Expected**: Message sent successfully (if email configured)

#### Scenario 7: Rate Limiting
1. Try to add 6 items in same week
2. **Expected**:
   - First 5 succeed
   - 6th shows error: "Rate limit exceeded"

#### Scenario 8: Logout
1. Tap "Logout" button
2. **Expected**: Return to login screen

## Performance Testing

### Database Query Performance

Test the GIST index effectiveness:

```sql
-- Without index (slow)
EXPLAIN ANALYZE
SELECT * FROM things
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-73.968285, 40.785091), 4326)::geography,
  1000
);

-- Should show "Index Scan using idx_things_location_gist"
-- Execution time should be < 10ms for 10,000 records
```

### Load Testing

Use Apache Bench or similar:

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test authenticated endpoint
ab -n 100 -c 5 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/things/nearby?lat=40.785091&lng=-73.968285
```

## Common Issues and Solutions

### Backend Issues

**Issue**: Database connection failed
- **Solution**: Ensure PostgreSQL is running and credentials in `.env` are correct

**Issue**: PostGIS not available
- **Solution**: Install PostGIS extension: `CREATE EXTENSION postgis;`

**Issue**: Email sending fails
- **Solution**: Configure email settings in `.env` or skip contact tests

**Issue**: Rate limiting not working
- **Solution**: Check `user_item_count` table exists and is properly indexed

### Android Issues

**Issue**: Map not loading
- **Solution**: Check Google Maps API key is valid and enabled

**Issue**: Location not available
- **Solution**: Grant location permissions and enable GPS

**Issue**: API calls failing
- **Solution**: Check backend URL in `ApiClient.kt` matches server

**Issue**: Push notifications not working
- **Solution**: Verify `google-services.json` is in `app/` directory

## Code Quality Checks

### Backend

```bash
# Type checking
npm run build

# Run linter (if configured)
npm run lint
```

### Android

```bash
# Build check
./gradlew build

# Run lint
./gradlew lint
```

## Security Testing

### Test Cases

1. **SQL Injection**: Try SQL in inputs
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin'\'' OR 1=1--","password":"test"}'
   ```
   Expected: Treated as literal string, login fails

2. **JWT Manipulation**: Modify token
   - Expected: 401 Unauthorized

3. **CORS**: Call from different origin
   - Expected: Properly handled by CORS middleware

4. **Rate Limiting**: Exceed 5 items/week
   - Expected: 429 Too Many Requests

## Test Coverage Summary

### Backend
- ✅ User registration with validation
- ✅ User login with authentication
- ✅ JWT token generation and verification
- ✅ Create item with rate limiting
- ✅ Geospatial search with PostGIS
- ✅ Item CRUD operations
- ✅ Anonymous contact system
- ✅ Input validation
- ✅ Error handling
- ✅ Database indexes

### Android
- ✅ User authentication flow
- ✅ Google Maps integration
- ✅ Location services
- ✅ API communication
- ✅ Token management
- ✅ UI/UX flows
- ✅ Error handling
- ✅ FCM setup (requires Firebase)

## Conclusion

All API endpoints have been implemented and can be tested using the provided scripts and manual commands. The Android app provides a complete user interface for all features.

For production deployment, ensure:
- Environment variables are properly configured
- Database is properly backed up
- Email service is configured
- Firebase project is set up for push notifications
- Google Maps API has proper restrictions
- SSL/TLS is enabled
- Rate limiting is monitored
