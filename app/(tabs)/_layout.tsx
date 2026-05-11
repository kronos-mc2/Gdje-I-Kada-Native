import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';

export default function TabLayout() {
  const { t } = useI18n();
  const { theme } = useAppTheme();

  const iosPrimaryColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          dark: '#F0F0F0',
          light: '#111114',
        })
      : theme.colors.textPrimary;

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      blurEffect={theme.isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      backgroundColor={Platform.OS === 'android' ? theme.colors.surface : undefined}
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
        <Icon
          sf={{ default: 'map', selected: 'map.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name="map-outline" />}
        />
        <Label>{t('map')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="fyp">
        <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
        <Icon
          sf={{ default: 'sparkles', selected: 'sparkles' }}
          androidSrc={<VectorIcon family={Ionicons} name="sparkles-outline" />}
        />
        <Label>{t('fyp')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
        <Icon
          sf={{ default: 'calendar.badge.clock', selected: 'calendar.badge.clock' }}
          androidSrc={<VectorIcon family={Ionicons} name="today-outline" />}
        />
        <Label>{t('calendar')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.TabBar backgroundColor={theme.colors.surface} shadowColor={theme.colors.surface} disableTransparentOnScrollEdge />
        <Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name="chatbubbles-outline" />}
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
