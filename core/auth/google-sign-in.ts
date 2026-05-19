import { Platform } from 'react-native';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;

export type NativeGoogleSignInResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | { type: 'missing-web-client-id' }
  | { type: 'native-module-unavailable' }
  | { type: 'error'; code?: string };

export async function signInWithNativeGoogle(): Promise<NativeGoogleSignInResult> {
  const googleModule = await loadGoogleSignInModule();
  if (!googleModule) {
    return { type: 'native-module-unavailable' };
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId || webClientId.startsWith('your-')) {
    return { type: 'missing-web-client-id' };
  }

  configureGoogleSignIn(googleModule, webClientId);

  try {
    if (Platform.OS === 'android') {
      await googleModule.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await googleModule.GoogleSignin.signIn();
    if (googleModule.isCancelledResponse(response)) {
      return { type: 'cancelled' };
    }

    if (!googleModule.isSuccessResponse(response) || !response.data.idToken) {
      return { type: 'error' };
    }

    return { type: 'success', idToken: response.data.idToken };
  } catch (error: unknown) {
    if (googleModule.isErrorWithCode(error)) {
      if (error.code === googleModule.statusCodes.SIGN_IN_CANCELLED) {
        return { type: 'cancelled' };
      }
      return { type: 'error', code: String(error.code) };
    }
    return { type: 'error' };
  }
}

async function loadGoogleSignInModule(): Promise<GoogleSignInModule | null> {
  try {
    return await import('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

function configureGoogleSignIn(googleModule: GoogleSignInModule, webClientId: string) {
  if (configured) {
    return;
  }

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  googleModule.GoogleSignin.configure({
    webClientId,
    iosClientId: iosClientId && !iosClientId.startsWith('your-') ? iosClientId : undefined,
    offlineAccess: false,
    profileImageSize: 120,
  });
  configured = true;
}
