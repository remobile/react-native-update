package com.remobile.update;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;


public class RCTUpdate extends ReactContextBaseJavaModule {
    private Activity activity;
    private RCTUpdateMgr updateMgr;
    private static final String REACT_APPLICATION_CLASS_NAME = "com.facebook.react.ReactApplication";
    private static final String REACT_NATIVE_HOST_CLASS_NAME = "com.facebook.react.ReactNativeHost";

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

    private void loadBundle() {
        try {
            final ReactInstanceManager instanceManager = resolveInstanceManager();
            if (instanceManager == null) {
                return;
            }

            setJSBundle(instanceManager, updateMgr.getBundleUrl());

            final Method recreateMethod = instanceManager.getClass().getMethod("recreateReactContextInBackground");
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        recreateMethod.invoke(instanceManager);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private ReactInstanceManager resolveInstanceManager() throws Exception {
        Method getApplicationMethod = ReactActivity.class.getMethod("getApplication");
        Object reactApplication = getApplicationMethod.invoke(activity);
        Class<?> reactApplicationClass = tryGetClass(REACT_APPLICATION_CLASS_NAME);
        Method getReactNativeHostMethod = reactApplicationClass.getMethod("getReactNativeHost");
        Object reactNativeHost = getReactNativeHostMethod.invoke(reactApplication);
        Class<?> reactNativeHostClass = tryGetClass(REACT_NATIVE_HOST_CLASS_NAME);
        Method getReactInstanceManagerMethod = reactNativeHostClass.getMethod("getReactInstanceManager");
        return (ReactInstanceManager)getReactInstanceManagerMethod.invoke(reactNativeHost);
    }

    private void setJSBundle(ReactInstanceManager instanceManager, String latestJSBundleFile) throws NoSuchFieldException, IllegalAccessException {
        try {
            Field bundleLoaderField = instanceManager.getClass().getDeclaredField("mBundleLoader");
            Class<?> jsBundleLoaderClass = Class.forName("com.facebook.react.cxxbridge.JSBundleLoader");
            Method createFileLoaderMethod = null;

            Method[] methods = jsBundleLoaderClass.getDeclaredMethods();
            for (Method method : methods) {
                if (method.getName().equals("createFileLoader")) {
                    createFileLoaderMethod = method;
                    break;
                }
            }

            if (createFileLoaderMethod == null) {
                throw new NoSuchMethodException("Could not find a recognized 'createFileLoader' method");
            }
            int numParameters = createFileLoaderMethod.getGenericParameterTypes().length;
            Object latestJSBundleLoader;
            if (numParameters == 1) {
                // RN >= v0.34
                latestJSBundleLoader = createFileLoaderMethod.invoke(jsBundleLoaderClass, latestJSBundleFile);
            } else if (numParameters == 2) {
                // RN >= v0.31 && RN < v0.34
                latestJSBundleLoader = createFileLoaderMethod.invoke(jsBundleLoaderClass, getReactApplicationContext(), latestJSBundleFile);
            } else {
                throw new NoSuchMethodException("Could not find a recognized 'createFileLoader' method");
            }

            bundleLoaderField.setAccessible(true);
            bundleLoaderField.set(instanceManager, latestJSBundleLoader);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    private Class tryGetClass(String className) {
        try {
            return Class.forName(className);
        } catch (ClassNotFoundException e) {
            return null;
        }
    }

}
