package app.netlify.gghospitalsticketingtool.twa;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    private static final String TAG = "GGHospitalTWA";
    
    static {
        try {
            Log.d(TAG, "LauncherActivity class loaded");
        } catch (Exception e) {
            android.util.Log.e(TAG, "Error in static block", e);
        }
    }
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            Log.d(TAG, "=== LauncherActivity onCreate START ===");
            Log.d(TAG, "Bundle: " + (savedInstanceState != null ? "exists" : "null"));
            Log.d(TAG, "Intent: " + (getIntent() != null ? getIntent().toString() : "null"));
            
            // Ensure we have a valid context before calling super
            if (getApplicationContext() == null) {
                Log.e(TAG, "Application context is null!");
            }
            
            // Call parent onCreate - this initializes the TWA
            super.onCreate(savedInstanceState);
            
            Log.d(TAG, "=== LauncherActivity onCreate SUCCESS ===");
        } catch (RuntimeException e) {
            Log.e(TAG, "=== RUNTIME EXCEPTION in LauncherActivity ===");
            Log.e(TAG, "Message: " + e.getMessage());
            Log.e(TAG, "Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "null"));
            Log.e(TAG, "Stack trace:", e);
            e.printStackTrace();
            
            // Try to fallback to opening in browser
            try {
                int resId = getResources().getIdentifier("launchUrl", "string", getPackageName());
                if (resId != 0) {
                    String launchUrl = getString(resId);
                    if (launchUrl != null && !launchUrl.isEmpty()) {
                        Log.d(TAG, "Attempting to open URL in browser: " + launchUrl);
                        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(launchUrl));
                        browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(browserIntent);
                        finish();
                        return;
                    }
                } else {
                    // Fallback to hardcoded URL if resource not found
                    String launchUrl = "https://gghospitalsticketingtool.netlify.app/";
                    Log.d(TAG, "Using hardcoded URL: " + launchUrl);
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(launchUrl));
                    browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(browserIntent);
                    finish();
                    return;
                }
            } catch (Exception fallbackError) {
                Log.e(TAG, "Fallback also failed", fallbackError);
            }
            
            // Re-throw to let Android handle it
            throw e;
        } catch (Exception e) {
            Log.e(TAG, "=== EXCEPTION in LauncherActivity ===");
            Log.e(TAG, "Message: " + e.getMessage());
            Log.e(TAG, "Stack trace:", e);
            e.printStackTrace();
            
            // Try fallback
            try {
                int resId = getResources().getIdentifier("launchUrl", "string", getPackageName());
                if (resId != 0) {
                    String launchUrl = getString(resId);
                    if (launchUrl != null && !launchUrl.isEmpty()) {
                        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(launchUrl));
                        browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(browserIntent);
                        finish();
                        return;
                    }
                } else {
                    String launchUrl = "https://gghospitalsticketingtool.netlify.app/";
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(launchUrl));
                    browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(browserIntent);
                    finish();
                    return;
                }
            } catch (Exception fallbackError) {
                Log.e(TAG, "Fallback failed", fallbackError);
            }
        }
    }
    
    @Override
    protected void onResume() {
        try {
            Log.d(TAG, "LauncherActivity onResume START");
            super.onResume();
            Log.d(TAG, "LauncherActivity onResume SUCCESS");
        } catch (Exception e) {
            Log.e(TAG, "Error in LauncherActivity onResume", e);
            e.printStackTrace();
        }
    }
    
    @Override
    protected void onStart() {
        try {
            Log.d(TAG, "LauncherActivity onStart");
            super.onStart();
        } catch (Exception e) {
            Log.e(TAG, "Error in LauncherActivity onStart", e);
            e.printStackTrace();
        }
    }
}
