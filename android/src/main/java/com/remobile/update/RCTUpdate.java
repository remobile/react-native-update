package com.remobile.update;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Log;

import com.facebook.react.bridge.*;
import java.io.File;
import java.util.HashMap;
import java.util.Map;



public class RCTUpdate extends ReactContextBaseJavaModule {
    private Activity activity;
    private RCTUpdateMgr updateMgr;

    public RCTUpdate(ReactApplicationContext reactContext, Activity activity, RCTUpdateMgr updateMgr) {
        super(reactContext);
        this.activity = activity;
        this.updateMgr = updateMgr;
    }

    @Override
    public String getName() {
        return "Update";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("mainBundleFilePath", updateMgr.mainBundleFilePath);
        constants.put("documentFilePath", updateMgr.documentFilePath);
        constants.put("versionName", updateMgr.appVersion);
        constants.put("versionCode", updateMgr.buildVersion);
        return constants;
    }

    @ReactMethod
    public void installApk(final String file) throws Exception {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setDataAndType(Uri.fromFile(new File(file)), "application/vnd.android.package-archive");
        this.activity.startActivity(intent);
    }

    @ReactMethod
    public void restartApp() {
        Intent intent = activity.getIntent();
        activity.finish();
        activity.startActivity(intent);
    }

    @ReactMethod
    public void getLocalValue(String tag, Callback callback) {
        String ret = updateMgr.getLocalValue(tag);
        callback.invoke(ret);
    }

    @ReactMethod
    public void setLocalValue(String tag, String value) {
        updateMgr.setLocalValue(tag, value);
    }

}
