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
#### UpdatePage.js
```js
'use strict';
var React = require('react');
var ReactNative = require('react-native');
var {
    StyleSheet,
    View,
    Text,
    Image,
} = ReactNative;

var Update = require('@remobile/react-native-update');

var
STATUS_GET_VERSION = 0,
STATUS_HAS_VEW_VERSION = 1,
STATUS_HAS_NOT_VEW_VERSION = 2,
STATUS_DOWNLOAD_APK_PROGESS = 3,
STATUS_DOWNLOAD_JS_PROGESS = 4,
STATUS_UNZIP_JS_PROGESS = 5,
STATUS_GET_VERSION_ERROR = 6,
STATUS_DOWNKOAD_APK_ERROR = 7,
STATUS_DOWNKOAD_JS_ERROR = 8,
STATUS_UNZIP_JS_ERROR = 9,
STATUS_FAILED_INSTALL_ERROR = 10,
STATUS_UPDATE_END = 11;

var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_FAILED_INSTALL = 3,
ERROR_UNZIP_JS = 4;

var PROGRESS_WIDTH = sr.tw*0.7;
var {Button, ProgressBar} = COMPONENTS;

var ProgressInfo = React.createClass({
    render() {
        const { progress } = this.props;
        if (progress < 1000) {
            return (
                <View>
                    <Text>{this.props.title} [{progress}%]</Text>
                    <ProgressBar
                        fillStyle={{}}
                        backgroundStyle={{backgroundColor: '#cccccc', borderRadius: 2}}
                        style={{marginTop: 10, width:PROGRESS_WIDTH}}
                        progress={progress/100.0}
                        />
                    <View style={styles.progressText}>
                        <Text>0</Text>
                        <Text>100</Text>
                    </View>
                </View>
            );
        } else {
            let size = progress/1000/1024/1024;
            return (
                <View style={{flex: 1, alignItems: 'center'}}>
                    <Text>{this.props.title} [{size.toFixed(2)} M]</Text>
                </View>
            );
        }
    }
});

module.exports = React.createClass({
    getInitialState() {
        const {options} = this.props;
        return {
            options,
            status: !options ? STATUS_GET_VERSION : options.newVersion ? STATUS_HAS_VEW_VERSION : STATUS_HAS_NOT_VEW_VERSION,
            progress: 0,
        };
    },
    componentWillMount() {
        if (!this.state.options) {
            Update.checkVersion({
                versionUrl: app.route.ROUTE_VERSION_INFO_URL,
                iosAppId: CONSTANTS.IOS_APPID,
            }).then((options)=>{
                this.setState({options, status: !options ? STATUS_GET_VERSION_ERROR : options.newVersion ? STATUS_HAS_VEW_VERSION : STATUS_HAS_NOT_VEW_VERSION});
            })
        }
    },
    onError(errCode) {
        if (errCode == ERROR_DOWNKOAD_APK) {
            this.setState({status: STATUS_DOWNKOAD_APK_ERROR});
        } else if (errCode == ERROR_DOWNKOAD_JS) {
            this.setState({status: STATUS_DOWNKOAD_JS_ERROR});
        } else if (errCode == ERROR_FAILED_INSTALL) {
            this.setState({status: STATUS_FAILED_INSTALL_ERROR});
        } else if (errCode == ERROR_UNZIP_JS) {
            this.setState({status: STATUS_UNZIP_JS_ERROR});
        }
    },
    doUpdate() {
        const {jsVersionCode, trackViewUrl} = this.state.options;
        if (jsVersionCode !== undefined) {
            Update.updateJS({
                jsVersionCode,
                jsbundleUrl: app.isandroid?app.route.ROUTE_JS_ANDROID_URL:app.route.ROUTE_JS_IOS_URL,
                onDownloadJSProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_JS_PROGESS,progress})},
                onUnzipJSProgress:(progress)=>{this.setState({status: STATUS_UNZIP_JS_PROGESS,progress})},
                onUnzipJSEnd:()=>{this.setState({status: STATUS_UPDATE_END})},
                onError:(errCode)=>{this.onError(errCode)},
            });
        } else {
            Update.updateApp({
                trackViewUrl,
                androidApkUrl:app.route.ROUTE_APK_URL,
                androidApkDownloadDestPath:'/sdcard/yxjqd.apk',
                onDownloadAPKProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_APK_PROGESS,progress})},
                onError:(errCode)=>{this.onError(errCode)},
            });
        }
    },
    render() {
        var components = {};
        const {currentVersion, newVersion, description} = this.state.options||{currentVersion:Update.getVersion()};
        components[STATUS_GET_VERSION] = (
            <Text style={styles.textInfo}>正在获取版本号</Text>
        );
        components[STATUS_HAS_NOT_VEW_VERSION] = (
            <Text style={styles.textInfo}>当前版本已经是最新版本</Text>
        );
        components[STATUS_GET_VERSION_ERROR] = (
            <Text style={styles.textInfo}>获取版本信息失败，请稍后再试</Text>
        );
        components[STATUS_DOWNKOAD_APK_ERROR] = (
            <Text style={styles.textInfo}>下载apk文件失败，请稍后再试</Text>
        );
        components[STATUS_DOWNKOAD_JS_ERROR] = (
            <Text style={styles.textInfo}>下载js bundle失败，请稍后再试</Text>
        );
        components[STATUS_UNZIP_JS_ERROR] = (
            <Text style={styles.textInfo}>解压js bundle失败，请稍后再试</Text>
        );
        components[STATUS_FAILED_INSTALL_ERROR] = (
            <Text style={styles.textInfo}>你放弃了安装</Text>
        );
        components[STATUS_HAS_VEW_VERSION] = (
            <View style={styles.textInfoContainer}>
                <Text style={styles.textInfo}>发现新版本{newVersion}</Text>
                <View style={styles.descriptionContainer}>
                    {
                        description && description.map((item, i)=>{
                            return (
                                <Text style={styles.textInfo} key={i}>{(i+1)+'. '+item}</Text>
                            )
                        })
                    }
                </View>
                <Button onPress={this.doUpdate} style={styles.button_layer} textStyle={styles.button_text}>立即更新</Button>
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
                <View style={styles.logoContainer}>
                    <Image
                        resizeMode='stretch'
                        source={app.img.personal_logo}
                        style={styles.logo}
                        />
                    <Text style={styles.app_name}>赢销截拳道 V{currentVersion}</Text>
                </View>
                <View style={styles.functionContainer}>
                    {components[this.state.status]}
                </View>
            </View>
        );
    },
});


var styles = StyleSheet.create({
    container: {
        flex:1,
    },
    logoContainer: {
        alignItems:'center',
        marginTop: 52,
    },
    logo: {
        width: 83,
        height: 83,
    },
    app_name: {
        marginTop: 13,
        fontSize: 16,
        color: '#727272',
    },
    functionContainer: {
        flex: 1,
        width: sr.w,
        marginTop: 51,
        alignItems:'center',
    },
    button_layer: {
        width:178,
        height:49,
        borderRadius: 4,
        left: (sr.w-178)/2,
        position: 'absolute',
        bottom: 120,
        backgroundColor: '#DE3031',
    },
    button_text: {
        fontSize: 18,
        fontWeight: '400',
        color: '#FFFFFF',
        alignSelf: 'center',
        fontFamily: 'STHeitiSC-Medium',
    },
    progressText: {
        flexDirection:'row',
        justifyContent:'space-between',
        width: sr.w*0.7,
    },
    textInfoContainer: {
        flex: 1,
        width: sr.w,
    },
    textInfo: {
        color: '#000000',
        fontSize: 18,
        marginBottom: 6,
        textAlign: 'center',
    },
});
```

#### UpdateInfoBox.js
```js
'use strict';
var React = require('react');
var ReactNative = require('react-native');
var {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
} = ReactNative;

var Update = require('@remobile/react-native-update');

var
STATUS_HAS_VEW_VERSION = 0,
STATUS_DOWNLOAD_APK_PROGESS = 1,
STATUS_DOWNLOAD_JS_PROGESS = 2,
STATUS_UNZIP_JS_PROGESS = 3,
STATUS_DOWNKOAD_APK_ERROR = 4,
STATUS_DOWNKOAD_JS_ERROR = 5,
STATUS_UNZIP_JS_ERROR = 6,
STATUS_FAILED_INSTALL_ERROR = 7,
STATUS_UPDATE_END = 8;

var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_FAILED_INSTALL = 3,
ERROR_UNZIP_JS = 4;

var PROGRESS_WIDTH = sr.tw*0.7;
var {Button, ProgressBar} = COMPONENTS;

var ProgressInfo = React.createClass({
    render() {
        const { progress } = this.props;
        if (progress < 1000) {
            return (
                <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                    <Text>{this.props.title} [{progress}%]</Text>
                    <ProgressBar
                        fillStyle={{}}
                        backgroundStyle={{backgroundColor: '#cccccc', borderRadius: 2}}
                        style={{marginTop: 10, width:PROGRESS_WIDTH}}
                        progress={progress/100.0}
                        />
                    <View style={styles.progressText}>
                        <Text>0</Text>
                        <Text>100</Text>
                    </View>
                </View>
            );
        } else {
            let size = progress/1000/1024/1024;
            return (
                <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                    <Text>{this.props.title} [ {size.toFixed(2)} M ]</Text>
                </View>
            );
        }
    }
});

module.exports = React.createClass({
    getInitialState() {
        return {
            status:STATUS_HAS_VEW_VERSION,
            progress: 0,
        };
    },
    onError(errCode) {
        if (errCode == ERROR_DOWNKOAD_APK) {
            this.setState({status: STATUS_DOWNKOAD_APK_ERROR});
        } else if (errCode == ERROR_DOWNKOAD_JS) {
            this.setState({status: STATUS_DOWNKOAD_JS_ERROR});
        } else if (errCode == ERROR_FAILED_INSTALL) {
            this.setState({status: STATUS_FAILED_INSTALL_ERROR});
        } else if (errCode == ERROR_UNZIP_JS) {
            this.setState({status: STATUS_UNZIP_JS_ERROR});
        }
    },
    doUpdate() {
        const {jsVersionCode, trackViewUrl} = this.props.options;
        if (jsVersionCode !== undefined) {
            Update.updateJS({
                jsVersionCode,
                jsbundleUrl: app.isandroid?app.route.ROUTE_JS_ANDROID_URL:app.route.ROUTE_JS_IOS_URL,
                onDownloadJSProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_JS_PROGESS,progress})},
                onUnzipJSProgress:(progress)=>{this.setState({status: STATUS_UNZIP_JS_PROGESS,progress})},
                onUnzipJSEnd:()=>{this.setState({status: STATUS_UPDATE_END})},
                onError:(errCode)=>{this.onError(errCode)},
            });
        } else {
            Update.updateApp({
                trackViewUrl,
                androidApkUrl:app.route.ROUTE_APK_URL,
                androidApkDownloadDestPath:'/sdcard/yxjqd.apk',
                onDownloadAPKProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_APK_PROGESS,progress})},
                onError:(errCode)=>{this.onError(errCode)},
            });
        }
    },
    render() {
        const components = {};
        const {newVersion, description} = this.props.options;
        components[STATUS_HAS_VEW_VERSION] = (
            <View style={styles.functionContainer}>
                <Text style={styles.title}>{`发现新版本(${newVersion})`}</Text>
                <Text style={styles.redLine}>
                </Text>
                <Text style={styles.content}>
                    {"更新内容："}
                </Text>
                {
                    description.map((item, i)=>{
                        return (
                            <Text style={styles.contentItem} key={i}>{'- '+item}</Text>
                        )
                    })
                }
                <View style={styles.buttonViewStyle}>
                    <TouchableOpacity
                        onPress={app.closeModal}
                        style={styles.buttonStyleContainCannel}>
                        <Text style={styles.buttonStyleCannel}>以后再说</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={this.doUpdate}
                        style={styles.buttonStyleContain}>
                        <Text style={styles.buttonStyle} >立即更新</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
        components[STATUS_DOWNKOAD_APK_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>下载apk文件失败，请在设置里重新更新</Text>
                <TouchableOpacity
                    onPress={app.closeModal}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
            </View>
        );
        components[STATUS_DOWNKOAD_JS_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>下载js bundle失败，请在设置里重新更新</Text>
                <TouchableOpacity
                    onPress={app.closeModal}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
            </View>
        );
        components[STATUS_UNZIP_JS_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>解压js bundle失败，请在设置里重新更新</Text>
                <TouchableOpacity
                    onPress={app.closeModal}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
            </View>
        );
        components[STATUS_FAILED_INSTALL_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>你放弃了安装</Text>
                <TouchableOpacity
                    onPress={app.closeModal}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
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
            <Text>即将重启...</Text>
        );
        return (
            <View style={styles.container}>
                {components[this.state.status]}
            </View>
        );
    },
});


var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    functionContainer: {
        width:sr.w-60,
        backgroundColor:'#FFFFFF',
    },
    progressText: {
        flexDirection:'row',
        justifyContent:'space-between',
        width: sr.w*0.7,
    },
    textInfo: {
        color: '#000000',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonViewStyle: {
        flexDirection: 'row',
        width: sr.w-40,
        height: 60,
        justifyContent: 'center',
    },
    redLine: {
        marginTop: 15,
        width: sr.w-60,
        height: 1,
        backgroundColor: '#DE3031'
    },
    buttonStyleContain: {
        width: 120,
        height: 35,
        marginLeft: 30,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor: '#DE3031',
    },
    buttonStyleContainCannel: {
        width: 120,
        height: 35,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#DE3031',
    },
    buttonStyle: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'STHeitiSC-Medium',
    },
    buttonStyleCannel: {
        fontSize: 16,
        color: '#DE3031',
        fontFamily: 'STHeitiSC-Medium',
    },
    title: {
        color: '#DE3031',
        fontSize: 18,
        textAlign: 'center',
        overflow: 'hidden',
        marginTop: 15,
        fontFamily: 'STHeitiSC-Medium',
    },
    content: {
        color:'#000000',
        marginTop: 10,
        marginBottom: 10,
        marginHorizontal: 20,
        fontSize:16,
        fontFamily: 'STHeitiSC-Medium',
    },
    contentItem: {
        color:'#000000',
        marginBottom: 10,
        marginHorizontal: 20,
        fontSize:12,
    },
});
```

## Method
- `Update.getVersion` - get current version
    * return value is x.x.x
- `Update.checkVersion` - check server version
- `Update.updateApp` - update apk or ios appstore
- `Update.updateJS` - update js bundle file


## Check Version And Show Update Dialog
```js
const Update = require('@remobile/react-native-update');
const UpdateInfoBox = require('../modules/update/UpdateInfoBox');
Update.checkVersion({
    versionUrl: app.route.ROUTE_VERSION_INFO_URL,
    iosAppId: CONSTANTS.IOS_APPID,
}).then((options)=>{
    if (options && options.newVersion) {
        app.showModal(<UpdateInfoBox options={options} />, {backgroundColor:'rgba(0, 0, 0, 0.6)'})
    }
})
```

## Check Version And Show Update Page
```js
const Update = require('@remobile/react-native-update');
const UpdatePage = require('../modules/update/UpdatePage');

Update.checkVersion({
    versionUrl: app.route.ROUTE_VERSION_INFO_URL,
    iosAppId: CONSTANTS.IOS_APPID,
}).then((options)=>{
    app.navigator.push({
        title: '在线更新',
        component: UpdatePage,
        passProps: {options},
    });
})
```

### Options
    * versionUrl:the url of verison on server:
        * format: { "versionCode":1, "versionName":"1.0", "jsVersionCode":2, "description":"hello"}
        * this structor will pass to needUpdateApp and needUpdateJS if your set them, so you can customize the format, but versionCode and jsVersionCode  keep.
    * iosAppId:the appid on app Store

## Update App Or JS
```js
doUpdate() {
    const {jsVersionCode, trackViewUrl} = this.props.options;
    if (jsVersionCode !== undefined) {
        Update.updateJS({
            jsVersionCode,
            jsbundleUrl: app.isandroid?app.route.ROUTE_JS_ANDROID_URL:app.route.ROUTE_JS_IOS_URL,
            onDownloadJSProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_JS_PROGESS,progress})},
            onUnzipJSProgress:(progress)=>{this.setState({status: STATUS_UNZIP_JS_PROGESS,progress})},
            onUnzipJSEnd:()=>{this.setState({status: STATUS_UPDATE_END})},
            onError:(errCode)=>{this.onError(errCode)},
        });
    } else {
        Update.updateApp({
            trackViewUrl,
            androidApkUrl:app.route.ROUTE_APK_URL,
            androidApkDownloadDestPath:'/sdcard/yxjqd.apk',
            onDownloadAPKProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_APK_PROGESS,progress})},
            onError:(errCode)=>{this.onError(errCode)},
        });
    }
},
```

### Options
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

### server side version.json
```json
{
    "iosPassed": true,
    "iosJsVersionCode":0,
    "iosDescription":["修正bug", "添加新功能"],
    "androidPassed": {
        "baidu": false,
        "default": true
    },
    "versionName":"1.0",
    "versionCode": 1048576,
    "androidJsVersionCode":0,
    "androidDescription": ["修改bug", "添加新功能"]
}
```

### see detail use
* https://github.com/remobile/react-native-template

#### tools at
[useful tools](https://github.com/remobile/react-native-template/blob/master/project/tools)

#### example in react-native-template
[Update](https://github.com/remobile/react-native-template/blob/master/project/App/modules/update)
