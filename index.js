'use strict';

const ReactNative = require('react-native');
const {
    NativeModules,
    Platform,
    AsyncStorage,
} = ReactNative;

// errors
const
    ERROR_NULL = 0,
    ERROR_DOWNKOAD_APK = 1,
    ERROR_DOWNKOAD_JS = 2,
    ERROR_FAILED_INSTALL = 3,
    ERROR_UNZIP_JS = 4;

const JS_VERISON_ITEM_NAME = 'rct_update_js_version_code';
let JS_VERISON_CODE = 0;

const fs = require('react-native-fs');
const RCTUpdate = NativeModules.Update;
const FileTransfer = require('@remobile/react-native-file-transfer');
const Zip = require('@remobile/react-native-zip');

RCTUpdate.getLocalValue('JS_VERSION_CLEAR', (val) => {
    if (val === 'yes') {
        JS_VERISON_CODE = 0;
        AsyncStorage.setItem(JS_VERISON_ITEM_NAME, '0');
        app.updateMgr.setNeedShowSplash(true);
        RCTUpdate.setLocalValue('JS_VERSION_CLEAR', '');
    } else {
        AsyncStorage.getItem(JS_VERISON_ITEM_NAME).then((version) => {
            JS_VERISON_CODE = (version || 0) * 1;
        });
    }
});

const IS_ANDROID = Platform.OS === 'android';
const DOCUMENT_FILE_PATH = RCTUpdate.documentFilePath;
const WWW_PATH = DOCUMENT_FILE_PATH + 'www';
const CACHE_PATH = DOCUMENT_FILE_PATH + '_www';
const JS_BUNDLE_ZIP_PATH = DOCUMENT_FILE_PATH + 'www.zip';

function updateApp (options) {
    console.log('updateApp');
    if (IS_ANDROID) {
        downloadApkFromServer(options);
    } else {
        RCTUpdate.installFromAppStore(options.trackViewUrl);
    }
}
function downloadApkFromServer (options) {
    console.log('downloadApkFromServer', options);
    let oldval;
    const fileTransfer = new FileTransfer();
    const { androidApkUrl, androidApkDownloadDestPath, onDownloadAPKProgress, onDownloadAPKStart, onDownloadAPKEnd, onError } = options;
    if (onDownloadAPKProgress) {
        fileTransfer.onprogress = (progress) => {
            console.log('downloadApkFromServer', progress.loaded, progress.total, progress);
            const val = parseInt(progress.loaded * 100 / (progress.total || 0.1));
            if (oldval !== val) {
                onDownloadAPKProgress(val);
                oldval = val;
            }
        };
    }
    onDownloadAPKStart && onDownloadAPKStart();
    fileTransfer.download(
        androidApkUrl,
        androidApkDownloadDestPath,
        (result) => {
            onDownloadAPKEnd && onDownloadAPKEnd();
            RCTUpdate.installApk(androidApkDownloadDestPath);
            setTimeout(() => {
                onError && onError(ERROR_FAILED_INSTALL);
            }, 500);
        },
        (error) => {
            onError && onError(ERROR_DOWNKOAD_APK);
        },
        true
    );
}
function updateJS (options) {
    console.log('updateJS');
    let oldval;
    const fileTransfer = new FileTransfer();
    const { jsbundleUrl, jsVersionCode, onDownloadJSProgress, onDownloadJSStart, onDownloadJSEnd, onError } = options;
    const newJsbundleUrl = (JS_VERISON_CODE < jsVersionCode - 1) ? jsbundleUrl.replace(/\.zip/, '_all.zip') : jsbundleUrl;

    if (onDownloadJSProgress) {
        fileTransfer.onprogress = (progress) => {
            console.log('downloadJSFromServer', progress.loaded, progress.total, progress);
            const val = parseInt(progress.loaded * 100 / (progress.total || 0.1));
            if (oldval !== val) {
                onDownloadJSProgress && onDownloadJSProgress(val);
                oldval = val;
            }
        };
    }
    onDownloadJSStart && onDownloadJSStart();
    fileTransfer.download(
        newJsbundleUrl,
        JS_BUNDLE_ZIP_PATH,
        (result) => {
            onDownloadJSEnd && onDownloadJSEnd();
            unzipJSZipFile(options);
        },
        (error) => {
            onError && onError(ERROR_DOWNKOAD_JS);
        },
        true
    );
}
function saveLocalJsVersion (ver) {
    return new Promise((resolve, reject) => {
        AsyncStorage.setItem(JS_VERISON_ITEM_NAME, ver + '').then(() => {
            JS_VERISON_CODE = ver;
            resolve();
        }).catch((err) => {
            resolve();
        });
    });
}
function deleteDir (path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path).then(() => {
            resolve();
        }).catch((err) => {
            resolve();
        });
    });
}
async function unzipJSZipFile (options) {
    console.log('unzipJSZipFile', options);
    let oldval;
    const { jsVersionCode, onUnzipJSProgress, onUnzipJSStart, onUnzipJSEnd, onError } = options;
    let onprogress;
    if (onUnzipJSProgress) {
        onprogress = (progress) => {
            const val = parseInt(progress.loaded * 100 / progress.total);
            if (oldval !== val) {
                onUnzipJSProgress(val);
                oldval = val;
            }
        };
    }
    onUnzipJSStart && onUnzipJSStart();
    Zip.unzip(JS_BUNDLE_ZIP_PATH, DOCUMENT_FILE_PATH, async (res) => {
        await deleteDir(JS_BUNDLE_ZIP_PATH);
        if (res) {
            onError && onError(ERROR_UNZIP_JS);
        } else {
            try {
                let needCopyFiles = JSON.parse(await fs.readFile(CACHE_PATH + '/needCopyFiles.json'));
                if (JS_VERISON_CODE === 0) {
                    for (let file of needCopyFiles) {
                        await fs.mkdir(CACHE_PATH + '/' + file.replace(/[^/]*$/, ''));
                        if (IS_ANDROID) {
                            await fs.copyFileRes(file.replace(/.*\/(.*)/, '$1'), CACHE_PATH + '/' + file);
                        } else {
                            await fs.copyFile(fs.MainBundlePath + '/' + file, CACHE_PATH + '/' + file);
                        }
                    }
                } else {
                    for (let file of needCopyFiles) {
                        await fs.mkdir(CACHE_PATH + '/' + file.replace(/[^/]*$/, ''));
                        await fs.copyFile(WWW_PATH + '/' + file, CACHE_PATH + '/' + file);
                    }
                }
            } catch (e) {
                console.log('unzip erorr:', e);
                await deleteDir(CACHE_PATH);
                onError && onError(ERROR_UNZIP_JS);
                return;
            }
            await deleteDir(WWW_PATH);
            await fs.unlink(CACHE_PATH + '/needCopyFiles.json');
            await fs.moveFile(CACHE_PATH, WWW_PATH);
            await saveLocalJsVersion(jsVersionCode);
            await app.updateMgr.setNeedShowSplash(true);
            onUnzipJSEnd && onUnzipJSEnd();
            RCTUpdate.restartApp();
        }
    }, onprogress);
}
function GET (url, success, error) {
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
function getServerVersion (options) {
    const { versionUrl } = options;
    console.log('getServerVersion', versionUrl);
    GET(versionUrl, getServerVersionSuccess.bind(null, options), getServerVersionError.bind(null, options));
}
function getServerVersionSuccess (options, remote) {
    console.log('getServerVersionSuccess', options, remote);
    const { iosVersion, resolve, versionName, currentVersion, versionCode, trackViewUrl } = options;
    const jsVersionCode = IS_ANDROID ? remote.androidJsVersionCode : remote.iosJsVersionCode;
    const description = IS_ANDROID ? remote.androidDescription : remote.iosDescription;
    if (!IS_ANDROID && versionName !== iosVersion && iosVersion) {
        if (versionName < iosVersion) {
            resolve({ currentVersion, description, newVersion: iosVersion + '.0', trackViewUrl });
        } else {
            resolve({ currentVersion });
        }
    } else if (IS_ANDROID && versionName !== remote.versionName) {
        if (versionName < remote.versionName) {
            resolve({ currentVersion, description, newVersion: remote.versionName + '.0' });
        } else {
            resolve({ currentVersion });
        }
    } else if (JS_VERISON_CODE < jsVersionCode) {
        resolve({ currentVersion, description, newVersion: versionName + '.' + jsVersionCode, jsVersionCode });
    } else {
        resolve({ currentVersion });
    }
}
function getAppStoreVersion (options) {
    const { iosAppId } = options;
    if (!iosAppId) {
        console.log('getAppStoreVersion without appID');
        getServerVersion(options);
        return;
    }
    console.log('getAppStoreVersion with appID:', iosAppId);
    GET('http://itunes.apple.com/lookup?id=' + iosAppId, getAppStoreVersionSuccess.bind(null, options), getServerVersionError.bind(null, options));
}
function getAppStoreVersionSuccess (options, data) {
    console.log('getAppStoreVersionSuccess', data);
    if (data.resultCount < 1) {
        getServerVersionError(options);
        return;
    }
    const result = data.results[0];
    options.iosVersion = result.version;
    options.trackViewUrl = result.trackViewUrl;
    getServerVersion(options);
}
function getServerVersionError (options, error) {
    console.log('getServerVersionError', error);
    options.resolve();
}
function checkVersion (options) {
    return new Promise((resolve) => {
        Object.assign(options, {
            resolve,
            versionName: RCTUpdate.versionName + '.' + RCTUpdate.versionCode,
            currentVersion: RCTUpdate.versionName + '.' + JS_VERISON_CODE,
            versionCode: RCTUpdate.versionCode,
        });
        if (IS_ANDROID) {
            getServerVersion(options);
        } else {
            getAppStoreVersion(options);
        }
    });
}

module.exports = {
    getVersion: () => RCTUpdate.versionName + '.' + JS_VERISON_CODE,
    checkVersion,
    updateApp,
    updateJS,
};
