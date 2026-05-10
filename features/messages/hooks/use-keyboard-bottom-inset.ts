import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Keyboard, KeyboardEvent, Platform, useWindowDimensions } from 'react-native';

type KeyboardBottomInsetOptions = {
  bottomInset?: number;
  extraOffset?: number;
};

type KeyboardFrame = {
  height: number;
  screenY: number;
};

export function useKeyboardState({ bottomInset = 0, extraOffset = 0 }: KeyboardBottomInsetOptions = {}) {
  const { height: windowHeight } = useWindowDimensions();
  const [restingWindowHeight, setRestingWindowHeight] = useState(windowHeight);
  const [keyboardFrame, setKeyboardFrame] = useState<KeyboardFrame | null>(null);

  useEffect(() => {
    if (!keyboardFrame) {
      // Keep the pre-keyboard height if Android sends the resize before keyboardDidShow.
      setRestingWindowHeight((currentHeight) => Math.max(currentHeight, windowHeight));
    }
  }, [keyboardFrame, windowHeight]);

  useEffect(() => {
    const updateFrame = (event: KeyboardEvent) => {
      setKeyboardFrame({
        height: event.endCoordinates.height,
        screenY: event.endCoordinates.screenY,
      });
    };

    const showEvents =
      Platform.OS === 'ios'
        ? (['keyboardWillShow', 'keyboardWillChangeFrame'] as const)
        : (['keyboardDidShow'] as const);
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscriptions = showEvents.map((eventName) => Keyboard.addListener(eventName, updateFrame));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardFrame(null));

    return () => {
      showSubscriptions.forEach((subscription) => subscription.remove());
      hideSubscription.remove();
    };
  }, []);

  const isKeyboardVisible = Boolean(keyboardFrame && keyboardFrame.height > 0);
  const keyboardBottomInset = useMemo(() => {
    if (!keyboardFrame || keyboardFrame.height <= 0) {
      return 0;
    }

    const screenHeight = Dimensions.get('screen').height;
    const screenYInset = Math.max(0, screenHeight - keyboardFrame.screenY);
    const keyboardInset = Math.max(keyboardFrame.height, screenYInset);
    const resizeDelta = Platform.OS === 'android' ? Math.max(0, restingWindowHeight - windowHeight) : 0;
    const unhandledKeyboardInset = Math.max(0, keyboardInset - resizeDelta);
    const insetWithoutSafeArea = Math.max(0, unhandledKeyboardInset - bottomInset);

    return insetWithoutSafeArea > 0 ? insetWithoutSafeArea + extraOffset : 0;
  }, [bottomInset, extraOffset, keyboardFrame, restingWindowHeight, windowHeight]);

  return {
    bottomInset: keyboardBottomInset,
    isKeyboardVisible,
  };
}

export function useKeyboardBottomInset(options?: KeyboardBottomInsetOptions) {
  return useKeyboardState(options).bottomInset;
}
