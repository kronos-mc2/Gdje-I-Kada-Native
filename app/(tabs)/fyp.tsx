import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, ListRenderItemInfo, Pressable, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/primitives';
import { useFeedQuery } from '@/core/api/query-hooks';
import { getEventCoverUri } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

function sortByDate(events: AppEvent[]) {
  return [...events].sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime());
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: number;
  active?: boolean;
  onPress: () => void;
};

function ActionButton({ icon, label, value, active = false, onPress }: ActionButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable style={({ pressed }) => [styles.actionWrap, { opacity: pressed ? 0.78 : 1 }]} onPress={onPress}>
      <View style={[styles.actionIconWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
        <Ionicons name={icon} size={22} color={active ? theme.colors.accent : theme.colors.textPrimary} />
      </View>
      <AppText variant="caption" style={styles.actionLabel}>
        {value ?? label}
      </AppText>
    </Pressable>
  );
}

export default function FypScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const { data: fetchedEvents = [] } = useFeedQuery();
  const createdEvents = useAppStore((state) => state.createdEvents);
  const joinedEventIds = useAppStore((state) => state.joinedEventIds);
  const likedEventIds = useAppStore((state) => state.likedEventIds);
  const favoriteEventIds = useAppStore((state) => state.favoriteEventIds);
  const toggleJoined = useAppStore((state) => state.toggleJoined);
  const toggleLiked = useAppStore((state) => state.toggleLiked);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const feedEvents = useMemo(() => sortByDate([...createdEvents, ...fetchedEvents]), [createdEvents, fetchedEvents]);
  const itemHeight = Math.max(420, height - insets.top - insets.bottom);

  const onShare = async (event: AppEvent) => {
    try {
      await Share.share({
        title: event.title[locale],
        message: `${event.title[locale]}\n${event.where[locale]}\n${event.about[locale]}`,
      });
    } catch {
      // ignore native share dismiss/errors
    }
  };

  const renderFeedItem = ({ item }: ListRenderItemInfo<AppEvent>) => {
    const isJoined = joinedEventIds.includes(item.id);
    const isLiked = likedEventIds.includes(item.id);
    const isFavorite = favoriteEventIds.includes(item.id);
    const likeCount = item.participantCount + (isLiked ? 1 : 0);

    return (
      <View style={[styles.slide, { height: itemHeight, width }]}>
        <Image source={{ uri: getEventCoverUri(item.id, 1080, 1920) }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.backdrop} />

        <View style={[styles.topMeta, { paddingTop: insets.top + 6 }]}>
          <AppText variant="caption" color="textMuted">
            {t('fypReelsSubtitle')}
          </AppText>
        </View>

        <View style={styles.rightActions}>
          <ActionButton
            icon={isLiked ? 'heart' : 'heart-outline'}
            label={t('like')}
            value={likeCount}
            active={isLiked}
            onPress={() => toggleLiked(item.id)}
          />
          <ActionButton
            icon={isFavorite ? 'bookmark' : 'bookmark-outline'}
            label={t('favorite')}
            active={isFavorite}
            onPress={() => toggleFavorite(item.id)}
          />
          <ActionButton icon="share-social-outline" label={t('shares')} onPress={() => onShare(item)} />
        </View>

        <View style={styles.bottomContent}>
          <AppText variant="title">{item.title[locale]}</AppText>
          <AppText variant="body" color="textSecondary" style={styles.metaLine}>
            {item.where[locale]}
          </AppText>
          <AppText variant="caption" color="textMuted" style={styles.metaLine}>
            {formatEventDate(item.whenISO, locale)}
          </AppText>
          <AppText variant="body" numberOfLines={3} style={styles.about}>
            {item.about[locale]}
          </AppText>

          <View style={styles.bottomActionsRow}>
            <Pressable
              onPress={() => toggleJoined(item.id)}
              style={({ pressed }) => [
                styles.cta,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.overlay,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong">{isJoined ? t('leaveEvent') : t('joinEvent')}</AppText>
            </Pressable>

            <Pressable
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.cta,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.overlay,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong">{t('details')}</AppText>
            </Pressable>
          </View>

          <AppText variant="caption" color="textMuted" style={styles.swipeHint}>
            {t('feedHintSwipe')}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {feedEvents.length === 0 ? (
        <View style={styles.emptyWrap}>
          <AppText variant="headline">{t('noFeedEvents')}</AppText>
        </View>
      ) : (
        <FlatList
          data={feedEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={itemHeight}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  slide: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 13, 20, 0.44)',
  },
  topMeta: {
    zIndex: 1,
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 180,
    zIndex: 2,
    gap: 12,
  },
  actionWrap: {
    alignItems: 'center',
    gap: 4,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    textAlign: 'center',
  },
  bottomContent: {
    zIndex: 1,
    paddingRight: 70,
  },
  metaLine: {
    marginTop: 4,
  },
  about: {
    marginTop: 10,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cta: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 42,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  swipeHint: {
    marginTop: 12,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
