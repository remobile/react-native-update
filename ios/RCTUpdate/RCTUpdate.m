//
//  RCTUpdate.m
//  RCTUpdate
//
//  Created by fangyunjiang on 15/12/15.
//  Copyright © 2015年 remobile. All rights reserved.
//

#import <React/RCTBridge.h>
#import "RCTUpdate.h"

@interface RCTUpdate() {
    NSString *mainBundleFilePath;
    NSString *documentFilePath;
    NSString *versionName;
    int versionCode;
}
@end

@implementation RCTUpdate

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (NSURL*)getBundleUrl {
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    NSString *lastversionCode = [userDefaults objectForKey:@"APP_VERSION_CODE"];
    NSString *versionCode = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
    NSURL *bundle = nil;
    if (![lastversionCode isEqualToString:versionCode]) {
        [userDefaults setObject:versionCode forKey:@"APP_VERSION_CODE"];
        [userDefaults setObject:@"yes" forKey:@"JS_VERSION_CLEAR"];
        [userDefaults synchronize];
        NSFileManager *fileManager = [NSFileManager defaultManager];
        [fileManager removeItemAtPath:[[RCTUpdate DocumentFilePath] stringByAppendingString:@"www"] error:nil];
        bundle = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
        NSLog(@"=========use update asserts:%@", bundle);
        return bundle;
    }
    
    NSString *mainBundleFilePath = [RCTUpdate MainBundleFilePath];
    if ([[NSFileManager defaultManager] fileExistsAtPath:mainBundleFilePath]) {
        bundle = [NSURL fileURLWithPath:mainBundleFilePath];
        NSLog(@"=========use update:%@", bundle);
        return bundle;
    }
    bundle = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];

     NSLog(@"=========use asserts:%@", bundle);
    return bundle;
}

+ (NSString *)DocumentFilePath {
    return [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0]stringByAppendingString:@"/"];
}

+ (NSString *)MainBundleFilePath {
    return [[RCTUpdate DocumentFilePath] stringByAppendingString:@"www/index.ios.bundle"];
}

- (id)init {
    self = [super init];
    if (self) {
        documentFilePath = [RCTUpdate DocumentFilePath];
        mainBundleFilePath = [RCTUpdate MainBundleFilePath];
        versionName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
        versionCode = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"] intValue];
    }
    return self;
}

- (NSDictionary *)constantsToExport {
    return @{
             @"mainBundleFilePath":mainBundleFilePath,
             @"documentFilePath":documentFilePath,
             @"versionName":versionName,
             @"versionCode":@(versionCode),
             };
};

RCT_EXPORT_METHOD(installFromAppStore:(nonnull NSString *)trackViewURL) {
    UIApplication *application = [UIApplication sharedApplication];
    [application openURL:[NSURL URLWithString:trackViewURL]];
}

RCT_EXPORT_METHOD(restartApp) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [_bridge setValue:[RCTUpdate getBundleUrl] forKey:@"bundleURL"];
        [_bridge reload];
    });
}

RCT_EXPORT_METHOD(getLocalValue:(nonnull NSString *)tag callback:(RCTResponseSenderBlock)callback) {
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    NSString *ret = [userDefaults objectForKey:tag];
    if (ret == nil) {
        ret = @"";
    }
    callback(@[ret]);
}

RCT_EXPORT_METHOD(setLocalValue:(nonnull NSString *)tag value:(nonnull NSString *)value) {
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setObject:value forKey:tag];
    [userDefaults synchronize];
}

@end
