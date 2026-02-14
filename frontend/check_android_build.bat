@echo off
echo Checking Android Build Configuration...
echo.

cd /d "%~dp0"

echo [1/5] Checking Java source files...
if exist "app\src\main\java\app\netlify\gghospitalsticketingtool\twa\Application.java" (
    echo   ✓ Application.java exists
) else (
    echo   ✗ Application.java MISSING!
)

if exist "app\src\main\java\app\netlify\gghospitalsticketingtool\twa\LauncherActivity.java" (
    echo   ✓ LauncherActivity.java exists
) else (
    echo   ✗ LauncherActivity.java MISSING!
)

if exist "app\src\main\java\app\netlify\gghospitalsticketingtool\twa\DelegationService.java" (
    echo   ✓ DelegationService.java exists
) else (
    echo   ✗ DelegationService.java MISSING!
)

echo.
echo [2/5] Checking resource files...
if exist "app\src\main\res\values\strings.xml" (
    echo   ✓ strings.xml exists
) else (
    echo   ✗ strings.xml MISSING!
)

if exist "app\src\main\res\values\colors.xml" (
    echo   ✓ colors.xml exists
) else (
    echo   ✗ colors.xml MISSING!
)

if exist "app\src\main\res\xml\filepaths.xml" (
    echo   ✓ filepaths.xml exists
) else (
    echo   ✗ filepaths.xml MISSING!
)

if exist "app\src\main\res\drawable\splash.xml" (
    echo   ✓ splash.xml exists
) else (
    echo   ✗ splash.xml MISSING!
)

echo.
echo [3/5] Checking manifest...
if exist "app\src\main\AndroidManifest.xml" (
    echo   ✓ AndroidManifest.xml exists
) else (
    echo   ✗ AndroidManifest.xml MISSING!
)

echo.
echo [4/5] Checking build files...
if exist "app\build.gradle" (
    echo   ✓ app/build.gradle exists
) else (
    echo   ✗ app/build.gradle MISSING!
)

if exist "build.gradle" (
    echo   ✓ build.gradle exists
) else (
    echo   ✗ build.gradle MISSING!
)

echo.
echo [5/5] Checking dependencies...
if exist "gradle\wrapper\gradle-wrapper.jar" (
    echo   ✓ Gradle wrapper exists
) else (
    echo   ✗ Gradle wrapper MISSING!
)

echo.
echo ========================================
echo Check complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Android Studio
echo 2. File -^> Sync Project with Gradle Files
echo 3. Build -^> Clean Project
echo 4. Build -^> Rebuild Project
echo 5. Run -^> Debug 'app'
echo.
pause

