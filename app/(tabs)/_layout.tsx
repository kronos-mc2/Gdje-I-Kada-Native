import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { DynamicColorIOS, Platform } from 'react-native';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

import { AndroidFloatingTabBar } from '@/components/navigation/android-floating-tab-bar';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';

export default function TabLayout() {
  const { t } = useI18n();
  const { theme } = useAppTheme();

  if (Platform.OS === 'ios') {
    const iosPrimaryColor = DynamicColorIOS({
      dark: '#F0F0F0',
      light: '#111114',
    });

    return (
      <NativeTabs
        minimizeBehavior="onScrollDown"
        blurEffect={theme.isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        disableTransparentOnScrollEdge
        disableIndicator
        iconColor={{
          default: theme.colors.textMuted,
          selected: iosPrimaryColor,
        }}
        labelStyle={{
          default: {
            color: theme.colors.textMuted,
            fontSize: 11,
            fontFamily: theme.tokens.typography.caption.fontFamily,
            fontWeight: '500',
          },
          selected: {
            color: iosPrimaryColor,
            fontSize: 11,
            fontFamily: theme.tokens.typography.label.fontFamily,
            fontWeight: '600',
          },
        }}
        shadowColor={theme.colors.surface}
        tintColor={iosPrimaryColor}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
          <Icon sf={{ default: 'map', selected: 'map.fill' }} androidSrc={<VectorIcon family={Ionicons} name="map-outline" />} />
          <Label>{t('map')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="fyp">
          <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
          <Icon sf={{ default: 'safari', selected: 'safari.fill' }} androidSrc={<VectorIcon family={Ionicons} name="compass-outline" />} />
          <Label>{t('fyp')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="calendar">
          <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
          <Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} androidSrc={<VectorIcon family={Ionicons} name="bookmark-outline" />} />
          <Label>{t('saved')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="messages">
          <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
          <Icon
            sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="chatbubble-outline" />}
          />
          <Label>{t('messages')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
          <Icon
            sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
            androidSrc={<VectorIcon family={Ionicons} name="person-circle-outline" />}
          />
          <Label>{t('profile')}</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <AndroidFloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="fyp" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="social" options={{ href: null }} />
    </Tabs>
  );
}
