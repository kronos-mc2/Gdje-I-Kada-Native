import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, GlassSurface } from '@/components/primitives';
import { useChatRoomsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';

type MainTabName = 'index' | 'fyp' | 'calendar' | 'messages' | 'profile';

const MAIN_TABS: {
  name: MainTabName;
  labelKey: 'map' | 'fyp' | 'calendar' | 'messages' | 'profile';
  icon: keyof typeof Ionicons.glyphMap;
  selectedIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index', labelKey: 'map', icon: 'map-outline', selectedIcon: 'map' },
  { name: 'fyp', labelKey: 'fyp', icon: 'compass-outline', selectedIcon: 'compass' },
  { name: 'calendar', labelKey: 'calendar', icon: 'today-outline', selectedIcon: 'today' },
  { name: 'messages', labelKey: 'messages', icon: 'chatbubble-outline', selectedIcon: 'chatbubble' },
  { name: 'profile', labelKey: 'profile', icon: 'person-circle-outline', selectedIcon: 'person-circle' },
];

export function AndroidFloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: rooms = [] } = useChatRoomsQuery();
  const unreadCount = rooms.reduce((sum, room) => sum + Math.max(0, room.unreadCount), 0);
  const activeRouteName = state.routes[state.index]?.name;

  const navigateToTab = (name: MainTabName) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes.find((route) => route.name === name)?.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      (navigation.navigate as (screen: string) => void)(name);
    }
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 8 }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.floatingTabBackground,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <GlassSurface interactive style={styles.barGlass} />
        {MAIN_TABS.map((tab) => (
          <TabButton
            key={tab.name}
            label={t(tab.labelKey)}
            icon={tab.icon}
            selectedIcon={tab.selectedIcon}
            selected={activeRouteName === tab.name}
            unread={tab.name === 'messages' && unreadCount > 0}
            onPress={() => navigateToTab(tab.name)}
          />
        ))}
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  selectedIcon,
  selected,
  unread,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selectedIcon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  unread: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const color = selected ? theme.colors.mapAccent : theme.colors.textMuted;

  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={styles.tabButton}>
      <View>
        {unread ? <View style={[styles.unreadDot, { backgroundColor: theme.colors.mapAccent }]} /> : null}
        <Ionicons name={selected ? selectedIcon : icon} size={25} color={color} />
      </View>
      <AppText variant="caption" color={selected ? 'textPrimary' : 'textMuted'} numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  bar: {
    height: 78,
    borderRadius: 39,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  barGlass: {
    borderRadius: 39,
  },
  tabButton: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  unreadDot: {
    position: 'absolute',
    right: -2,
    top: -4,
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  label: {
    maxWidth: 54,
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
  },
});
