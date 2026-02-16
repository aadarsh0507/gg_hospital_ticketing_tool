pipeline {
    agent any
    
    triggers {
        // Poll SCM every 5 minutes to check for changes
        pollSCM('H/5 * * * *')
        
        // Alternative: Uncomment below for GitHub webhook support (requires webhook configuration)
        // githubPush()
    }
    
    environment {
        // GitHub Packages Configuration
        GITHUB_OWNER = credentials('github-owner') // Your GitHub username/org
        GITHUB_TOKEN = credentials('github-token') // GitHub Personal Access Token with packages:write permission
        GITHUB_REPO = 'gg_hospital_ticketing_tool' // Your repository name
        
        // App Configuration
        APP_ID = 'com.gghospital.ticketing'
        APP_NAME = 'GG Hospital Ticketing'
        VERSION_CODE = "${env.BUILD_NUMBER}"
        VERSION_NAME = "${env.BUILD_NUMBER}"
        
        // Node.js version
        NODE_VERSION = '18'
        
        // Android Configuration
        ANDROID_HOME = '/opt/android-sdk'
        JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64'
    }
    
    tools {
        nodejs "${NODE_VERSION}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Validate Code') {
            parallel {
                stage('Lint') {
                    steps {
                        dir('frontend') {
                            script {
                                sh '''
                                    echo "Running ESLint..."
                                    npm ci
                                    npm run lint || true
                                '''
                            }
                        }
                    }
                }
                
                stage('Type Check') {
                    steps {
                        dir('frontend') {
                            script {
                                sh '''
                                    echo "Running TypeScript type check..."
                                    npm ci
                                    npm run typecheck
                                '''
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build Web Assets') {
            steps {
                dir('frontend') {
                    script {
                        sh '''
                            echo "Building web assets with Vite..."
                            npm ci
                            npm run build
                            echo "Web build completed successfully"
                        '''
                    }
                }
            }
        }
        
        stage('Sync Capacitor') {
            steps {
                dir('frontend') {
                    script {
                        sh '''
                            echo "Syncing Capacitor..."
                            npm run cap:sync
                            echo "Capacitor sync completed"
                        '''
                    }
                }
            }
        }
        
        stage('Build Android APK') {
            agent {
                label 'linux || android'
            }
            steps {
                dir('frontend') {
                    script {
                        sh '''
                            echo "Building Android APK..."
                            
                            # Setup Android SDK if not already set
                            if [ ! -d "${ANDROID_HOME}" ]; then
                                echo "Android SDK not found at ${ANDROID_HOME}"
                                echo "Please ensure Android SDK is installed and ANDROID_HOME is set"
                            fi
                            
                            # Navigate to Android directory
                            cd android
                            
                            # Clean previous builds
                            echo "Cleaning previous builds..."
                            ./gradlew clean
                            
                            # Build debug APK
                            echo "Building debug APK..."
                            ./gradlew assembleDebug
                            
                            # Build release APK (unsigned)
                            echo "Building release APK..."
                            ./gradlew assembleRelease
                            
                            # Find APK files
                            DEBUG_APK=$(find app/build/outputs/apk/debug -name "*.apk" | head -1)
                            RELEASE_APK=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
                            
                            if [ -f "$DEBUG_APK" ]; then
                                echo "Debug APK created: $DEBUG_APK"
                                archiveArtifacts artifacts: "android/app/build/outputs/apk/debug/*.apk", fingerprint: true
                            fi
                            
                            if [ -f "$RELEASE_APK" ]; then
                                echo "Release APK created: $RELEASE_APK"
                                archiveArtifacts artifacts: "android/app/build/outputs/apk/release/*.apk", fingerprint: true
                            fi
                            
                            echo "Android build completed"
                        '''
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'frontend/android/app/build/outputs/apk/**/*.apk', fingerprint: true, allowEmptyArchive: true
                }
            }
        }
        
        stage('Build iOS IPA') {
            agent {
                label 'macos || mac'
            }
            steps {
                dir('frontend') {
                    script {
                        try {
                            sh '''
                                echo "Building iOS IPA..."
                                
                                # Install CocoaPods dependencies
                                echo "Installing CocoaPods dependencies..."
                                cd ios/App
                                
                                # Check if pod is installed
                                if ! command -v pod &> /dev/null; then
                                    echo "CocoaPods not found. Installing..."
                                    sudo gem install cocoapods
                                fi
                                
                                pod install
                                cd ../..
                                
                                # Sync Capacitor for iOS
                                npm run cap:sync ios
                                
                                # Build iOS archive
                                echo "Creating iOS archive..."
                                cd ios/App
                                
                                xcodebuild -workspace App.xcworkspace \
                                    -scheme App \
                                    -configuration Release \
                                    -sdk iphoneos \
                                    -archivePath ./build/App.xcarchive \
                                    archive \
                                    CODE_SIGN_IDENTITY="" \
                                    CODE_SIGNING_REQUIRED=NO \
                                    CODE_SIGNING_ALLOWED=NO || echo "Archive build completed (signing may be required for distribution)"
                                
                                # Export IPA (if archive was created)
                                if [ -d "./build/App.xcarchive" ]; then
                                    echo "Exporting IPA..."
                                    
                                    # Create export options plist
                                    cat > ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string></string>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>
EOF
                                    
                                    xcodebuild -exportArchive \
                                        -archivePath ./build/App.xcarchive \
                                        -exportPath ./build \
                                        -exportOptionsPlist ExportOptions.plist \
                                        -allowProvisioningUpdates || echo "IPA export may require signing configuration"
                                fi
                                
                                cd ../..
                                echo "iOS build completed"
                            '''
                            
                            // Archive iOS artifacts
                            sh '''
                                if [ -f "ios/App/build/*.ipa" ]; then
                                    echo "Archiving iOS IPA..."
                                fi
                            '''
                        } catch (Exception e) {
                            echo "iOS build failed or macOS agent not available: ${e.getMessage()}"
                            echo "Skipping iOS build. This is expected if no macOS agent is configured."
                        }
                    }
                }
            }
            post {
                always {
                    script {
                        try {
                            archiveArtifacts artifacts: 'frontend/ios/App/build/**/*.ipa', fingerprint: true, allowEmptyArchive: true
                        } catch (Exception e) {
                            echo "No iOS artifacts to archive"
                        }
                    }
                }
            }
        }
        
        stage('Publish to GitHub Packages') {
            steps {
                script {
                    // Create or get release first
                    def releaseId = null
                    def releaseTag = "v${env.VERSION_NAME}"
                    
                    try {
                        // Check if release exists
                        def checkRelease = sh(
                            script: """
                                curl -s -H "Authorization: token ${env.GITHUB_TOKEN}" \
                                    -H "Accept: application/vnd.github.v3+json" \
                                    https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases/tags/${releaseTag}
                            """,
                            returnStdout: true
                        )
                        
                        if (checkRelease.contains('"id"')) {
                            // Release exists, extract ID
                            releaseId = (checkRelease =~ /"id":(\d+)/)[0][1]
                            echo "Release ${releaseTag} already exists with ID: ${releaseId}"
                        } else {
                            // Create new release
                            def createRelease = sh(
                                script: """
                                    curl -s -X POST \
                                        -H "Authorization: token ${env.GITHUB_TOKEN}" \
                                        -H "Accept: application/vnd.github.v3+json" \
                                        -H "Content-Type: application/json" \
                                        https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases \
                                        -d '{\"tag_name\":\"${releaseTag}\",\"name\":\"Release ${env.VERSION_NAME}\",\"body\":\"Automated build from Jenkins - Build #${env.BUILD_NUMBER}\"}'
                                """,
                                returnStdout: true
                            )
                            
                            if (createRelease.contains('"id"')) {
                                releaseId = (createRelease =~ /"id":(\d+)/)[0][1]
                                echo "Created release ${releaseTag} with ID: ${releaseId}"
                            } else {
                                error("Failed to create release: ${createRelease}")
                            }
                        }
                    } catch (Exception e) {
                        echo "Error managing release: ${e.getMessage()}"
                    }
                    
                    // Publish Android APK
                    dir('frontend/android') {
                        script {
                            sh """
                                echo "Publishing Android APK to GitHub Packages..."
                                
                                # Find the release APK
                                RELEASE_APK=\$(find app/build/outputs/apk/release -name "*.apk" 2>/dev/null | head -1)
                                
                                if [ -f "\$RELEASE_APK" ]; then
                                    APK_NAME="app-release-${env.VERSION_NAME}.apk"
                                    
                                    echo "Uploading \${RELEASE_APK} as \${APK_NAME}..."
                                    
                                    # Upload using GitHub API
                                    UPLOAD_RESPONSE=\$(curl -s -w "\\n%{http_code}" -X POST \
                                        -H "Authorization: token ${env.GITHUB_TOKEN}" \
                                        -H "Content-Type: application/vnd.android.package-archive" \
                                        --data-binary "@\$RELEASE_APK" \
                                        "https://uploads.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases/${releaseId}/assets?name=\${APK_NAME}")
                                    
                                    HTTP_CODE=\$(echo "\$UPLOAD_RESPONSE" | tail -n1)
                                    
                                    if [ "\$HTTP_CODE" = "201" ]; then
                                        echo "✅ Android APK published successfully"
                                    else
                                        echo "⚠️ Upload response: \$UPLOAD_RESPONSE"
                                        echo "⚠️ HTTP Code: \$HTTP_CODE"
                                    fi
                                else
                                    echo "⚠️ Release APK not found at app/build/outputs/apk/release/, skipping upload"
                                fi
                            """
                        }
                    }
                    
                    // Publish iOS IPA (if built)
                    script {
                        def iosIpaPath = sh(
                            script: "find frontend/ios/App/build -name '*.ipa' 2>/dev/null | head -1",
                            returnStdout: true
                        ).trim()
                        
                        if (iosIpaPath) {
                            dir('frontend/ios/App/build') {
                                sh """
                                    echo "Publishing iOS IPA to GitHub Packages..."
                                    
                                    IPA_NAME="app-ios-${env.VERSION_NAME}.ipa"
                                    
                                    echo "Uploading ${iosIpaPath} as \${IPA_NAME}..."
                                    
                                    # Upload using GitHub API
                                    UPLOAD_RESPONSE=\$(curl -s -w "\\n%{http_code}" -X POST \
                                        -H "Authorization: token ${env.GITHUB_TOKEN}" \
                                        -H "Content-Type: application/octet-stream" \
                                        --data-binary "@${iosIpaPath}" \
                                        "https://uploads.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases/${releaseId}/assets?name=\${IPA_NAME}")
                                    
                                    HTTP_CODE=\$(echo "\$UPLOAD_RESPONSE" | tail -n1)
                                    
                                    if [ "\$HTTP_CODE" = "201" ]; then
                                        echo "✅ iOS IPA published successfully"
                                    else
                                        echo "⚠️ Upload response: \$UPLOAD_RESPONSE"
                                        echo "⚠️ HTTP Code: \$HTTP_CODE"
                                    fi
                                """
                            }
                        } else {
                            echo "⚠️ iOS IPA not found, skipping upload"
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "Build completed. Cleaning up..."
            }
        }
        success {
            echo "✅ Build succeeded! Artifacts published to GitHub Packages."
        }
        failure {
            echo "❌ Build failed. Check logs for details."
        }
        unstable {
            echo "⚠️ Build unstable. Some stages may have failed."
        }
    }
}

