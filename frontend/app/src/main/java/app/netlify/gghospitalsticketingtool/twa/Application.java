package app.netlify.gghospitalsticketingtool.twa;

import android.util.Log;

public class Application extends android.app.Application {
    private static final String TAG = "GGHospitalTWA";
    
    @Override
    public void onCreate() {
        try {
            super.onCreate();
            Log.d(TAG, "Application onCreate called successfully");
        } catch (RuntimeException e) {
            Log.e(TAG, "RuntimeException in Application onCreate", e);
            // Re-throw runtime exceptions as they indicate critical errors
            throw e;
        } catch (Exception e) {
            Log.e(TAG, "Exception in Application onCreate", e);
            // For other exceptions, log but don't crash
        }
    }
}
