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
project(':react-native-update').projectDir = new File(rootProject.projectDir, '../node_modules/@remobile/react-native-update/android')
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
import com.remobile.update.*;  // <--- import

public class MainActivity extends Activity implements DefaultHardwareBackBtnHandler {
  ......
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mReactRootView = new ReactRootView(this);

    mReactInstanceManager = ReactInstanceManager.builder()
      .setApplication(getApplication())
      .setBundleAssetName("index.android.bundle")
      .setJSMainModuleName("index.android")
      .addPackage(new MainReactPackage())
      .addPackage(new RCTUpdatePackage())              // <------ add here
      .setUseDeveloperSupport(BuildConfig.DEBUG)
      .setInitialLifecycleState(LifecycleState.RESUMED)
      .build();

    mReactRootView.startReactApplication(mReactInstanceManager, "ExampleRN", null);

    setContentView(mReactRootView);
  }

  ......
}
```

## Usage

### Example
```js
var React = require('react-native');
var {
    StyleSheet,
    View,
} = React;

var Toast = require('@remobile/react-native-toast').show;
var Update = require('@remobile/react-native-update');
var Button = require('@remobile/react-native-simple-button');

module.exports = React.createClass({
    testUpdate() {
        var update = new Update({
            versionUrl:'http://localhost:3000/version.json',
            jsbundleUrl:'http://192.168.1.119:3000/www.zip',
            androidApkUrl:'http://192.168.1.119:3000/fang.apk',
            androidApkDownloadDestPath:'/Users/fang/rn/KitchenSink/App/vaccinum/server/image/fang.apk',
            onDownloadAPKProgress:(progress)=>{console.log(progress)},
            onDownloadJSProgress:(progress)=>{console.log(progress)},
            onUnzipJSProgress:(progress)=>{console.log(progress)},
            onNewestVerion:()=>{console.log('this is newest version')},
            onError:(errCode)=>{console.log('error:', errCode)},
        })
        update.start();
    },
    render() {
        return (
            <View style={styles.container}>
                <Button onPress={this.testUpdate}>
                    test update
                </Button>
            </View>
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
});

```
