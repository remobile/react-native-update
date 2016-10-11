'use strict';


var ReactNative = require('react-native');
var {
    NativeModules,
    Platform,
    AsyncStorage,
} = ReactNative;

//errors
var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_GET_VERSION = 3,
ERROR_FAILED_INSTALL = 4,
ERROR_UNZIP_JS = 5;

var JS_VERISON_ITEM_NAME = "rct_update_js_version_code";
var JS_VERISON_CODE = 0;

var fs = require('react-native-fs');
var RCTUpdate= NativeModules.Update;
var FileTransfer = require('@remobile/react-native-file-transfer');
var Zip = require('@remobile/react-native-zip');

RCTUpdate.getLocalValue("JS_VERSION_CLEAR", (val)=>{
    if (val === "yes") {
        JS_VERISON_CODE = 0;
        AsyncStorage.setItem(JS_VERISON_ITEM_NAME, '0');
        RCTUpdate.setLocalValue("JS_VERSION_CLEAR", "");
    } else {
        AsyncStorage.getItem(JS_VERISON_ITEM_NAME).then((version)=>{
            JS_VERISON_CODE = version||0;
        });
    }
});

class Update {
    constructor(options) {
        var documentFilePath = RCTUpdate.documentFilePath;
        options.documentFilePath = documentFilePath;
        options.wwwPath = documentFilePath+'www',
        options.jsbundleZipPath = documentFilePath+'www.zip',
        options.localVersionPath = documentFilePath+'version.json',
        this.options = options;
    }
    GET(url, success, error) {
        fetch(url)
        .then((response) => response.json())
        .then((json) => {
            console.log(url, json);
            success && success(json);
        })
        .catch((err) => {
            error(err);
        });
    }
    downloadAppFromServer() {
        console.log("downloadAppFromServer");
        this.downloadApkFromServer();
    }
    downloadApkFromServer() {
        console.log("downloadApkFromServer");
        var oldval;
        var fileTransfer = new FileTransfer();
        if (this.options.onDownloadAPKProgress) {
            fileTransfer.onprogress = (progress) => {
                var val = parseInt(progress.loaded*100/progress.total);
                if (oldval !== val) {
                    this.options.onDownloadAPKProgress(val);
                    oldval = val;
                }
            }
        }
        this.options.onDownloadAPKStart&&this.options.onDownloadAPKStart();
        fileTransfer.download(
            this.options.androidApkUrl,
            this.options.androidApkDownloadDestPath,
            (result)=>{
                this.options.onDownloadAPKEnd&&this.options.onDownloadAPKEnd();
                RCTUpdate.installApk(this.options.androidApkDownloadDestPath);
                setTimeout(()=>{
                    this.options.onError(ERROR_FAILED_INSTALL);
                }, 500);
            },
            (error)=>{
                this.options.onError(ERROR_DOWNKOAD_APK);
            },
            true
        );
    }
    downloadJSFromServer() {
        console.log("downloadJSFromServer");
        var oldval;
        var fileTransfer = new FileTransfer();
        if (this.options.onDownloadJSProgress) {
            fileTransfer.onprogress = (progress) => {
                var val = parseInt(progress.loaded*100/progress.total);
                if (oldval !== val) {
                    this.options.onDownloadJSProgress(val);
                    oldval = val;
                }
            };
        }
        this.options.onDownloadJSStart&&this.options.onDownloadJSStart();
        fileTransfer.download(
            this.options.jsbundleUrl,
            this.options.jsbundleZipPath,
            this.unzipJSZipFile.bind(this),
            (error)=>{
                this.options.onError(ERROR_DOWNKOAD_JS);
            },
            true
        );
    }
    deleteWWWDir() {
        return new Promise((resolve, reject) => {
            fs.unlink(this.options.wwwPath).then(()=>{
                resolve();
            }).catch((err)=>{
                resolve();
            });
        });
    }
    saveLocalJsVersion(ver) {
        return new Promise((resolve, reject) => {
            AsyncStorage.setItem(JS_VERISON_ITEM_NAME, ver+'').then(()=>{
                JS_VERISON_CODE = ver;
                resolve();
            }).catch((err)=>{
                resolve();
            });
        });
    }
    async unzipJSZipFile(result) {
        console.log("unzipJSZipFile", result);
        var oldval;
        this.options.onDownloadJSEnd&&this.options.onDownloadJSEnd();
        var onprogress;
        if (this.options.onUnzipJSProgress) {
            onprogress = (progress) => {
                var val = parseInt(progress.loaded*100/progress.total);
                if (oldval !== val) {
                    this.options.onUnzipJSProgress(val);
                    oldval = val;
                }
            };
        }
        this.options.onUnzipJSStart&&this.options.onUnzipJSStart();
        await this.deleteWWWDir();
        await this.saveLocalJsVersion(this.jsVersionCode);
        Zip.unzip(this.options.jsbundleZipPath, this.options.documentFilePath,async (res)=>{
            if (res) {
                await this.saveLocalJsVersion(0); //if unzip error, refresh origin version
                this.options.onError(ERROR_UNZIP_JS);
            } else {
                await fs.unlink(this.options.jsbundleZipPath);
                this.options.onUnzipJSEnd&&this.options.onUnzipJSEnd();
                RCTUpdate.restartApp();
            }
        }, onprogress);
    }
    getServerVersion(appStoreVersion) {
        console.log("getServerVersion", this.options.versionUrl);
        this.GET(this.options.versionUrl, this.getServerVersionSuccess.bind(this, appStoreVersion), this.getServerVersionError.bind(this));
    }
    getServerVersionSuccess(appStoreVersion, remote) {
        console.log("getServerVersionSuccess", remote);
        if (Platform.OS === 'android' && RCTUpdate.versionCode < remote.versionCode) {
            if (this.options.needUpdateApp) {
                 this.options.needUpdateApp(getVersion(), remote, (res)=>{
                    if (res === 0) {
                        this.downloadAppFromServer();
                    } else if (res === 1) {
                        // 跳过此版本
                    }
                })
            }
        } else {
            this.jsVersionCode = app.isandroid ? remote.androidJsVersionCode : remote.iosJsVersionCode;
            if (this.jsVersionCode == null) {
                this.jsVersionCode = remote.jsVersionCode;
            }
            if (JS_VERISON_CODE < this.jsVersionCode) {
                if (this.options.needUpdateJS) {
                    if (Platform.OS !== 'android') {
                        remote.versionName = appStoreVersion;
                    }
                    this.options.needUpdateJS(getVersion(), {...remote, jsVersionCode:this.jsVersionCode}, (res)=>{
                        if (res === 0) {
                            this.downloadJSFromServer();
                        } else if (res === 1) {
                            // 跳过此版本
                        }
                    })
                } else {
                    this.downloadJSFromServer();
                }
            } else {
                this.options.onNewestVerion();
            }
        }
    }
    getAppStoreVersion() {
        if (!this.options.iosAppId) {
            console.log("getAppStoreVersion without appID");
            this.getServerVersion();
            return;
        }
        console.log("getAppStoreVersion with appID:", this.options.iosAppId);
        this.GET("http://itunes.apple.com/lookup?id="+this.options.iosAppId, this.getAppStoreVersionSuccess.bind(this), this.getServerVersionError.bind(this));
    }
    getAppStoreVersionSuccess(data) {
        console.log("getAppStoreVersionSuccess", data);
        if (data.resultCount < 1) {
            this.getServerVersionError();
            return;
        }
        var result = data.results[0];
        var version = result.version;
        var trackViewUrl = result.trackViewUrl;
        if (version !== RCTUpdate.versionName) {
            if (this.options.needUpdateApp) {
                 this.options.needUpdateApp(getVersion(), {versionName:version, jsVersionCode:0}, (res)=>{
                    if (res === 0) {
                        RCTUpdate.installFromAppStore(trackViewUrl);
                        setTimeout(()=>{
                            this.options.onError(ERROR_FAILED_INSTALL);
                        }, 500);
                    } else if (res === 1) {
                        // 跳过此版本
                    }
                })
            }
        } else {
            this.getServerVersion(version);
        }
    }
    getServerVersionError(error) {
        console.log("getServerVersionError", error);
        this.options.onError(ERROR_GET_VERSION);
    }
    start() {
        if (Platform.OS === 'android') {
            this.getServerVersion();
        } else {
            this.getAppStoreVersion();
        }
    }
}

function getVersion() {
    return {
        versionName: RCTUpdate.versionName,
        versionCode: RCTUpdate.versionCode,
        jsVersionCode: JS_VERISON_CODE,
    }
}

Update.getVersion = getVersion;

module.exports = Update;
