const fs = require('node:fs');
const path = require('node:path');
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const marker = '// GIK: Scene lifecycle bridge';

function patchAppDelegate(contents) {
  if (contents.includes(marker)) return contents;
  const startup = /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)[\s\S]*?#endif/;
  if (!startup.test(contents) || !contents.includes('var window: UIWindow?')) {
    throw new Error('Unexpected AppDelegate template: review the iOS scene lifecycle migration.');
  }
  const sceneDelegate = fs.readFileSync(path.join(__dirname, 'ios/GIKSceneDelegate.swift'), 'utf8');
  return contents
    .replace('var window: UIWindow?', 'var window: UIWindow?\n  var reactNativeLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?')
    .replace(startup, '    // SceneDelegate creates the scene window and starts React Native.\n    reactNativeLaunchOptions = launchOptions')
    + `\n${sceneDelegate}`;
}

function patchInfoPlist(info) {
  info.UIApplicationSceneManifest = {
    UIApplicationSupportsMultipleScenes: false,
    UISceneConfigurations: {
      UIWindowSceneSessionRoleApplication: [{
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).GIKSceneDelegate',
      }],
    },
  };
  return info;
}

module.exports = (config) => {
  config = withInfoPlist(config, (mod) => {
    mod.modResults = patchInfoPlist(mod.modResults);
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') throw new Error('Scene lifecycle bridge requires Swift AppDelegate.');
    mod.modResults.contents = patchAppDelegate(mod.modResults.contents);
    return mod;
  });
};
module.exports.patchAppDelegate = patchAppDelegate;
module.exports.patchInfoPlist = patchInfoPlist;
