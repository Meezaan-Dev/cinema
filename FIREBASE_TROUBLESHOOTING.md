# Firebase Authentication Error - Troubleshooting Guide

## Error: CONFIGURATION_NOT_FOUND

**Error Message:**
```
GET https://identitytoolkit.googleapis.com/v1/projects?key=... 400 (Bad Request)
AppError: Firebase: Error (auth/configuration-not-found).
```

This error occurs when Firebase cannot validate the project configuration for your API key.

---

## Common Causes & Solutions

### ✅ Solution 1: Enable Google Sign-In in Firebase Console

1. Go to **[Firebase Console](https://console.firebase.google.com)**
2. Select project **`absolute-cinema-8e09f`**
3. Click **Authentication** (left sidebar)
4. Click **Sign-in method** tab
5. Click **Google** provider
6. Toggle **Enable** (switch should be ON / blue)
7. Set Project name (e.g., "Absolute Cinema")
8. Set Support email
9. Click **Save**

**Status:** You should see a green checkmark ✓ next to Google

---

### ✅ Solution 2: Fix API Key Restrictions

1. Go to **Firebase Console** → **Project Settings** (gear icon)
2. Click **API keys** tab
3. Find the Web API key ending in `...7M6k`
4. Click on it to open details
5. Check **Application restrictions**:
   - If set to "IP addresses": Switch to **"HTTP referrers (websites)"`
   - If set to "HTTP referrers (websites)": Add these referrers:
     ```
     http://localhost
     http://localhost:*
     http://127.0.0.1:*
     ```
   - If empty/unrestricted: Leave as is (or keep localhost entries)

6. Click **Save**
7. **Wait 1-2 minutes** for changes to propagate

---

### ✅ Solution 3: Verify Environment Variables

Check that your `.env` file has the correct format:

```bash
# All 8 variables MUST be present and non-empty
VITE_FIREBASE_API_KEY=AIzaSyBThT2gJ4TszVtog44RQeQXgOY_Qkw7M6k
VITE_FIREBASE_AUTH_DOMAIN=absolute-cinema-8e09f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=absolute-cinema-8e09f
VITE_FIREBASE_STORAGE_BUCKET=absolute-cinema-8e09f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=8447271641
VITE_FIREBASE_APP_ID=1:8447271641:web:aa12e24e66a09c6bc394c8
```

**Vite Special:** Environment variables must start with `VITE_` to be available in client code.

Run this to verify:
```bash
grep VITE_FIREBASE .env | wc -l
# Should output: 6
```

---

### ✅ Solution 4: Clear Browser Cache & Restart Dev Server

```bash
# Stop the dev server (Ctrl+C)

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

Then **completely clear your browser cache**:
- **Chrome:** DevTools → Application tab → Clear site data
- **Firefox:** Right-click page → Inspect → Storage → Delete All
- **Safari:** Develop → Empty Web Caches

Reload the page at `http://localhost:5173`

---

### ✅ Solution 5: Check Firestore Rules (if using)

In **Firebase Console** → **Firestore Database** → **Rules** tab, rules should allow read/write for authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Debugging Steps

### Step 1: Check Browser Console for Full Error

1. Open browser DevTools (F12)
2. Click **Console** tab
3. Look for the full error message (might show more details)
4. Take a screenshot and include it when asking for help

### Step 2: Verify Firebase is Loaded

In browser console, run:
```javascript
console.log(typeof firebase) // Should be 'object'
console.log(firebase?.apps?.length) // Should be > 0
```

### Step 3: Check API Key Validity

Run this in browser console:
```javascript
fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${import.meta.env.VITE_FIREBASE_API_KEY}`)
  .then(r => r.json())
  .then(d => console.log('Response:', d))
  .catch(e => console.log('Error:', e))
```

Should return project details, not a 400 error.

### Step 4: Enable Verbose Logging

Add this to `src/lib/firebaseClient.ts` for debugging:

```typescript
// Add after config definition
console.log('🔥 Firebase Config:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
  isConfigured: isFirebaseConfigured,
})
```

---

## Still Getting the Error?

Try these additional steps:

### Option A: Use Firebase Emulator (Development Only)

Modify `.env`:
```bash
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
```

Then start emulator:
```bash
npm install -g firebase-tools
firebase emulators:start
```

In another terminal:
```bash
npm run dev
```

### Option B: Create New Firebase API Key

1. Go to **Firebase Console** → **Project Settings** → **API keys**
2. Click **Create API Key**
3. Select **Browser key**
4. In restrictions:
   - Select **HTTP referrers (websites)**
   - Add: `http://localhost:*`
5. Copy the new key to `.env`:
   ```bash
   VITE_FIREBASE_API_KEY=<new-key>
   ```
6. Restart dev server

### Option C: Regenerate Firebase Credentials

If the above doesn't work, your Firebase project setup might be corrupted:

1. Go to **Firebase Console**
2. Create a new project (or use existing)
3. Enable **Google authentication**
4. Create a **new web app** in project settings
5. Copy ALL environment variables from the setup wizard
6. Replace `.env` values with fresh credentials
7. Restart dev server

---

## Success Indicators

After applying fixes, you should see:
- ✅ No 400 errors in console
- ✅ Google Sign-In button appears
- ✅ Clicking button opens Google auth popup
- ✅ After login, you can see watchlists
- ✅ No `CONFIGURATION_NOT_FOUND` errors

---

## Still Stuck?

Create an issue with:
1. Screenshot of error in browser console
2. Output of: `grep VITE_FIREBASE .env`
3. Screenshot of Firebase Console → Authentication → Sign-in providers
4. Screenshot of Firebase Console → Project Settings → API keys (show referrers)
5. Output of: `npm run build` (to verify no build issues)

---

## Reference Links

- [Firebase Setup Guide](https://firebase.google.com/docs/web/setup)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Google Sign-In Setup](https://developers.google.com/identity/sign-in/web)
