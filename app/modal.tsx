import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppHeader, AppScreen, AppText } from '@/components/primitives';

export default function ModalScreen() {
  return (
    <AppScreen>
      <AppHeader title="Modal" subtitle="Utility screen" />
      <View style={styles.container}>
        <AppText variant="headline">This is a modal</AppText>
        <Link href="/" dismissTo asChild>
          <AppButton title="Go to home screen" variant="secondary" style={styles.link} />
        </Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
