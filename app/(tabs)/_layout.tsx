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
          dark: '#FFFFFF',
          light: '#0E1118',
        })
      : theme.colors.textPrimary;

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      blurEffect={theme.isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      backgroundColor={Platform.OS === 'android' ? (theme.isDark ? 'rgba(8, 12, 18, 0.80)' : 'rgba(246, 247, 250, 0.86)') : undefined}
      disableIndicator
      iconColor={{
        default: theme.colors.textMuted,
        selected: iosPrimaryColor,
      }}
      labelStyle={{
        default: {
          color: theme.colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
        },
        selected: {
          color: iosPrimaryColor,
          fontSize: 11,
          fontWeight: '600',
        },
      }}
      shadowColor={Platform.OS === 'android' ? 'transparent' : undefined}
      tintColor={iosPrimaryColor}
    >
      <NativeTabs.Trigger name="index">
        <Icon
          sf={{ default: 'map', selected: 'map.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name="map-outline" />}
        />
        <Label>{t('map')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="fyp">
        <Icon
          sf={{ default: 'sparkles', selected: 'sparkles' }}
          androidSrc={<VectorIcon family={Ionicons} name="sparkles-outline" />}
        />
        <Label>{t('fyp')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar">
        <Icon
          sf={{ default: 'calendar.badge.clock', selected: 'calendar.badge.clock' }}
          androidSrc={<VectorIcon family={Ionicons} name="today-outline" />}
        />
        <Label>{t('calendar')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name="chatbubbles-outline" />}
        />
        <Label>{t('messages')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name="person-circle-outline" />}
        />
        <Label>{t('profile')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
