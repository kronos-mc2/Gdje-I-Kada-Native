const clientIdSuffix = '.apps.googleusercontent.com';

function googleIosUrlScheme(clientId) {
  const value = clientId?.trim();
  if (!value || value.startsWith('your-') || !value.endsWith(clientIdSuffix)) {
    throw new Error('Configure EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID with the iOS OAuth client for this bundle id.');
  }
  return `com.googleusercontent.apps.${value.slice(0, -clientIdSuffix.length)}`;
}

function withGoogleIosUrlScheme(info, clientId) {
  const scheme = googleIosUrlScheme(clientId);
  // Keep app deep links, replacing stale Google callbacks from a different variant.
  const urls = (info.CFBundleURLTypes || []).map((entry) => ({
    ...entry,
    CFBundleURLSchemes: (entry.CFBundleURLSchemes || []).filter(
      (value) => !value.startsWith('com.googleusercontent.apps.'),
    ),
  })).filter((entry) => entry.CFBundleURLSchemes.length > 0);
  return { ...info, CFBundleURLTypes: [...urls, { CFBundleURLSchemes: [scheme] }] };
}

module.exports = { googleIosUrlScheme, withGoogleIosUrlScheme };
