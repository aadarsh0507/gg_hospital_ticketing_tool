# iOS Build Instructions

## ⚠️ Important: macOS Required

iOS apps **CANNOT** be built on Windows. You need:
- **macOS** (Mac computer or Mac virtual machine)
- **Xcode** (latest version from Mac App Store)
- **Apple Developer Account** (for device testing and App Store)

## Build Options from Windows

### Option 1: Use a Mac Computer
If you have access to a Mac, follow the steps below.

### Option 2: Cloud Build Services
Use cloud-based CI/CD services that provide macOS build environments:
- **Codemagic** (https://codemagic.io) - Free tier available
- **AppCircle** (https://appcircle.io) - Free tier available
- **Bitrise** (https://www.bitrise.io) - Free tier available
- **GitHub Actions** - Free for public repos, paid for private

### Option 3: macOS Virtual Machine
Run macOS in a VM (requires Apple hardware or Hackintosh setup - not recommended for production)

---

## Build Steps (On macOS)

### Prerequisites
1. Install Xcode from Mac App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

### Step 1: Navigate to Project
```bash
cd frontend
```

### Step 2: Sync Capacitor
```bash
npm run cap:sync
```

### Step 3: Install iOS Dependencies
```bash
cd ios/App
pod install
cd ../..
```

### Step 4: Open in Xcode
```bash
npm run cap:open:ios
```

Or manually:
```bash
cd ios/App
open App.xcworkspace
```

**⚠️ Important:** Always open `App.xcworkspace`, NOT `App.xcodeproj`

### Step 5: Configure Signing in Xcode

1. In Xcode, click on **"App"** project in left sidebar
2. Select **"App"** target
3. Go to **"Signing & Capabilities"** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (Apple Developer account)
6. Xcode will automatically set the Bundle Identifier

### Step 6: Build for Simulator

1. Select a simulator from device dropdown (e.g., "iPhone 15 Pro")
2. Click **Play** button (▶️) or press `Cmd + R`
3. Wait for build to complete
4. App will launch in simulator

### Step 7: Build for Physical Device

1. Connect iPhone/iPad via USB
2. Select your device from device dropdown
3. Click **Play** button (▶️) or press `Cmd + R`
4. On your device: **Settings > General > VPN & Device Management**
5. Trust the developer certificate
6. App will install and launch

### Step 8: Create Archive (for Distribution)

1. Select **"Any iOS Device"** or **"Generic iOS Device"** from device dropdown
2. Menu: **Product > Archive**
3. Wait for archive to complete
4. **Organizer** window will open
5. Click **"Distribute App"**
6. Choose distribution method:
   - **App Store Connect** - For App Store submission
   - **Ad Hoc** - For specific registered devices
   - **Enterprise** - For enterprise distribution
   - **Development** - For testing

---

## Command Line Build (Advanced)

### Build for Simulator
```bash
cd frontend/ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  build
```

### Build for Device
```bash
cd frontend/ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -archivePath ./build/App.xcarchive \
  archive
```

### Export IPA
```bash
xcodebuild -exportArchive \
  -archivePath ./build/App.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist ExportOptions.plist
```

---

## Using GitHub Actions (CI/CD)

Create `.github/workflows/ios-build.yml`:

```yaml
name: Build iOS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    
    - name: Sync Capacitor
      run: |
        cd frontend
        npm run cap:sync
    
    - name: Install CocoaPods
      run: |
        cd frontend/ios/App
        pod install
    
    - name: Build iOS
      run: |
        cd frontend/ios/App
        xcodebuild -workspace App.xcworkspace \
          -scheme App \
          -configuration Release \
          -sdk iphoneos \
          -archivePath ./build/App.xcarchive \
          archive
```

---

## Troubleshooting

### "No such module 'Capacitor'"
```bash
cd frontend/ios/App
pod install
```

### "Signing for 'App' requires a development team"
- Go to Xcode > Signing & Capabilities
- Select your Apple Developer team
- Or create a free Apple ID for development

### "Unable to boot simulator"
- Open Xcode > Preferences > Components
- Download required simulators

### Build fails with network errors
- Check `Info.plist` has `NSAppTransportSecurity` configured
- Verify Netlify URL is accessible

---

## Project Configuration

- **Bundle ID:** `com.gghospital.ticketing`
- **App Name:** `GG Hospital Ticketing`
- **Netlify URL:** `https://gghospitalsticketingtool.netlify.app`
- **Min iOS Version:** iOS 13+ (default)

---

## Next Steps

Once you have macOS access:
1. Follow steps 1-8 above
2. Test on simulator first
3. Test on physical device
4. Create archive for distribution
5. Submit to App Store (if desired)

