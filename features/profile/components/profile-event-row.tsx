import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { getEventPosterUri } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { AppEvent } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type ProfileEventRowProps = {
  event: AppEvent;
  onPress: () => void;
  right?: ReactNode;
};

export function ProfileEventRow({ event, onPress, right }: ProfileEventRowProps) {
  const { locale } = useI18n();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.74 : 1 }]}>
      <Image source={{ uri: getEventPosterUri(event, 240, 240) }} style={styles.image} contentFit="cover" />
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {event.title[locale]}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.meta}>
          {event.where[locale]}
        </AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {formatEventDate(event.whenISO, locale)}
        </AppText>
      </View>
      {right ? <View>{right}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },
  copy: {
    flex: 1,
  },
  meta: {
    marginTop: 2,
    marginBottom: 1,
  },
});
