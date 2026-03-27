import { PropsWithChildren } from 'react';
import {
  ImageBackground,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/core/theme';

type AppScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  edges?: Edge[];
  contentHorizontalPadding?: boolean;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
}>;

export function AppScreen({
  children,
  style,
  contentContainerStyle,
  scroll = false,
  edges = ['top', 'left', 'right'],
  contentHorizontalPadding = true,
  scrollProps,
}: AppScreenProps) {
  const { theme } = useAppTheme();
  const backgroundSource = theme.isDark
    ? require('../../assets/images/app-background-dark.png')
    : require('../../assets/images/app-background-light.png');

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor: theme.colors.background }, style]}>
      <ImageBackground source={backgroundSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.isDark ? 'rgba(5, 8, 12, 0.70)' : 'rgba(242, 245, 251, 0.55)' },
        ]}
      />

      {scroll ? (
        <ScrollView
          {...scrollProps}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: contentHorizontalPadding ? theme.tokens.spacing.md : 0,
              paddingBottom: theme.tokens.spacing.xxl,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.content,
            {
              paddingHorizontal: contentHorizontalPadding ? theme.tokens.spacing.md : 0,
            },
            contentContainerStyle,
          ]}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
