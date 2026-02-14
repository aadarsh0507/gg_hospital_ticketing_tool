package app.netlify.gghospitalsticketingtool.twa;

import android.util.Log;

public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    private static final String TAG = "GGHospitalTWA";
    
    @Override
    public void onCreate() {
        try {
            super.onCreate();
            Log.d(TAG, "DelegationService onCreate called");
        } catch (Exception e) {
            Log.e(TAG, "Error in DelegationService onCreate", e);
            // Don't rethrow - service should still work
        }
    }
}
