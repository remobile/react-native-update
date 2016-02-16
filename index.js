/*
* (The MIT License)
* Copyright (c) 2015-2016 YunJiang.Fang <42550564@qq.com>
* @providesModule Update
* @flow-weak
*/
'use strict';

var React = require('react-native');
var {
    NativeModules,
    Platform,
    AsyncStorage,
} = React;

//errors
var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_GET_VERSION = 3,
ERROR_UNZIP_JS = 4;

var JS_VERISON_ITEM_NAME = "rct_update_js_version_code";
var JS_VERISON_CODE = 0;

AsyncStorage.getItem(JS_VERISON_ITEM_NAME).then((version)=>{
    JS_VERISON_CODE = version||0;
});

var fs = require('react-native-fs');
var RCTUpdate= NativeModules.Update;
var FileTransfer = require('@remobile/react-native-file-transfer');
var Zip = require('@remobile/react-native-zip');

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
            success && success(json);
        })
        .catch((err) => {
            error(err);
        });
    }
    downloadAppFromServer() {
        if (Platform.OS === 'android') {
            this.downloadApkFromServer();
        } else {
            this.downloadAppFromAppStore();
        }
    }
    downloadAppFromAppStore() {
        RCTUpdate.installFromAppStore(this.options.iosAppId);
    }
    downloadApkFromServer() {
        var fileTransfer = new FileTransfer();
        if (this.options.onDownloadAPKProgress) {
            fileTransfer.onprogress = (progress) => {
                this.options.onDownloadAPKProgress(parseInt(progress.loaded*100/progress.total))
            }
        }
        this.options.onDownloadAPKStart&&this.options.onDownloadAPKStart();
        fileTransfer.download(
            this.options.androidApkUrl,
            this.options.androidApkDownloadDestPath,
            (result)=>{
                this.options.onDownloadAPKEnd&&this.options.onDownloadAPKEnd();
                RCTUpdate.installApk(this.options.androidApkDownloadDestPath);
            },
            (error)=>{
                this.options.onError(ERROR_DOWNKOAD_APK);
            },
            true
        );
    }
    downloadJSFromServer() {
        var fileTransfer = new FileTransfer();
        if (this.options.onDownloadJSProgress) {
            fileTransfer.onprogress = (progress) => {
                this.options.onDownloadJSProgress(parseInt(progress.loaded*100/progress.total));
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
        this.options.onDownloadJSEnd&&this.options.onDownloadJSEnd();
        var onprogress;
        if (this.options.onUnzipJSProgress) {
            onprogress = (progress) => {
                this.options.onUnzipJSProgress(parseInt(progress.loaded*100/progress.total));
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
    getServerVersion() {
        this.GET(this.options.versionUrl, this.getServerVersionSuccess.bind(this), this.getServerVersionError.bind(this));
    }
    async getServerVersionSuccess(remote) {
        if (RCTUpdate.versionCode < remote.versionCode) {
            if (this.options.needUpdateApp) {
                 this.options.needUpdateApp(getVersion(), remote, (res)=>{
                    if (res === 0) {
                        this.downloadAppFromServer();
                    } else if (res === 1) {
                        // 跳过此版本
                    }
                })
            } else {
                this.downloadAppFromServer();
            }
        } else {
            this.jsVersionCode = remote.jsVersionCode;
            if (JS_VERISON_CODE < remote.jsVersionCode) {
                if (this.options.needUpdateJS) {
                     this.options.needUpdateJS(getVersion(), remote, (res)=>{
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
    getServerVersionError(error) {
        this.options.onError(ERROR_GET_VERSION);
    }
    start() {
        this.getServerVersion();
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
