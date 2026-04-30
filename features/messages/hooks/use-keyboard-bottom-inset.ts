import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform, useWindowDimensions } from 'react-native';

export function useKeyboardBottomInset() {
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardBottomInset, setKeyboardBottomInset] = useState(0);

  useEffect(() => {
    const updateInset = (event: KeyboardEvent) => {
      const screenYInset = Math.max(0, windowHeight - event.endCoordinates.screenY);
      const heightInset = Platform.OS === 'android' ? event.endCoordinates.height : 0;
      setKeyboardBottomInset(Math.max(screenYInset, heightInset));
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, updateInset);
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardBottomInset(0));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [windowHeight]);

  return keyboardBottomInset;
}
