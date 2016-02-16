//
//  RCTUpdate.m
//  RCTUpdate
//
//  Created by fangyunjiang on 15/12/15.
//  Copyright © 2015年 remobile. All rights reserved.
//

#import "RCTBridge.h"
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
    NSString *mainBundleFilePath = [RCTUpdate MainBundleFilePath];
    if ([[NSFileManager defaultManager] fileExistsAtPath:mainBundleFilePath]) {
        return [NSURL fileURLWithPath:mainBundleFilePath];
    }
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
//    return [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle?platform=ios&dev=true"];
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


RCT_EXPORT_METHOD(installFromAppStore:(nonnull NSNumber *)appId) {
    NSString *str = [NSString stringWithFormat: @"itms-apps://ax.itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Purple+Software&id=%d", [appId intValue]];
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:str]];
}

RCT_EXPORT_METHOD(restartApp) {
    dispatch_async(dispatch_get_main_queue(), ^{
        _bridge.bundleURL = [RCTUpdate getBundleUrl];
        [_bridge reload];
    });
}

@end
