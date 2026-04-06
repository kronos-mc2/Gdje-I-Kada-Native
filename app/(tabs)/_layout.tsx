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
          sf={{ default: 'calendar', selected: 'calendar.circle.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name="calendar-outline" />}
        />
        <Label>{t('events')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="fyp">
        <Icon
          sf={{ default: 'sparkles', selected: 'sparkles' }}
          androidSrc={<VectorIcon family={Ionicons} name="sparkles-outline" />}
        />
        <Label>{t('fyp')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="social">
        <Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          androidSrc={<VectorIcon family={Ionicons} name="chatbubbles-outline" />}
        />
        <Label>{t('social')}</Label>
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
