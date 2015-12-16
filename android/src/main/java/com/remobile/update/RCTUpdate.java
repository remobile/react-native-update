package com.remobile.update;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;

import com.facebook.react.bridge.*;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class RCTUpdate extends ReactContextBaseJavaModule {
    private final String MAIN_BUNDLE_FILE = "/www/index.android.bundle";
    private final String ASSETS_BUNDLE_FILE = "assets://"+MAIN_BUNDLE_FILE;

    private Activity activity;
    private Context context;
    private String documentFilePath;
    private String mainBundleFilePath;

    private String appVersion;
    private int buildVersion;

    public RCTUpdate(ReactApplicationContext reactContext, Activity activity) {
        super(reactContext);
        this.activity = activity;
        this.context = activity.getApplicationContext();

        documentFilePath = activity.getFilesDir().getAbsolutePath();
        mainBundleFilePath = documentFilePath+MAIN_BUNDLE_FILE;

        PackageInfo pInfo = null;
        try {
            pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            appVersion = pInfo.versionName;
            buildVersion = pInfo.versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            throw new RuntimeException("Unable to get package info for " + context.getPackageName(), e);
        }
    }

    @Override
    public String getName() {
        return "PrivateModule";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("mainBundleFilePath", mainBundleFilePath);
        constants.put("documentFilePath", documentFilePath);
        constants.put("versionName", appVersion);
        constants.put("versionCode", buildVersion);
        return constants;
    }

    @ReactMethod
    public void installApk(final String file) throws Exception {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setDataAndType(Uri.fromFile(new File(file)),
                "application/vnd.android.package-archive");
        this.activity.startActivity(intent);
    }

    @ReactMethod
    private void restartApp() {
        Intent intent = activity.getIntent();
        activity.finish();
        activity.startActivity(intent);
    }


    public String getBundleUrl() {
        File file = new File(mainBundleFilePath);
        if (file.exists()) {
            return file.getAbsolutePath();
        }
        return ASSETS_BUNDLE_FILE;
    }
}
