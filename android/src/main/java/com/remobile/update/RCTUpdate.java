package com.remobile.update;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JSBundleLoader;

import java.io.File;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
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
        final Activity activity = this.activity;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(Uri.fromFile(new File(file)), "application/vnd.android.package-archive");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
                android.os.Process.killProcess(android.os.Process.myPid());
            }
        });
    }

    @ReactMethod
    public void restartApp() {
        loadBundle();
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

    private void loadBundleLegacy() {
        final Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            return;
        }
        currentActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                currentActivity.recreate();
            }
        });
    }

    private ReactInstanceManager resolveInstanceManager() throws NoSuchFieldException, IllegalAccessException {
        ReactInstanceManager instanceManager;
        final Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            return null;
        }

        ReactApplication reactApplication = (ReactApplication) currentActivity.getApplication();
        instanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();

        return instanceManager;
    }

    private void loadBundle() {
        try {
            final ReactInstanceManager instanceManager = resolveInstanceManager();
            if (instanceManager == null) {
                return;
            }
            setJSBundle(instanceManager, updateMgr.getBundleUrl());
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        instanceManager.recreateReactContextInBackground();
                    } catch (Exception e) {
                        loadBundleLegacy();
                    }
                }
            });
        } catch (Exception e) {
            loadBundleLegacy();
        }
    }

    private void setJSBundle(ReactInstanceManager instanceManager, String latestJSBundleFile) throws IllegalAccessException {
       try {
           JSBundleLoader latestJSBundleLoader;
           if (latestJSBundleFile.toLowerCase().startsWith("assets://")) {
               latestJSBundleLoader = JSBundleLoader.createAssetLoader(getReactApplicationContext(), latestJSBundleFile, false);
           } else {
               latestJSBundleLoader = JSBundleLoader.createFileLoader(latestJSBundleFile);
           }

           Field bundleLoaderField = instanceManager.getClass().getDeclaredField("mBundleLoader");
           bundleLoaderField.setAccessible(true);
           bundleLoaderField.set(instanceManager, latestJSBundleLoader);
       } catch (Exception e) {
           throw new IllegalAccessException("Could not setJSBundle");
       }
   }
}
