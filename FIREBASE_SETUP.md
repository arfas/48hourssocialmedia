# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter a project name (e.g., "48-Hour-Friendships")
4. Accept terms and click "Create project"
5. Wait for the project to be created

## Step 2: Create a Web App

1. In the Firebase Console, click the gear icon (⚙) → "Project settings"
2. Under "Your apps", click "Web" (or the "</>" icon)
3. Enter an app nickname (e.g., "Web App")
4. Copy the configuration object

## Step 3: Update .env.local

Copy these values from the Firebase config into your `.env.local` file:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 4: Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. **IMPORTANT: Choose "Start in test mode"** (for development)
4. Select your region and create
5. **Verify the database is created** - you should see a "Database" section

## Step 5: Restart Dev Server

After updating `.env.local`, restart the dev server:

```bash
npm run dev
```

---

## ⚠️ Troubleshooting: Data Not Saving

### Error: "Permission denied" 

**Solution:** Your Firestore is not in test mode or rules are too restrictive.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project → **Firestore Database** → **Rules** tab
3. Replace all rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click **Publish**

### Data saves but doesn't appear

1. Open Firebase Console → Firestore Database
2. You should see collections: `users`, `matches`, `messages`
3. Click each to verify data exists
4. If empty, check browser console (F12) for errors

### How to Debug

1. Press **F12** in browser → **Console** tab
2. Fill out onboarding and click "Find a Friend"
3. Look for error messages in red
4. Take a screenshot of any errors

---

## Collections Structure

Firestore will automatically create these collections when you use the app:


### `users` collection
```
{
  id: string,
  name: string,
  vibe: string,
  interests: string[],
  communication_style: string,
  is_matched: boolean,
  created_at: Timestamp
}
```

### `matches` collection
```
{
  id: string,
  user1_id: string,
  user2_id: string,
  created_at: Timestamp,
  expires_at: Timestamp,
  is_active: boolean
}
```

### `messages` collection
```
{
  id: string,
  match_id: string,
  sender_id: string,
  content: string,
  created_at: Timestamp
}
```

## Troubleshooting

**Error: "Firebase is not configured properly!"**
- Check that `.env.local` has all the required Firebase credentials
- Restart the dev server after updating `.env.local`

**Error: "Permission denied" when creating user**
- Make sure your Firestore Database is in "Test mode"
- Go to Firestore → Rules and make sure it allows read/write

**No match found**
- Make sure multiple users exist in the database first
- Try creating a second user profile to match with

## Security Rules for Production

When deploying to production, replace test mode with these Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /matches/{matchId} {
      allow read, write: if request.auth.uid in resource.data.user1_id || request.auth.uid in resource.data.user2_id;
    }
    match /messages/{messageId} {
      allow read: if request.auth.uid == resource.data.sender_id;
      allow write: if request.auth.uid == request.resource.data.sender_id;
    }
  }
}
```
