package com.remobile.update;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import com.facebook.react.ReactPackage;
import java.io.File;


public class RCTUpdateMgr {
    private final String LOG_CAT = "rct_update";
    private final String MAIN_BUNDLE_FILE = "www/index.android.bundle";
    private final String ASSETS_BUNDLE_FILE = "assets://index.android.bundle";

    private Activity activity;
    private Context context;

    public String documentFilePath;
    public String mainBundleFilePath;
    public String appVersion;
    public int buildVersion;

    private RCTUpdatePackage updatePackage;

    public RCTUpdateMgr(Activity activity) {
        this.activity = activity;
        this.context = activity.getApplicationContext();

        documentFilePath = "/sdcard/1/";//activity.getFilesDir().getAbsolutePath()+"/";
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

    public String getBundleUrl() {
        File file = new File(mainBundleFilePath);
        if (file.exists()) {
            Log.v(LOG_CAT, "=========use update");
            return file.getAbsolutePath();
        }
        Log.v(LOG_CAT, "=========use asserts");
        return ASSETS_BUNDLE_FILE;
    }

    public ReactPackage getReactPackage() {
        if (updatePackage == null) {
            updatePackage = new RCTUpdatePackage(activity, this);
        }
        return updatePackage;
    }
}

