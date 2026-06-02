import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { EventDetailsContent } from '@/features/events/components/event-details-content';
import { EventShareModal } from '@/features/events/components/event-share-modal';
import { useEventJoinActions } from '@/features/events/hooks/use-event-join-actions';
import { AppButton, AppScreen, AppText, GlassSurface } from '@/components/primitives';
import { useEventQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';

export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const eventId = params.id;
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const { data: event, isLoading } = useEventQuery(eventId);
  const {
    isJoined,
    isJoinDisabled,
    joinButtonTitle,
    onToggleJoin,
    canOpenEventChat,
    isEventChatPending,
    openEventChat,
  } = useEventJoinActions(event);
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!event && !isLoading) {
    return (
      <AppScreen>
        <View style={styles.notFoundWrap}>
          <AppText variant="headline" style={styles.notFoundTitle}>
            {t('eventNotFound')}
          </AppText>
          <AppButton title={t('back')} variant="secondary" onPress={() => router.back()} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screenContent}>
      {event ? (
        <>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  opacity: pressed ? 0.76 : 1,
                },
              ]}
            >
              {Platform.OS === 'ios' ? <GlassSurface interactive style={styles.iconButtonGlass} /> : null}
              <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} style={styles.iconGlyph} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('shareEvent')}
              onPress={() => setIsShareOpen(true)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  opacity: pressed ? 0.76 : 1,
                },
              ]}
            >
              {Platform.OS === 'ios' ? <GlassSurface interactive style={styles.iconButtonGlass} /> : null}
              <Ionicons name="share-social-outline" size={20} color={theme.colors.textPrimary} style={styles.iconGlyph} />
            </Pressable>
          </View>

          <EventDetailsContent
            event={event}
            locale={locale}
            isJoined={isJoined}
            isJoinDisabled={isJoinDisabled}
            joinButtonTitle={joinButtonTitle}
            onToggleJoin={onToggleJoin}
            canOpenEventChat={canOpenEventChat}
            isEventChatPending={isEventChatPending}
            onOpenEventChat={() => void openEventChat()}
          />

          <EventShareModal event={event} visible={isShareOpen} locale={locale} onClose={() => setIsShareOpen(false)} />
        </>
      ) : (
        <View style={styles.loadingWrap}>
          <AppText color="textMuted">...</AppText>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 14,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  iconButtonGlass: {
    borderRadius: 18,
  },
  iconGlyph: {
    zIndex: 1,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundTitle: {
    textAlign: 'center',
  },
  loadingWrap: {
    paddingVertical: 16,
  },
});
