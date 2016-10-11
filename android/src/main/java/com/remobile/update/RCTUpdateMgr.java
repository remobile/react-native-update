package com.remobile.update;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import com.facebook.react.ReactPackage;

import java.io.File;

import static com.remobile.update.Utils.deleteDirectoryAtPath;


public class RCTUpdateMgr {
    private final String LOG_CAT = "rct_update";
    private final String MAIN_BUNDLE_FOLDER = "www/";
    private final String MAIN_BUNDLE_FILE = MAIN_BUNDLE_FOLDER+"index.android.bundle";
    private final String ASSETS_BUNDLE_FILE = "assets://index.android.bundle";
    public static final String PREF_LOCAL_STORAGE = "PREF_LOCAL_STORAGE";

    private Activity activity;
    private Context context;

    public String documentFilePath;
    public String mainBundleFilePath;
    public String appVersion = "1.0";
    public int buildVersion = 0;
    public boolean isRunFirstOnNewVersion = false;

    private RCTUpdatePackage updatePackage;
    public SharedPreferences settings;

    public RCTUpdateMgr(Activity activity) {
        this.activity = activity;
        this.context = activity.getApplicationContext();

        documentFilePath = activity.getFilesDir().getAbsolutePath()+"/";
        mainBundleFilePath = documentFilePath+MAIN_BUNDLE_FILE;

        PackageInfo pInfo = null;
        try {
            pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            appVersion = pInfo.versionName;
            buildVersion = pInfo.versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        settings = activity.getSharedPreferences(PREF_LOCAL_STORAGE, Activity.MODE_PRIVATE);
        String lastversionCode = settings.getString("APK_VERSION_CODE", "0");
        if (!lastversionCode.equals("" + buildVersion)) {
            isRunFirstOnNewVersion = true;
            SharedPreferences.Editor edit = settings.edit();
            edit.putString("APK_VERSION_CODE", "" + buildVersion);
            edit.putString("JS_VERSION_CLEAR", "yes");
            edit.commit();
            new Thread(new Runnable() {
                @Override
                public void run() {
                    deleteDirectoryAtPath(documentFilePath + MAIN_BUNDLE_FOLDER);
                }
            }).start();
        }
    }

    public String getBundleUrl() {
        if (isRunFirstOnNewVersion) {
            isRunFirstOnNewVersion = false;
            Log.v(LOG_CAT, "=========use update asserts:"+ASSETS_BUNDLE_FILE);
            return ASSETS_BUNDLE_FILE;
        }
        File file = new File(mainBundleFilePath);
        if (file.exists()) {
            Log.v(LOG_CAT, "=========use update:"+file.getAbsolutePath());
            return file.getAbsolutePath();
        }
        Log.v(LOG_CAT, "=========use asserts:"+ASSETS_BUNDLE_FILE);
        return ASSETS_BUNDLE_FILE;
    }

    public ReactPackage getReactPackage() {
        if (updatePackage == null) {
            updatePackage = new RCTUpdatePackage(activity, this);
        }
        return updatePackage;
    }

    public String getLocalValue(String tag) {
        String ret = settings.getString(tag, "");
        Log.v(LOG_CAT, "getLocalValue value=" + ret + "  tag=" + tag);
        return ret;
    }

    public void setLocalValue(String tag, String value) {
        SharedPreferences.Editor edit = settings.edit();
        Log.v(LOG_CAT, "setLocalValue value=" + value + "  tag=" + tag);
        edit.putString(tag, value);
        edit.commit();
    }
}

