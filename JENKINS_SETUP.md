# Jenkins Setup Guide

This guide explains how to configure Jenkins to build and publish Android APK and iOS IPA files to GitHub Packages.

## Prerequisites

1. **Jenkins Server** with the following plugins:
   - Pipeline
   - Credentials Binding
   - NodeJS Plugin
   - GitHub Plugin (optional, for better integration)

2. **Build Agents**:
   - **Linux Agent** (for Android builds): Ubuntu/Debian recommended
   - **macOS Agent** (for iOS builds): macOS 12+ with Xcode installed

3. **Required Tools on Linux Agent**:
   - Node.js 18+
   - Java 17 (OpenJDK)
   - Android SDK (Android SDK Platform-Tools, Build-Tools, Platform SDK)
   - Gradle (or use Gradle Wrapper from project)

4. **Required Tools on macOS Agent**:
   - Node.js 18+
   - Xcode (latest version)
   - CocoaPods (`sudo gem install cocoapods`)
   - Xcode Command Line Tools

5. **GitHub Personal Access Token** with the following permissions:
   - `repo` (full control)
   - `write:packages`
   - `read:packages`

## Jenkins Configuration

### Step 1: Configure Credentials

1. Go to **Jenkins Dashboard** > **Manage Jenkins** > **Manage Credentials**
2. Add the following credentials:

   **GitHub Token (Secret text)**:
   - ID: `github-token`
   - Secret: Your GitHub Personal Access Token
   - Description: GitHub token for package publishing

   **GitHub Owner (Secret text)**:
   - ID: `github-owner`
   - Secret: Your GitHub username or organization name
   - Description: GitHub owner/org name

### Step 2: Configure Node.js

1. Go to **Manage Jenkins** > **Global Tool Configuration**
2. Under **NodeJS**, add Node.js installation:
   - Name: `18` (or your preferred version)
   - Version: Select Node.js 18.x or higher
   - Install automatically: ✅

### Step 3: Configure Build Agents

#### Linux Agent (for Android)

1. Install required packages:
```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk nodejs npm

# Install Android SDK
# Option 1: Using Android Studio SDK Manager
# Option 2: Using command line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-*.zip
mkdir -p /opt/android-sdk/cmdline-tools
mv cmdline-tools /opt/android-sdk/cmdline-tools/latest
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses and install required components
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

2. Label the agent as `linux` or `android` in Jenkins agent configuration

#### macOS Agent (for iOS)

1. Install Xcode from Mac App Store
2. Install Xcode Command Line Tools:
```bash
xcode-select --install
```

3. Install CocoaPods:
```bash
sudo gem install cocoapods
```

4. Label the agent as `macos` or `mac` in Jenkins agent configuration

### Step 4: Update Jenkinsfile Variables

Edit the `Jenkinsfile` and update these environment variables if needed:

```groovy
GITHUB_REPO = 'gg_hospital_ticketing_tool' // Your repository name
NODE_VERSION = '18' // Node.js version
ANDROID_HOME = '/opt/android-sdk' // Path to Android SDK
JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64' // Path to Java 17
```

### Step 5: Create Jenkins Pipeline Job

1. Go to **New Item** > **Pipeline**
2. Name: `GG Hospital Ticketing - Build`
3. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: Your repository URL
   - Credentials: Add if repository is private
   - Branch: `*/main` (or your default branch)
   - Script Path: `Jenkinsfile`

4. Click **Save**

## Running the Build

1. Go to your Pipeline job
2. Click **Build Now**
3. Monitor the build progress in the console output

## Build Artifacts

After a successful build, you'll find:

- **Android APK**: `frontend/android/app/build/outputs/apk/release/app-release.apk`
- **iOS IPA**: `frontend/ios/App/build/*.ipa` (if built on macOS)

Artifacts are automatically:
- Archived in Jenkins
- Published to GitHub Packages/Releases

## GitHub Packages Access

To download packages from GitHub Packages:

1. Go to your GitHub repository
2. Click **Releases** to see published builds
3. Download APK/IPA files from the release assets

## Troubleshooting

### Android Build Fails

- **Issue**: `ANDROID_HOME not set`
  - **Solution**: Ensure Android SDK is installed and `ANDROID_HOME` environment variable is set in Jenkins agent configuration

- **Issue**: `Gradle build failed`
  - **Solution**: Check that all required Android SDK components are installed (Platform SDK, Build Tools)

- **Issue**: `Java version mismatch`
  - **Solution**: Ensure Java 17 is installed and `JAVA_HOME` points to Java 17

### iOS Build Fails

- **Issue**: `CocoaPods not found`
  - **Solution**: Install CocoaPods on macOS agent: `sudo gem install cocoapods`

- **Issue**: `Signing required`
  - **Solution**: For distribution, you need to configure code signing in Xcode. For development builds, the pipeline uses `CODE_SIGNING_REQUIRED=NO`

- **Issue**: `No macOS agent available`
  - **Solution**: iOS builds require a macOS agent. Either:
    - Set up a macOS agent
    - Make the iOS build stage optional (modify Jenkinsfile)
    - Use cloud CI/CD services (GitHub Actions, Codemagic, etc.)

### GitHub Packages Upload Fails

- **Issue**: `Authentication failed`
  - **Solution**: Verify GitHub token has `write:packages` permission

- **Issue**: `Release not found`
  - **Solution**: The pipeline creates a release automatically. If it fails, create a release manually first

## Alternative: GitHub Actions

If you don't have Jenkins with macOS agents, consider using GitHub Actions instead. See `BUILD_IOS.md` for GitHub Actions example.

## Notes

- The iOS build stage requires a macOS agent. If you don't have one, you can comment out or make the iOS stage optional.
- For production iOS builds, you'll need proper code signing certificates configured in Xcode.
- The pipeline builds both debug and release APKs for Android, but only publishes the release APK.

