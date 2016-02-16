package com.remobile.update;

import android.app.Activity;

import java.io.File;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;


public class RCTUpdatePackage implements ReactPackage {
    private Activity activity;
    private RCTUpdate mModuleInstance;
    private RCTUpdateMgr updateMgr;

    public RCTUpdatePackage(Activity activity, RCTUpdateMgr updateMgr) {
        super();
        this.activity = activity;
        this.updateMgr = updateMgr;
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        mModuleInstance = new RCTUpdate(reactContext, activity, updateMgr);
        return Arrays.<NativeModule>asList(
                mModuleInstance
        );
    }

    @Override
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList();
    }
}
