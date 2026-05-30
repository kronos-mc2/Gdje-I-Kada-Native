import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View, ViewToken, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppCard, AppText } from '@/components/primitives';
import {
  useFeedInfiniteQuery,
  useCreateFeedPreferenceMutation,
  useLikeEventMutation,
  useRecordFeedImpressionMutation,
  useUnlikeEventMutation,
} from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppStore } from '@/core/store/app-store';
import { useAppTheme } from '@/core/theme';
import { AppEvent } from '@/core/types/domain';
import { EventShareModal } from '@/features/events/components/event-share-modal';
import { FypDiscoverHeader } from '@/features/events/components/fyp/fyp-discover-header';
import { FypEventDetailsSheet } from '@/features/events/components/fyp/fyp-event-details-sheet';
import {
  getEstimatedFypTabBarHeight,
  getFypBottomContentInset,
  getFypDetailBottomInset,
  getFypViewportHeight,
} from '@/features/events/components/fyp/fyp-layout';
import { FypReelSlide } from '@/features/events/components/fyp/fyp-reel-slide';
import { createFypFeedParams } from '@/features/events/fyp/fyp-feed-filters';

const isValidFeedEvent = (event: AppEvent | null | undefined): event is AppEvent => Boolean(event?.id);
const createFeedSeed = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const FEED_PAGE_SIZE = 8;
const NOT_INTERESTED_NAV_CLEARANCE = 28;

export default function FypScreen() {
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? getEstimatedFypTabBarHeight(insets);
  const { height, width } = useWindowDimensions();
  const [feedSeed, setFeedSeed] = useState(createFeedSeed);
  const fypFeedFilter = useAppStore((state) => state.fypFeedFilter);
  const setFypFeedFilter = useAppStore((state) => state.setFypFeedFilter);
  const userLocation = useAppStore((state) => state.userLocation);
  const nearbyRadiusKm = useAppStore((state) => state.nearbyRadiusKm);
  const feedParams = useMemo(
    () => createFypFeedParams(fypFeedFilter, userLocation, nearbyRadiusKm),
    [feedSeed, fypFeedFilter, nearbyRadiusKm, userLocation],
  );
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } = useFeedInfiniteQuery(
    FEED_PAGE_SIZE,
    feedSeed,
    feedParams,
  );
  const likeEventMutation = useLikeEventMutation();
  const unlikeEventMutation = useUnlikeEventMutation();
  const recordFeedImpressionMutation = useRecordFeedImpressionMutation();
  const createFeedPreferenceMutation = useCreateFeedPreferenceMutation();
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [shareEvent, setShareEvent] = useState<AppEvent | null>(null);
  const [notInterestedEvent, setNotInterestedEvent] = useState<AppEvent | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isFeedMuted, setIsFeedMuted] = useState(false);
  const recordedImpressionIdsRef = useRef<Set<string>>(new Set());
  const hasMountedFilterRef = useRef(false);
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

  useFocusEffect(
    useCallback(() => {
      recordedImpressionIdsRef.current.clear();
      setActiveEventId(null);
      setFeedSeed(createFeedSeed());
    }, []),
  );

  useEffect(() => {
    if (!hasMountedFilterRef.current) {
      hasMountedFilterRef.current = true;
      return;
    }

    recordedImpressionIdsRef.current.clear();
    setActiveEventId(null);
    setFeedSeed(createFeedSeed());
  }, [fypFeedFilter]);

  const onToggleLike = (event: AppEvent) => {
    if (event.likedByMe) {
      unlikeEventMutation.mutate(event.id);
      return;
    }

    likeEventMutation.mutate(event.id);
  };

  const onLikeOnly = (event: AppEvent) => {
    if (!event.likedByMe) {
      likeEventMutation.mutate(event.id);
    }
  };

  const blockFeedPreference = (event: AppEvent, type: 'event' | 'creator' | 'tag', targetId: string, label: string) => {
    createFeedPreferenceMutation.mutate({ type, targetId, label });
    setNotInterestedEvent(null);
  };

  const onNotInterested = (event: AppEvent) => {
    setNotInterestedEvent(event);
  };

  useEffect(() => {
    if (feedEvents[0]?.id && (!activeEventId || !feedEvents.some((event) => event.id === activeEventId))) {
      setActiveEventId(feedEvents[0].id);
    }
  }, [activeEventId, feedEvents]);

  useEffect(() => {
    if (!activeEventId || recordedImpressionIdsRef.current.has(activeEventId)) {
      return;
    }

    recordedImpressionIdsRef.current.add(activeEventId);
    recordFeedImpressionMutation.mutate(activeEventId);
  }, [activeEventId, recordFeedImpressionMutation]);

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
              isMuted={isFeedMuted}
              onToggleLike={onToggleLike}
              onLikeOnly={onLikeOnly}
              onToggleMute={() => setIsFeedMuted((current) => !current)}
              onOpenDetails={setSelectedEvent}
              onOpenShare={setShareEvent}
              onNotInterested={onNotInterested}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          disableIntervalMomentum
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

      <FypDiscoverHeader filter={fypFeedFilter} topInset={insets.top} onFilterChange={setFypFeedFilter} />

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
      <NotInterestedModal
        event={notInterestedEvent}
        visible={notInterestedEvent != null}
        bottomInset={insets.bottom}
        onClose={() => setNotInterestedEvent(null)}
        onBlock={blockFeedPreference}
      />
    </SafeAreaView>
  );
}

function NotInterestedModal({
  event,
  visible,
  bottomInset,
  onClose,
  onBlock,
}: {
  event: AppEvent | null;
  visible: boolean;
  bottomInset: number;
  onClose: () => void;
  onBlock: (event: AppEvent, type: 'event' | 'creator' | 'tag', targetId: string, label: string) => void;
}) {
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();

  if (!event) {
    return null;
  }

  const options = [
    {
      key: 'event',
      title: t('notInterestedThisEvent'),
      onPress: () => onBlock(event, 'event', event.id, event.title[locale]),
    },
    ...(event.creatorUserId
      ? [
          {
            key: 'creator',
            title: t('notInterestedCreator'),
            onPress: () => onBlock(event, 'creator', event.creatorUserId!, event.creatorName ?? t('organizerFallback')),
          },
        ]
      : []),
    ...(event.tags ?? []).slice(0, 6).map((tag) => ({
      key: `tag-${tag}`,
      title: `${t('ignoreTag')} ${tag}`,
      onPress: () => onBlock(event, 'tag', tag.toLowerCase(), tag),
    })),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.notInterestedOverlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable style={styles.notInterestedPressable} onPress={() => {}}>
          <AppCard
            variant="glass"
            style={[
              styles.notInterestedPanel,
              {
                marginBottom: Math.max(bottomInset, 16) + NOT_INTERESTED_NAV_CLEARANCE,
                paddingBottom: 18,
              },
            ]}
          >
            <View>
              <AppText variant="headline">{t('notInterested')}</AppText>
              <AppText variant="body" color="textSecondary" style={styles.notInterestedSubtitle}>
                {t('notInterestedPrompt')}
              </AppText>
            </View>

            <View style={styles.notInterestedOptions}>
              {options.map((option) => (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  onPress={option.onPress}
                  style={({ pressed }) => [
                    styles.notInterestedOption,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceElevated,
                      opacity: pressed ? 0.74 : 1,
                    },
                  ]}
                >
                  <AppText variant="bodyStrong">{option.title}</AppText>
                </Pressable>
              ))}
            </View>

            <AppButton title={t('cancel')} variant="secondary" onPress={onClose} style={styles.notInterestedBack} />
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
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
  notInterestedOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 64,
  },
  notInterestedPressable: {
    width: '100%',
  },
  notInterestedPanel: {
    gap: 14,
    minHeight: 0,
  },
  notInterestedSubtitle: {
    marginTop: 6,
  },
  notInterestedOptions: {
    gap: 10,
    paddingVertical: 2,
  },
  notInterestedOption: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  notInterestedBack: {
    marginTop: 2,
  },
});
