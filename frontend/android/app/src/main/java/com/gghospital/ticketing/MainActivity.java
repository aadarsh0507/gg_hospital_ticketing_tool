package com.gghospital.ticketing;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView for optimal mobile responsiveness
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings webSettings = webView.getSettings();
            
            // Enable JavaScript
            webSettings.setJavaScriptEnabled(true);
            
            // Enable DOM storage
            webSettings.setDomStorageEnabled(true);
            
            // Enable database storage
            webSettings.setDatabaseEnabled(true);
            
            // Set viewport meta tag support
            webSettings.setUseWideViewPort(true);
            webSettings.setLoadWithOverviewMode(true);
            
            // Enable zoom controls (but respect viewport)
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            webSettings.setSupportZoom(false);
            
            // Better rendering
            webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Enable safe area insets for devices with notches
            webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
            
            // Set user agent to include mobile identifier
            String userAgent = webSettings.getUserAgentString();
            if (!userAgent.contains("Mobile")) {
                webSettings.setUserAgentString(userAgent + " Mobile");
            }
        }
    }
    
    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        
        // Check if WebView can go back
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            // If at root page, exit the app
            super.onBackPressed();
        }
    }
}
