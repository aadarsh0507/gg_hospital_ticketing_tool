# Android Debug Build Instructions

## Important: Debug vs Release Keystores

When building a debug APK, Android uses a **debug keystore** with a different SHA-256 fingerprint than the release keystore. The `assetlinks.json` file currently has the release keystore fingerprint.

## To Fix the Crash:

### Option 1: Get Debug Keystore Fingerprint (Recommended for Testing)

1. Find your debug keystore (usually at `~/.android/debug.keystore` on Mac/Linux or `C:\Users\YourUsername\.android\debug.keystore` on Windows)

2. Get the SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

3. Copy the SHA-256 fingerprint and add it to `public/.well-known/assetlinks.json`:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "app.netlify.gghospitalsticketingtool.twa",
       "sha256_cert_fingerprints": [
         "RELEASE_FINGERPRINT_HERE",
         "DEBUG_FINGERPRINT_HERE"
       ]
     }
   }]
   ```

4. Redeploy to Netlify so the updated assetlinks.json is available

### Option 2: Use Release Build for Testing

Build a release APK instead of debug:
```bash
./gradlew assembleRelease
```

### Option 3: Disable TWA Verification (Development Only)

For development, you can temporarily disable strict verification, but this is NOT recommended for production.

## Current Status

- ✅ Web manifest is accessible
- ✅ Asset links file is accessible  
- ✅ All resources are present
- ⚠️ Debug keystore fingerprint may not match

## Next Steps

1. Check Logcat in Android Studio for the exact error
2. Get debug keystore fingerprint and add to assetlinks.json
3. Clean and rebuild the project
4. Test again

