# React Native Update (remobile)
Update js version and app version for ios and android

## Installation
```sh
npm install @remobile/react-native-update --save
```

### Installation (iOS)
* Drag RCTUpdate.xcodeproj to your project on Xcode.
* Click on your main project file (the one that represents the .xcodeproj) select Build Phases and drag libRCTUpdate.a from the Products folder inside the RCTUpdate.xcodeproj.
* Look for Header Search Paths and make sure it contains both $(SRCROOT)/../../../react-native/React as recursive.

### Installation (Android)
```gradle
...
include ':react-native-update'
project(':react-native-update').projectDir = new File(settingsDir, '../node_modules/@remobile/react-native-update/android')
```

* In `android/app/build.gradle`

```gradle
...
dependencies {
    ...
    compile project(':react-native-update')
}
```

* register module (in MainActivity.java)

```java
......
import com.remobile.update.RCTUpdateMgr;  // <--- import

......
public class MainApplication extends Application implements ReactApplication {
    private RCTUpdateMgr mUpdateMgr; // <------ add here

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        ......
        @Override
        protected String getJSBundleFile() {
            return mUpdateMgr.getBundleUrl();   // <------ change here
        }

        @Override
        protected List<ReactPackage> getPackages() {
            mUpdateMgr = new RCTUpdateMgr(MainActivity.activity);

            return Arrays.<ReactPackage>asList(
            ......
            mUpdateMgr.getReactPackage(),       // <------ add here
            ......
            );
        }
    };
    ......
}
```

## Usage

### Example
```js
var React = require('react');
var ReactNative = require('react-native');
var {
    StyleSheet,
    View,
    Text,
} = ReactNative;

var Update = require('@remobile/react-native-update');
var Button = require('@remobile/react-native-simple-button');
var Dialogs = require('@remobile/react-native-dialogs');
var ProgressBar = require('react-native-progress-bar');
var SERVER = 'http://192.168.1.119:3000/';


var
STATUS_NONE = 0,
STATUS_DOWNLOAD_APK_PROGESS = 1,
STATUS_DOWNLOAD_JS_PROGESS = 2,
STATUS_UNZIP_JS_PROGESS = 3,
STATUS_UPDATE_END = 4;

var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_GET_VERSION = 3,
ERROR_UNZIP_JS = 4;

var ERRORS = ['无错误','下载apk出错','下载js bundle错误','获取版本信息出错','解压程序出错'];
var PROGRESS_WIDTH = sr.w*5/6;

var ProgressInfo = React.createClass({
    render() {
        return (
            <View>
                <Text>{this.props.title} [{parseInt(this.props.progress*100)}%]</Text>
                <ProgressBar
                    fillStyle={{}}
                    backgroundStyle={{backgroundColor: '#cccccc', borderRadius: 2}}
                    style={{marginTop: 10, width:PROGRESS_WIDTH}}
                    progress={this.props.progress}
                    />
                <View style={styles.progressText}>
                    <Text>0</Text>
                    <Text>100</Text>
                </View>
            </View>
        );
    }
});

module.exports = React.createClass({
    getInitialState() {
        return {
            status:STATUS_NONE,
            progress: 0,
        };
    },
    getShowVerion(version) {
        return version.versionName+'.'+version.jsVersionCode;
    },
    needUpdateApp(oldVersion, newVersion, callback) {
        var msg = '当前版本:'+this.getShowVerion(oldVersion)+'，发现新版本:'+this.getShowVerion(newVersion);
        Dialogs.confirm(
            msg,
            (i) => {callback(i==1?0:1)},
            '提示',
            ['立即更新','稍后提示']
        );
    },
    needUpdateJS(oldVersion, newVersion, callback) {
        var msg = '当前版本:'+this.getShowVerion(oldVersion)+'，发现新版本:'+this.getShowVerion(newVersion);
        Dialogs.confirm(
            msg,
            (i) => {callback(i==1?0:1)},
            '提示',
            ['立即更新','稍后提示']
        );
    },
    testUpdate() {
        var update = new Update({
            versionUrl:SERVER+'version.json',
            jsbundleUrl:app.isandroid?SERVER+'www/android/www.zip':SERVER+'www/ios/www.zip',
            androidApkUrl:SERVER+'KitchenSink.apk',
            androidApkDownloadDestPath:'/Users/fang/rn/KitchenSink/App/vaccinum/server/image/fang.apk',
            iosAppId: 9,
            needUpdateApp: this.needUpdateApp,
            needUpdateJS: this.needUpdateJS,
            onDownloadAPKStart:()=>{},
            onDownloadAPKProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_APK_PROGESS,progress:progress})},
            onDownloadAPKEnd:()=>{},
            onDownloadJSStart:()=>{},
            onDownloadJSProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_JS_PROGESS,progress:progress})},
            onDownloadJSEnd:()=>{},
            onUnzipJSStart:()=>{},
            onUnzipJSProgress:(progress)=>{this.setState({status: STATUS_UNZIP_JS_PROGESS,progress:progress})},
            onUnzipJSEnd:()=>{this.setState({status: STATUS_UPDATE_END})},
            onNewestVerion:()=>{this.setState({status: STATUS_NONE});Dialogs.alert('这已经是最新版本了，无需更新!', null, '提示', '确定' )},
            onError:(errCode)=>{this.setState({status: STATUS_NONE});Dialogs.alert(ERRORS[errCode]||'未知错误', null, '错误提示', '确定' )},
        })
        update.start();
    },
    render() {
        setTimeout((function() {
            var progress = this.state.progress;
            progress += 0.01;
            if (progress > 1) {
                progress = 0;
            }
            this.setState({ progress: progress});
        }).bind(this), 200);
        var components = {};
        components[STATUS_NONE] = (
            <View>
                <Text>当前版本{this.getShowVerion(Update.getVersion())}</Text>
                <Button onPress={this.testUpdate}>update</Button>
            </View>
        );
        components[STATUS_DOWNLOAD_APK_PROGESS] = (
            <ProgressInfo
                title="正在下载APK"
                progress={this.state.progress} />
        );
        components[STATUS_DOWNLOAD_JS_PROGESS] = (
            <ProgressInfo
                title="正在下载Bundle文件"
                progress={this.state.progress} />
        );
        components[STATUS_UNZIP_JS_PROGESS] = (
            <ProgressInfo
                title="正在解压Bundle文件"
                progress={this.state.progress} />
        );
        components[STATUS_UPDATE_END] = (
            <Text>正在重启...</Text>
        );
        return (
            <View style={styles.container}>
                {components[this.state.status]}
            </View>Â
        );
    },
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    progressText: {
        flexDirection:'row',
        justifyContent:'space-between',
        width: sr.w*5/6,
    },
});
```

## Method
- `Update.getVersion` - get current version
    * return value is {versionName: x.x, versionCode: x,jsVersionCode: x}

## Check Update
```js
var update = new Update(options);
update.start();
```
### Options
    * versionUrl:the url of verison on server:
        * format: { "versionCode":1, "versionName":"1.0", "jsVersionCode":2, "description":"hello"}
        * this structor will pass to needUpdateApp and needUpdateJS if your set them, so you can customize the format, but versionCode and jsVersionCode  keep.
    * jsbundleUrl:the js bundle url
        * only js code changed or images resource changed, I wish you publish jsbundle, called Minor version
        * include www/index.android.bundle or www/index.ios.bundle
        * include image dir on android, and assets dir on ios
        * on android, image dir include some dynamic image(the new images this version add)
        * publish Minor version you should increase jsVersionCode
    * androidApkUrl:this apk url
        * only the native code changed, you need to publish apk on android or ipa on ios, called Marjor version
        * publish Marjor version you should increase versionCode and set jsVersionCode to 0
    * androidApkDownloadDestPath:where apk file download, e.g:/sdcard/download, make sure it exists
    * iosAppId:the appid on app Store
    * needUpdateApp: function
        * will be pass oldVersion, newVersion, callback 3 parameters
        * callback(0) will goon download apk
        * callback(1) will terminate download apk
    * needUpdateJS:function
        * will be pass oldVersion, newVersion, callback 3 parameters
        * callback(0) will goon download jsbundle
        * callback(1) will terminate download jsbundle
    * onDownloadAPKStart:function
        * callback when apk start download
    * onDownloadAPKProgress:function
        * callback when apk is downloading,
        * will be pass {total:xx, loaded:xx} 1 parameter
    * onDownloadAPKEnd:function
        * callback when apk download end
    * onDownloadJSStart:function
    * onDownloadJSProgress:function
        * callback when apk is downloading,
        * will be pass {total:xx, loaded:xx} 1 parameter
    * onDownloadJSEnd:function
    * onUnzipJSStart:function
    * onUnzipJSProgress:function
        * callback when unzip jsbundle is downloading,
        * will be pass {total:xx, loaded:xx} 1 parameter
    * onUnzipJSEnd:function
    * onNewestVerion:function
    * onError:function
        * will be pass errorCode
        * var ERROR_NULL = 0, ERROR_DOWNKOAD_APK = 1, ERROR_DOWNKOAD_JS = 2, ERROR_GET_VERSION = 3, ERROR_UNZIP_JS = 4;

## Generate Bundle
```bash
#!/bin/bash

function genIOSBundle() {
    mkdir -p tools/www/ios/www
    react-native bundle \
        --platform ios \
        --reset-cache \
        --verbose \
        --entry-file index.ios.js \
        --bundle-output ./tools/www/ios/www/index.ios.bundle \
        --assets-dest ./tools/www/ios/www \
        --dev false
}

function genAndroidBundle() {
    mkdir -p tools/www/android/www
    react-native bundle \
        --platform android \
        --reset-cache \
        --verbose \
        --entry-file index.android.js \
        --bundle-output ./tools/www/android/www/index.android.bundle \
        --assets-dest ./tools/www/android/www \
        --dev false
}

function zipWWW() {
    node -e "!function(){function i(e,r){var o=n.readdirSync(e);o.forEach(function(o){var s=e+'/'+o;n.statSync(s).isDirectory()?i(s,r+'/'+o):c.folder(r).file(o,n.readFileSync(s))})}function e(e,r,o){r=r||'',o=o||e+'.zip',i(e,r);var s=c.generate({base64:!1,compression:'DEFLATE'});n.writeFile(o,s,'binary',function(){console.log('success')})}var r=require('jszip'),n=require('fs'),c=new r,o=process.argv.splice(1);e.apply(null,o)}();"  www www www.zip
}

function zipAndroid() {
    cd ./tools/www/android
    zipWWW
    cd ../..
    mv ./www/android/www.zip ../../server/public/download/apks/admin/apks/jsAndroid/jsandroid.zip
    rm -fr www
    echo "../../server/public/download/apks/admin/apks/jsAndroid/jsandroid.zip"
}

function zipIos() {
    cd ./tools/www/ios
    zipWWW
    cd ../..
    mv ./www/ios/www.zip ../../server/public/download/apks/admin/apks/jsIos/jsios.zip
    rm -fr www
    echo "../../server/public/download/apks/admin/apks/jsIos/jsios.zip"
}

function buildAndroid() {
    rm -fr www
    mkdir www
    cd ..
    genAndroidBundle
    zipAndroid
}

function buildIos() {
    rm -fr www
    mkdir www
    cd ..
    genIOSBundle
    zipIos
}

function main() {
    if [ "$1" = "android" ];then
        buildAndroid
    elif [ "$1" = "ios" ];then
        buildIos
    else
        buildAndroid
        buildIos
    fi
}

main $@
```
* make sure install jszip use npm in global, we use it zip

### see detail use
* https://github.com/remobile/react-native-template

#### tools at
[useful tools](https://github.com/remobile/react-native-template/blob/master/project/tools)

#### example in react-native-template
[Update](https://github.com/remobile/react-native-template/blob/master/project/App/modules/person/Update.js)
