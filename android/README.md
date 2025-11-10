# Lost and Found GPS - Android App

Native Android application built with Kotlin for finding lost and found items.

## Features

- User authentication (login/register)
- Google Maps integration with current location
- View lost/found items within 1km radius
- Add new items with GPS coordinates
- Contact item owners anonymously
- Push notifications for nearby items
- Rate limiting (5 items per week)

## Prerequisites

- Android Studio Arctic Fox or later
- Android SDK 24+ (Android 7.0+)
- Google Maps API Key
- Firebase project (for push notifications)

## Setup

1. Open the project in Android Studio

2. Configure Google Maps API Key:
   - Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Add the key to `app/src/main/AndroidManifest.xml`:
     ```xml
     <meta-data
         android:name="com.google.android.geo.API_KEY"
         android:value="YOUR_GOOGLE_MAPS_API_KEY" />
     ```

3. Configure Firebase (for push notifications):
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Download `google-services.json` and place it in `app/` directory
   - Enable Firebase Cloud Messaging in your Firebase project

4. Update Backend URL:
   - Open `app/src/main/java/com/lostandfound/api/ApiClient.kt`
   - Change `BASE_URL` to your backend server URL
     - For emulator: `http://10.0.2.2:3000/`
     - For real device: `http://YOUR_IP:3000/`

5. Sync Gradle and build the project

## Running the App

1. Connect an Android device or start an emulator
2. Click "Run" in Android Studio
3. The app will launch on your device

## App Structure

```
app/src/main/java/com/lostandfound/
├── activities/          # UI screens
│   ├── LoginActivity
│   ├── RegisterActivity
│   ├── MainActivity     # Map view
│   ├── AddItemActivity
│   └── ItemDetailActivity
├── api/                 # API service and client
├── models/              # Data models
├── services/            # Background services (FCM)
└── utils/               # Utilities (TokenManager)
```

## Testing

1. Register a new account
2. Grant location permissions
3. View nearby items on the map
4. Add a new lost/found item
5. Tap markers to view details
6. Contact owners anonymously

## Notes

- Location permissions are required for the app to function
- The app uses 1km radius for nearby searches
- Rate limiting: Maximum 5 items per week per user
- Push notifications require Firebase setup
