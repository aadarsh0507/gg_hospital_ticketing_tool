# How to Capture the Actual Crash Log

## Method 1: Android Studio Logcat (Recommended)

1. **Open Logcat** in Android Studio (View → Tool Windows → Logcat)

2. **Set up filters:**
   - Click the filter dropdown
   - Select "Edit Filter Configuration"
   - Create a new filter:
     - **Name**: App Crash
     - **Package Name**: `app.netlify.gghospitalsticketingtool.twa`
     - **Log Level**: Error
   - Click OK

3. **Alternative filter:**
   - In the search box, type: `GGHospitalTWA|AndroidRuntime|FATAL`

4. **Clear the log** (trash icon)

5. **Launch the app** from Android Studio

6. **When it crashes**, you should see:
   - Lines starting with `FATAL EXCEPTION`
   - The full stack trace
   - Copy ALL of it

## Method 2: ADB Command Line

1. **Open terminal/command prompt**

2. **Clear log:**
   ```bash
   adb logcat -c
   ```

3. **Start logging with filter:**
   ```bash
   adb logcat | grep -E "GGHospitalTWA|AndroidRuntime|FATAL|app.netlify.gghospitalsticketingtool"
   ```

4. **Launch the app** on your device/emulator

5. **When it crashes**, copy the entire output

## Method 3: Save Full Log to File

```bash
adb logcat -d > crash_log.txt
```

Then search the file for:
- `FATAL EXCEPTION`
- `GGHospitalTWA`
- `app.netlify.gghospitalsticketingtool`

## What the Crash Log Should Look Like:

```
FATAL EXCEPTION: main
Process: app.netlify.gghospitalsticketingtool.twa, PID: 12345
java.lang.RuntimeException: Unable to start activity ComponentInfo{...}
    at android.app.ActivityThread.performLaunchActivity(ActivityThread.java:...)
    at android.app.ActivityThread.handleLaunchActivity(ActivityThread.java:...)
    ...
Caused by: java.lang.NullPointerException
    at app.netlify.gghospitalsticketingtool.twa.LauncherActivity.onCreate(LauncherActivity.java:...)
    ...
```

## Important:

The logs you've been showing are **system logs**, not app logs. We need logs that contain:
- `FATAL EXCEPTION`
- `AndroidRuntime`
- `GGHospitalTWA` (from our logging)
- The package name `app.netlify.gghospitalsticketingtool.twa`

