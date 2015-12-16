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
} = React;

//errors
var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_GET_VERSION = 3,
ERROR_UNZIP_JS = 4;

var fs = require('react-native-fs');
var RCTUpdate= NativeModules.Update;
var FileTransfer = require('@remobile/react-native-file-transfer');
var Zip = require('@remobile/react-native-zip');

class Update {
    constructor(options) {
        var documentFilePath = '/Users/fang/rn/KitchenSink/App/vaccinum/server/image/';//RCTUpdate.documentFilePath;
        options.documentFilePath = documentFilePath;
        options.wwwPath = documentFilePath+'www',
        options.jsbundleZipPath = documentFilePath+'jsbundle.zip',
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
        console.log("not complete!");
    }
    downloadApkFromServer() {
        var fileTransfer = new FileTransfer();
        if (this.options.onDownloadAPKProgress) {
            fileTransfer.onprogress = (progress) => {
                this.options.onDownloadAPKProgress(parseInt(progress.loaded*100/progress.total))
            }
        }
        fileTransfer.download(
            this.options.androidApkUrl,
            this.options.androidApkDownloadDestPath,
            function(result) {
                RCTUpdate.installApk(this.options.androidApkDownloadDestPath);
            },
            function(error) {
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
        fileTransfer.download(
            this.options.jsbundleUrl,
            this.options.jsbundleZipPath,
            this.unzipJSZipFile.bind(this),
            function(error) {
                this.options.onError(ERROR_DOWNKOAD_JS);
            },
            true
        );
    }
    async unzipJSZipFile(result) {
        var onprogress;
        if (this.options.onUnzipJSProgress) {
            onprogress = (progress) => {
                this.options.onUnzipJSProgress(parseInt(progress.loaded*100/progress.total));
            };
        }
        await fs.unlink(this.options.wwwPath);
        Zip.unzip(this.options.jsbundleZipPath, this.options.documentFilePath, (res)=>{
            if (res) {
                this.options.onError(ERROR_UNZIP_JS);
            } else {
                fs.unlink(this.options.jsbundleZipPath);
                RCTUpdate.restartApp();
            }
        }, onprogress);
    }
    getServerVersion() {
        this.GET(this.options.versionUrl, this.getServerVersionSuccess.bind(this), this.getServerVersionError.bind(this));
    }
    async getServerVersionSuccess(remote) {
        if (RCTUpdate.versionCode < remote.versionCode) {
            this.downloadAppFromServer();
        } else {
            var local = await this.getLocalVersion();
            if (local.jsVersionCode < remote.jsVersionCode) {
                this.downloadJSFromServer();
            } else {
                this.options.onNewestVerion();
            }
        }
    }
    getServerVersionError(error) {
        this.options.onError(ERROR_GET_VERSION);
    }
    getLocalVersion() {
        console.log(this.options.localVersionPath);
        return new Promise((resolve, reject) => {

            fs.readFile(this.options.localVersionPath, 'utf8').then((text)=>{
                var version = JSON.parse(text);
                resolve(version);
            }).catch((err)=>{
                resolve({jsVersionCode:0});
            });
        });
    }
    start() {
        this.getServerVersion();
    }
}

module.exports = Update;
