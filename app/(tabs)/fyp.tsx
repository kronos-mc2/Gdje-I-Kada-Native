import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View, ViewToken, useWindowDimensions } from 'react-native';
import type { AlertButton } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/primitives';
import {
  useFeedInfiniteQuery,
  useCreateFeedPreferenceMutation,
  useLikeEventMutation,
  useUnlikeEventMutation,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { EventShareModal } from '@/features/events/components/event-share-modal';
import { FypEventDetailsSheet } from '@/features/events/components/fyp/fyp-event-details-sheet';
import {
  getEstimatedFypTabBarHeight,
  getFypBottomContentInset,
  getFypDetailBottomInset,
  getFypViewportHeight,
} from '@/features/events/components/fyp/fyp-layout';
import { FypReelSlide } from '@/features/events/components/fyp/fyp-reel-slide';

const isValidFeedEvent = (event: AppEvent | null | undefined): event is AppEvent => Boolean(event?.id);

export default function FypScreen() {
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? getEstimatedFypTabBarHeight(insets);
  const { height, width } = useWindowDimensions();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } = useFeedInfiniteQuery();
  const likeEventMutation = useLikeEventMutation();
  const unlikeEventMutation = useUnlikeEventMutation();
  const createFeedPreferenceMutation = useCreateFeedPreferenceMutation();
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [shareEvent, setShareEvent] = useState<AppEvent | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const itemHeight = getFypViewportHeight(height, tabBarHeight);
  const slideBottomInset = getFypBottomContentInset(insets);
  const detailBottomInset = getFypDetailBottomInset();
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
      unlikeEventMutation.mutate(event.id);
      return;
    }

    likeEventMutation.mutate(event.id);
  };

  const blockFeedPreference = (event: AppEvent, type: 'event' | 'creator' | 'tag', targetId: string, label: string) => {
    createFeedPreferenceMutation.mutate({ type, targetId, label });
  };

  const onNotInterested = (event: AppEvent) => {
    const buttons: AlertButton[] = [
      {
        text: t('notInterestedThisEvent'),
        onPress: () => blockFeedPreference(event, 'event', event.id, event.title[locale]),
      },
    ];

    if (event.creatorUserId) {
      buttons.push({
        text: t('notInterestedCreator'),
        onPress: () =>
          blockFeedPreference(event, 'creator', event.creatorUserId!, event.creatorName ?? t('organizerFallback')),
      });
    }

    for (const tag of event.tags?.slice(0, 4) ?? []) {
      buttons.push({
        text: `#${tag}`,
        onPress: () => blockFeedPreference(event, 'tag', tag.toLowerCase(), tag),
      });
    }

    Alert.alert(t('notInterested'), t('notInterestedPrompt'), [
      ...buttons,
      { text: t('cancel'), style: 'cancel' },
    ]);
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
          style={[styles.feedList, { height: itemHeight }]}
          data={feedEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <FypReelSlide
              event={item}
              locale={locale}
              width={width}
              height={itemHeight}
              topInset={insets.top}
              bottomInset={slideBottomInset}
              isActive={item.id === activeEventId}
              shouldPreload={Math.abs(index - activeIndex) <= 2}
              onToggleLike={onToggleLike}
              onOpenDetails={setSelectedEvent}
              onOpenShare={setShareEvent}
              onNotInterested={onNotInterested}
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
              fetchNextPage().catch(() => undefined);
            }
          }}
          onRefresh={() => {
            refetch().catch(() => undefined);
          }}
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
        <FypEventDetailsSheet
          event={selectedEvent}
          locale={locale}
          topInset={insets.top}
          bottomInset={detailBottomInset}
          onClose={() => setSelectedEvent(null)}
          onOpenShare={setShareEvent}
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
  feedList: {
    flexGrow: 0,
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
