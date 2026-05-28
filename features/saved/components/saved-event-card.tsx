import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { getEventPosterSource } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { formatSavedDateChip } from '@/features/saved/utils/saved-events';

type SavedEventCardProps = {
  event: AppEvent;
  onPress: () => void;
};

export function SavedEventCard({ event, onPress }: SavedEventCardProps) {
  const { locale } = useI18n();
  const { theme } = useAppTheme();
  const posterSource = getEventPosterSource(event);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      {posterSource ? (
        <Image source={posterSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surfaceElevated }]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
      <View style={[styles.heart, { backgroundColor: theme.colors.overlay }]}>
        <Ionicons name="heart" size={22} color={theme.colors.textPrimary} />
      </View>
      <View style={styles.cardBottom}>
        <View style={[styles.datePill, { backgroundColor: theme.colors.mapAccentSoft, borderColor: theme.colors.mapAccent }]}>
          <AppText variant="caption" numberOfLines={1} style={styles.imageText}>
            {formatSavedDateChip(event, locale)}
          </AppText>
        </View>
        <AppText variant="headline" numberOfLines={2} style={[styles.title, styles.imageText]}>
          {event.title[locale]}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={styles.imageSubtext}>
          {event.where[locale]}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 238,
    height: 292,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 14,
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
  },
  heart: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  datePill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  title: {
    marginBottom: 4,
  },
  imageText: {
    color: '#F0F0F0',
  },
  imageSubtext: {
    color: 'rgba(240, 240, 240, 0.82)',
  },
});
