import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, ViewToken, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventDetailSheet } from '@/components/map/event-detail-sheet';
import { AppText } from '@/components/primitives';
import {
  useFeedInfiniteQuery,
  useLikeEventMutation,
  useUnlikeEventMutation,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { EventShareModal } from '@/features/events/components/event-share-modal';
import { FypReelSlide } from '@/features/events/components/fyp-reel-slide';

const isValidFeedEvent = (event: AppEvent | null | undefined): event is AppEvent => Boolean(event?.id);

export default function FypScreen() {
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } = useFeedInfiniteQuery();
  const likeEventMutation = useLikeEventMutation();
  const unlikeEventMutation = useUnlikeEventMutation();
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [shareEvent, setShareEvent] = useState<AppEvent | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const itemHeight = Math.max(420, height);
  const feedEvents = useMemo(
    () =>
      data?.pages.flatMap((page) => {
        const pageItems = Array.isArray(page?.items) ? page.items : [];
        return pageItems.filter(isValidFeedEvent);
      }) ?? [],
    [data],
  );
  const activeIndex = Math.max(0, feedEvents.findIndex((event) => event.id === activeEventId));
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstVisible = viewableItems.find((item) => item.isViewable)?.item as AppEvent | undefined;
    if (firstVisible?.id) {
      setActiveEventId((current) => (current === firstVisible.id ? current : firstVisible.id));
    }
  });
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  });

  const onToggleLike = (event: AppEvent) => {
    if (event.likedByMe) {
      void unlikeEventMutation.mutateAsync(event.id);
      return;
    }

    void likeEventMutation.mutateAsync(event.id);
  };

  useEffect(() => {
    if (!activeEventId && feedEvents[0]?.id) {
      setActiveEventId(feedEvents[0].id);
    }
  }, [activeEventId, feedEvents]);

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={theme.colors.textSecondary} />
        </View>
      );
    }

    if (!hasNextPage && feedEvents.length > 0) {
      return (
        <View style={styles.footer}>
          <AppText variant="caption" color="textMuted">
            {t('feedYouAreCaughtUp')}
          </AppText>
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {isLoading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={theme.colors.textSecondary} />
          <AppText variant="body" color="textMuted" style={styles.loadingText}>
            {t('loading')}
          </AppText>
        </View>
      ) : feedEvents.length === 0 ? (
        <View style={styles.emptyWrap}>
          <AppText variant="headline">{t('noFeedEvents')}</AppText>
        </View>
      ) : (
        <FlatList
          data={feedEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <FypReelSlide
              event={item}
              locale={locale}
              width={width}
              height={itemHeight}
              topInset={insets.top}
              bottomInset={insets.bottom}
              isActive={item.id === activeEventId}
              shouldPreload={Math.abs(index - activeIndex) <= 2}
              onToggleLike={onToggleLike}
              onOpenDetails={setSelectedEvent}
              onOpenShare={setShareEvent}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={itemHeight}
          onEndReachedThreshold={0.55}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          viewabilityConfig={viewabilityConfig.current}
          onViewableItemsChanged={onViewableItemsChanged.current}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews
          ListFooterComponent={renderFooter}
        />
      )}

      {selectedEvent ? (
        <EventDetailSheet
          event={selectedEvent}
          locale={locale}
          topInset={insets.top}
          bottomInset={insets.bottom}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}

      <EventShareModal event={shareEvent} visible={shareEvent != null} locale={locale} onClose={() => setShareEvent(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  footerSpacer: {
    height: 18,
  },
});
