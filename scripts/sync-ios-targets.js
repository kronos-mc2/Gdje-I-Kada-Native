#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const xcode = require('xcode');

const projectRoot = process.cwd();
const iosRoot = path.join(projectRoot, 'ios');
const projectPath = path.join(iosRoot, 'GIKTest.xcodeproj', 'project.pbxproj');
const devTargetName = 'GIKDev';
const testTargetName = 'GIKTest';
const devBundleId = 'com.anonymous.GdjeIKadaNative';
const testBundleId = 'com.anonymous.GdjeIKadaNative.test';
const devScheme = 'gdjeikadanative';
const testScheme = 'gdjeikadanative-test';
const mapLibrePackageDependency = 'D3822F36DE2C0336E8C55123';

ensureDevFiles();

const project = xcode.project(projectPath);
project.parse((error) => {
  if (error) {
    throw error;
  }

  const testTarget = findNativeTarget(project, testTargetName);
  if (!testTarget) {
    throw new Error(`Missing native iOS target ${testTargetName}`);
  }

  let devTarget = findNativeTarget(project, devTargetName);
  if (!devTarget) {
    devTarget = project.addTarget(devTargetName, 'application', devTargetName, devBundleId);
  }

  normalizePodsGroupPaths(project);
  ensureTargetAttributes(project, testTarget, devTarget.uuid);
  ensureTargetBuildPhases(project, testTarget, devTarget.uuid);
  ensureTargetPackageDependencies(project, devTarget.uuid);
  syncTargetBuildSettings(project, testTarget, devTarget.uuid);
  normalizeTargetBuildSettings(project, testTarget.uuid);
  normalizeTargetBuildSettings(project, devTarget.uuid);
  dedupeBuildPhaseFiles(project, testTarget.uuid);
  dedupeBuildPhaseFiles(project, devTarget.uuid);
  removeTargetDependencies(project, devTarget.uuid);
  updateSharedScheme(devTarget.uuid);

  fs.writeFileSync(projectPath, project.writeSync());
  console.log(`Synced iOS targets: ${devTargetName}, ${testTargetName}`);
});

function ensureDevFiles() {
  const sourceDir = path.join(iosRoot, testTargetName);
  const destDir = path.join(iosRoot, devTargetName);

  if (!fs.existsSync(destDir)) {
    fs.cpSync(sourceDir, destDir, { recursive: true });
  }

  renameIfNeeded(path.join(destDir, `${testTargetName}.entitlements`), path.join(destDir, `${devTargetName}.entitlements`));
  renameIfNeeded(
    path.join(destDir, `${testTargetName}-Bridging-Header.h`),
    path.join(destDir, `${devTargetName}-Bridging-Header.h`),
  );

  const infoPlistPath = path.join(destDir, 'Info.plist');
  const infoPlist = fs
    .readFileSync(infoPlistPath, 'utf8')
    .replaceAll('GIK Test', 'GIK Dev')
    .replaceAll(testScheme, devScheme)
    .replaceAll(testBundleId, devBundleId);
  fs.writeFileSync(infoPlistPath, infoPlist);
}

function renameIfNeeded(sourcePath, destPath) {
  if (fs.existsSync(destPath)) {
    return;
  }

  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, destPath);
  }
}

function findNativeTarget(project, targetName) {
  const nativeTargets = project.pbxNativeTargetSection();
  for (const [key, value] of Object.entries(nativeTargets)) {
    if (key.endsWith('_comment')) {
      continue;
    }

    if (stripQuotes(value?.name) === targetName) {
      return { uuid: key, target: value };
    }
  }

  return null;
}

function ensureTargetAttributes(project, templateTarget, devTargetUuid) {
  const attributes = project.getFirstProject().firstProject.attributes;
  attributes.TargetAttributes ||= {};

  if (!attributes.TargetAttributes[devTargetUuid]) {
    attributes.TargetAttributes[devTargetUuid] = structuredClone(attributes.TargetAttributes[templateTarget.uuid] ?? {});
  }
}

function ensureTargetBuildPhases(project, templateTarget, devTargetUuid) {
  const targetGroupKey = ensureTargetGroup(project, devTargetName);
  const podsGroupKey = project.findPBXGroupKey({ name: 'Pods' });

  ensureBuildPhase(project, devTargetUuid, 'PBXSourcesBuildPhase', 'Sources');
  ensureBuildPhase(project, devTargetUuid, 'PBXFrameworksBuildPhase', 'Frameworks');
  ensureBuildPhase(project, devTargetUuid, 'PBXResourcesBuildPhase', 'Resources');

  ensureFileReference(project, `ios/${devTargetName}/Info.plist`, targetGroupKey);
  ensureFileReference(project, `ios/${devTargetName}/${devTargetName}.entitlements`, targetGroupKey);
  ensureHeaderReference(project, `ios/${devTargetName}/${devTargetName}-Bridging-Header.h`, targetGroupKey);
  ensureSourceReference(project, `ios/${devTargetName}/AppDelegate.swift`, targetGroupKey, devTargetUuid);
  ensureSourceReference(
    project,
    'Target Support Files/Pods-GIKDev/ExpoModulesProvider.swift',
    podsGroupKey,
    devTargetUuid,
  );
  ensureResourceReference(project, `ios/${devTargetName}/Supporting/Expo.plist`, targetGroupKey, devTargetUuid);
  ensureResourceReference(project, `ios/${devTargetName}/Images.xcassets`, targetGroupKey, devTargetUuid);
  ensureResourceReference(project, `ios/${devTargetName}/SplashScreen.storyboard`, targetGroupKey, devTargetUuid);
  ensureResourceReference(project, `ios/${devTargetName}/PrivacyInfo.xcprivacy`, targetGroupKey, devTargetUuid);

  ensureShellPhase(project, templateTarget.uuid, devTargetUuid, '[Expo] Configure project');
  ensureShellPhase(project, templateTarget.uuid, devTargetUuid, 'Bundle React Native code and images');
  ensureShellPhase(project, templateTarget.uuid, devTargetUuid, 'Remove signature files (Xcode workaround)');
}

function ensureTargetGroup(project, groupName) {
  let groupKey = findAppTargetGroupKey(project, groupName);
  if (groupKey) {
    normalizeGroupPath(project, groupKey);
    return groupKey;
  }

  const newGroup = project.addPbxGroup([], groupName, groupName);
  groupKey = newGroup.uuid;
  normalizeGroupPath(project, groupKey);

  const mainGroup = project.findPBXGroupKey({ name: testTargetName });
  const mainGroupChildren = project.getPBXGroupByKey(mainGroup).children;
  mainGroupChildren.push({
    value: groupKey,
    comment: groupName,
  });

  return groupKey;
}

function findAppTargetGroupKey(project, groupName) {
  const groupSection = project.hash.project.objects.PBXGroup || {};

  for (const [key, value] of Object.entries(groupSection)) {
    if (key.endsWith('_comment')) {
      continue;
    }

    if (stripQuotes(value?.name) !== groupName) {
      continue;
    }

    const childComments = new Set((value.children || []).map((child) => child.comment));
    if (
      stripQuotes(value?.path) === groupName ||
      childComments.has('Info.plist') ||
      childComments.has('AppDelegate.swift')
    ) {
      return key;
    }
  }

  return null;
}

function normalizeGroupPath(project, groupKey) {
  const group = project.hash.project.objects.PBXGroup?.[groupKey];
  if (!group) {
    return;
  }

  delete group.path;
}

function normalizePodsGroupPaths(project) {
  const podsGroupKey = project.findPBXGroupKey({ name: 'Pods' });
  const podsGroup = project.hash.project.objects.PBXGroup?.[podsGroupKey];
  const fileRefs = project.pbxFileReferenceSection();

  if (!podsGroup) {
    return;
  }

  for (const child of podsGroup.children || []) {
    const fileRef = fileRefs[child.value];
    const filePath = stripQuotes(fileRef?.path);
    if (!filePath?.startsWith('Pods/')) {
      continue;
    }

    fileRef.path = `"${filePath.slice('Pods/'.length)}"`;
  }
}

function dedupeBuildPhaseFiles(project, targetUuid) {
  dedupePhaseFiles(project, project.pbxSourcesBuildPhaseObj(targetUuid));
  dedupePhaseFiles(project, project.pbxResourcesBuildPhaseObj(targetUuid));
}

function dedupePhaseFiles(project, phase) {
  if (!phase?.files?.length) {
    return;
  }

  const buildFileSection = project.pbxBuildFileSection();
  const fileRefSection = project.pbxFileReferenceSection();
  const seenPaths = new Set();

  phase.files = phase.files.filter((buildFile) => {
    const buildEntry = buildFileSection[buildFile.value];
    const filePath = stripQuotes(fileRefSection[buildEntry?.fileRef]?.path);
    const dedupeKey = filePath || buildFile.value;

    if (seenPaths.has(dedupeKey)) {
      delete buildFileSection[buildFile.value];
      delete buildFileSection[`${buildFile.value}_comment`];
      return false;
    }

    seenPaths.add(dedupeKey);
    return true;
  });
}

function ensureBuildPhase(project, targetUuid, buildPhaseType, comment) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const phases = target?.buildPhases || [];
  if (phases.some((phase) => phase.comment === comment)) {
    return;
  }

  project.addBuildPhase([], buildPhaseType, comment, targetUuid);
}

function ensureFileReference(project, absoluteLikePath, groupKey) {
  const relativePath = absoluteLikePath.replaceAll(/^ios\//g, '');
  if (project.hasFile(relativePath)) {
    return;
  }

  project.addFile(relativePath, groupKey);
}

function ensureHeaderReference(project, absoluteLikePath, groupKey) {
  const relativePath = absoluteLikePath.replaceAll(/^ios\//g, '');
  if (project.hasFile(relativePath)) {
    return;
  }

  project.addHeaderFile(relativePath, {}, groupKey);
}

function ensureSourceReference(project, absoluteLikePath, groupKey, targetUuid) {
  const relativePath = absoluteLikePath.replaceAll(/^ios\//g, '');
  if (sourcePhaseHasFile(project, targetUuid, relativePath)) {
    return;
  }

  if (!project.hasFile(relativePath)) {
    project.addFile(relativePath, groupKey);
  }

  addExistingFileToPhase(project, targetUuid, relativePath, 'PBXSourcesBuildPhase');
}

function ensureResourceReference(project, absoluteLikePath, groupKey, targetUuid) {
  const relativePath = absoluteLikePath.replaceAll(/^ios\//g, '');
  if (resourcePhaseHasFile(project, targetUuid, relativePath)) {
    return;
  }

  if (!project.hasFile(relativePath)) {
    project.addFile(relativePath, groupKey);
  }

  addExistingFileToPhase(project, targetUuid, relativePath, 'PBXResourcesBuildPhase');
}

function addExistingFileToPhase(project, targetUuid, relativePath, phaseType) {
  const fileRefKey = findFileRefKey(project, relativePath);
  if (!fileRefKey) {
    throw new Error(`Missing file reference for ${relativePath}`);
  }

  const buildFileUuid = project.generateUuid();
  const buildFileComment = `${path.basename(relativePath)} in ${phaseType === 'PBXSourcesBuildPhase' ? 'Sources' : 'Resources'}`;
  const buildFileSection = project.pbxBuildFileSection();
  buildFileSection[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: fileRefKey,
  };
  buildFileSection[`${buildFileUuid}_comment`] = buildFileComment;

  const phase = phaseType === 'PBXSourcesBuildPhase'
    ? project.pbxSourcesBuildPhaseObj(targetUuid)
    : project.pbxResourcesBuildPhaseObj(targetUuid);

  phase.files.push({
    value: buildFileUuid,
    comment: buildFileComment,
  });
}

function sourcePhaseHasFile(project, targetUuid, relativePath) {
  return phaseHasFile(project, project.pbxSourcesBuildPhaseObj(targetUuid), relativePath);
}

function resourcePhaseHasFile(project, targetUuid, relativePath) {
  return phaseHasFile(project, project.pbxResourcesBuildPhaseObj(targetUuid), relativePath);
}

function phaseHasFile(project, phase, relativePath) {
  const buildFileSection = project.pbxBuildFileSection();
  const fileRefSection = project.pbxFileReferenceSection();

  return (phase?.files ?? []).some((buildFile) => {
    const buildEntry = buildFileSection[buildFile.value];
    const fileRef = buildEntry?.fileRef;
    return stripQuotes(fileRefSection[fileRef]?.path) === relativePath;
  });
}

function findFileRefKey(project, relativePath) {
  const fileRefSection = project.pbxFileReferenceSection();
  for (const [key, value] of Object.entries(fileRefSection)) {
    if (key.endsWith('_comment')) {
      continue;
    }

    if (stripQuotes(value?.path) === relativePath) {
      return key;
    }
  }

  return null;
}

function ensureShellPhase(project, templateTargetUuid, devTargetUuid, comment) {
  const target = project.pbxNativeTargetSection()[devTargetUuid];
  if ((target.buildPhases ?? []).some((phase) => phase.comment === comment)) {
    return;
  }

  const templatePhaseUuid = findBuildPhaseUuid(project, templateTargetUuid, comment);
  const templatePhase = project.hash.project.objects.PBXShellScriptBuildPhase[templatePhaseUuid];
  const newPhaseUuid = project.generateUuid();
  const clonedPhase = structuredClone(templatePhase);
  replaceStrings(clonedPhase, (value) =>
    value.replaceAll(testTargetName, devTargetName).replaceAll(`Pods-${testTargetName}`, `Pods-${devTargetName}`),
  );

  project.hash.project.objects.PBXShellScriptBuildPhase[newPhaseUuid] = clonedPhase;
  project.hash.project.objects.PBXShellScriptBuildPhase[`${newPhaseUuid}_comment`] = comment;
  target.buildPhases.push({
    value: newPhaseUuid,
    comment,
  });
}

function findBuildPhaseUuid(project, targetUuid, comment) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const buildPhaseRef = (target.buildPhases ?? []).find((phase) => phase.comment === comment);
  if (!buildPhaseRef) {
    throw new Error(`Missing build phase ${comment} on target ${targetUuid}`);
  }

  return buildPhaseRef.value;
}

function ensureTargetPackageDependencies(project, devTargetUuid) {
  const target = project.pbxNativeTargetSection()[devTargetUuid];
  target.packageProductDependencies ||= [];

  if (!target.packageProductDependencies.some((dependency) => dependency.value === mapLibrePackageDependency)) {
    target.packageProductDependencies.push({
      value: mapLibrePackageDependency,
      comment: 'MapLibre',
    });
  }
}

function syncTargetBuildSettings(project, templateTarget, devTargetUuid) {
  const templateConfigs = getTargetConfigs(project, templateTarget.uuid);
  const devConfigs = getTargetConfigs(project, devTargetUuid);

  for (const [name, configUuid] of Object.entries(devConfigs)) {
    const templateConfig = project.pbxXCBuildConfigurationSection()[templateConfigs[name]];
    const devConfig = project.pbxXCBuildConfigurationSection()[configUuid];
    devConfig.buildSettings = structuredClone(templateConfig.buildSettings);

    devConfig.buildSettings.CODE_SIGN_ENTITLEMENTS = `${devTargetName}/${devTargetName}.entitlements`;
    devConfig.buildSettings.INFOPLIST_FILE = `${devTargetName}/Info.plist`;
    devConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = devBundleId;
    devConfig.buildSettings.PRODUCT_NAME = devTargetName;
    devConfig.buildSettings.SWIFT_OBJC_BRIDGING_HEADER = `${devTargetName}/${devTargetName}-Bridging-Header.h`;

    const xcconfigRef = findPodXcconfigReference(project, name);
    if (xcconfigRef) {
      devConfig.baseConfigurationReference = xcconfigRef;
      devConfig.baseConfigurationReference_comment = path.basename(stripQuotes(xcconfigRef));
    }
  }
}

function getTargetConfigs(project, targetUuid) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const listUuid = stripQuotes(target.buildConfigurationList);
  const configList = project.pbxXCConfigurationList()[listUuid];
  const buildConfigSection = project.pbxXCBuildConfigurationSection();

  return Object.fromEntries(
    (configList.buildConfigurations ?? []).map((configRef) => {
      const config = buildConfigSection[configRef.value];
      return [config.name, configRef.value];
    }),
  );
}

function normalizeTargetBuildSettings(project, targetUuid) {
  const targetConfigs = getTargetConfigs(project, targetUuid);
  const buildConfigSection = project.pbxXCBuildConfigurationSection();

  for (const configUuid of Object.values(targetConfigs)) {
    const config = buildConfigSection[configUuid];
    if (!config?.buildSettings) {
      continue;
    }

    // Let the CocoaPods xcconfig provide native module link/search settings.
    delete config.buildSettings.OTHER_LDFLAGS;
    delete config.buildSettings.LIBRARY_SEARCH_PATHS;
    delete config.buildSettings.FRAMEWORK_SEARCH_PATHS;
    delete config.buildSettings.HEADER_SEARCH_PATHS;
  }
}

function removeTargetDependencies(project, dependencyTargetUuid) {
  const targetDependencySection = project.hash.project.objects.PBXTargetDependency || {};
  const containerItemProxySection = project.hash.project.objects.PBXContainerItemProxy || {};
  const dependencyKeysToRemove = [];
  const proxyKeysToRemove = [];

  for (const [key, value] of Object.entries(targetDependencySection)) {
    if (key.endsWith('_comment')) {
      continue;
    }

    if (stripQuotes(value?.target) === dependencyTargetUuid) {
      dependencyKeysToRemove.push(key);
      if (value.targetProxy) {
        proxyKeysToRemove.push(stripQuotes(value.targetProxy));
      }
    }
  }

  if (dependencyKeysToRemove.length === 0) {
    return;
  }

  for (const target of Object.values(project.pbxNativeTargetSection())) {
    if (!target || typeof target !== 'object' || !Array.isArray(target.dependencies)) {
      continue;
    }

    target.dependencies = target.dependencies.filter((dependency) => !dependencyKeysToRemove.includes(dependency.value));
  }

  for (const dependencyKey of dependencyKeysToRemove) {
    delete targetDependencySection[dependencyKey];
    delete targetDependencySection[`${dependencyKey}_comment`];
  }

  for (const proxyKey of proxyKeysToRemove) {
    delete containerItemProxySection[proxyKey];
    delete containerItemProxySection[`${proxyKey}_comment`];
  }
}

function updateSharedScheme(devTargetUuid) {
  const schemePath = path.join(iosRoot, 'GIKTest.xcodeproj', 'xcshareddata', 'xcschemes', `${devTargetName}.xcscheme`);
  const updatedScheme = fs
    .readFileSync(schemePath, 'utf8')
    .replaceAll('13B07F861A680F5B00A75B9A', devTargetUuid)
    .replaceAll('GIKTest.app', `${devTargetName}.app`)
    .replaceAll('BlueprintName = "GIKTest"', `BlueprintName = "${devTargetName}"`)
    .replaceAll('ReferencedContainer = "container:GIKDev.xcodeproj"', 'ReferencedContainer = "container:GIKTest.xcodeproj"')
    .replaceAll('ReferencedContainer = "container:GIKTest.xcodeproj"', 'ReferencedContainer = "container:GIKTest.xcodeproj"');
  fs.writeFileSync(schemePath, updatedScheme);
}

function findPodXcconfigReference(project, configName) {
  const normalizedConfigName = configName.toLowerCase();
  const fileRefSection = project.pbxFileReferenceSection();

  for (const [key, value] of Object.entries(fileRefSection)) {
    if (key.endsWith('_comment')) {
      continue;
    }

    const filePath = stripQuotes(value?.path);
    if (!filePath) {
      continue;
    }

    if (filePath === `Target Support Files/Pods-${devTargetName}/Pods-${devTargetName}.${normalizedConfigName}.xcconfig`) {
      return key;
    }
  }

  return null;
}

function replaceStrings(node, replacer) {
  if (typeof node === 'string') {
    return replacer(node);
  }

  if (Array.isArray(node)) {
    for (let index = 0; index < node.length; index += 1) {
      node[index] = replaceStrings(node[index], replacer);
    }
    return node;
  }

  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      node[key] = replaceStrings(node[key], replacer);
    }
  }

  return node;
}

function stripQuotes(value) {
  return typeof value === 'string' ? value.replaceAll(/^"+|"+$/g, '') : value;
}
