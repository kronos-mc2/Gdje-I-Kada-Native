import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDay, formatEventTime } from '@/core/utils/date';
import { FYP_REEL_TEXT_MAX_FONT_MULTIPLIER } from '@/features/events/components/fyp/fyp-layout';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';

type FypReelSummaryCardProps = Readonly<{
  event: AppEvent;
  locale: Locale;
  activeMediaIndex: number;
  mediaPageCount: number;
  onOpenDetails: () => void;
}>;

type MetaItemProps = Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}>;

const MAX_VISIBLE_TAG_BUBBLES = 5;

export function FypReelSummaryCard({ event, locale, activeMediaIndex, mediaPageCount, onOpenDetails }: FypReelSummaryCardProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [collapsed, setCollapsed] = useState(false);
  const organizerName = event.creatorName ?? t('organizerFallback');
  const addressLabel = event.address.trim() || event.where[locale];
  const visibleTags = (event.tags ?? []).slice(0, MAX_VISIBLE_TAG_BUBBLES);
  const hiddenTagCount = Math.max((event.tags?.length ?? 0) - visibleTags.length, 0);
  useEffect(() => {
    setCollapsed(false);
  }, [event.id]);
  const handleSummaryPress = () => {
    if (collapsed) {
      setCollapsed(false);
      return;
    }

    onOpenDetails();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={collapsed ? t('fypExpandSummary') : t('details')}
      onPress={handleSummaryPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View style={[styles.content, collapsed ? styles.collapsedContent : null]}>
        <View style={styles.badgeRow}>
          <View style={[styles.dateBadge, { backgroundColor: theme.colors.mapAccentSoft }]}>
            <AppText variant="caption" maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER} style={styles.badgeText} numberOfLines={1}>
              {formatEventDay(event.whenISO, locale)}
            </AppText>
          </View>
          {event.joinedByMe ? (
            <View
              style={[
                styles.dateBadge,
                {
                  backgroundColor: theme.colors.overlay,
                  borderColor: theme.colors.mapAccent,
                  borderWidth: 1,
                },
              ]}
            >
              <AppText variant="caption" color="mapAccent" maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER} numberOfLines={1}>
                {t('joinedBadge')}
              </AppText>
            </View>
          ) : null}
        </View>

        <AppText
          variant="title"
          maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.86}
          style={styles.title}
        >
          {event.title[locale]}
        </AppText>

        {collapsed ? null : (
          <>
            <View style={styles.organizerRow}>
              <ProfileAvatar name={organizerName} avatarUrl={event.creatorAvatarUrl} size={28} />
              <View style={styles.titleBlock}>
                <AppText variant="caption" color="textSecondary" maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER} numberOfLines={1}>
                  {organizerName}
                </AppText>
                <AppText variant="caption" color="textSecondary" maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER} numberOfLines={1}>
                  {event.where[locale]}
                </AppText>
              </View>
            </View>

            <AppText
              variant="caption"
              color="textSecondary"
              maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER}
              numberOfLines={2}
              style={styles.about}
            >
              {event.about[locale]}
            </AppText>

            <View style={styles.metaRow}>
              <MetaItem icon="time-outline" label={formatEventTime(event.whenISO, locale)} />
              <MetaItem icon="people-outline" label={`${event.participantCount} ${t('participants')}`} />
              <MetaItem icon="location-outline" label={addressLabel} />
            </View>

            {visibleTags.length ? (
              <View style={styles.tagRow}>
                {visibleTags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tagBubble,
                      {
                        borderColor: theme.colors.mapAccent,
                        backgroundColor: theme.colors.mapAccentSoft,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color="mapAccent"
                      maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER}
                      numberOfLines={1}
                      style={styles.tagText}
                    >
                      {tag}
                    </AppText>
                  </View>
                ))}
                {hiddenTagCount > 0 ? (
                  <View
                    style={[
                      styles.tagBubble,
                      styles.tagOverflowBubble,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color="textPrimary"
                      maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER}
                      numberOfLines={1}
                      style={styles.tagText}
                    >
                      +{hiddenTagCount}
                    </AppText>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.summaryActionRow}>
              <View
                style={[
                  styles.detailsButton,
                  {
                    borderColor: theme.colors.mapAccent,
                    backgroundColor: theme.colors.mapAccent,
                  },
                ]}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <AppText
                  variant="bodyStrong"
                  maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={styles.detailsButtonText}
                >
                  {t('detailsCta')}
                </AppText>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('fypCollapseSummary')}
                hitSlop={8}
                onPress={(pressEvent) => {
                  pressEvent.stopPropagation();
                  setCollapsed(true);
                }}
                style={({ pressed }) => [
                  styles.collapseButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.overlay,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Ionicons name="chevron-down" size={22} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            {mediaPageCount > 1 ? (
              <View style={styles.mediaIndicatorRow}>
                {Array.from({ length: mediaPageCount }).map((_, index) => (
                  <View
                    key={`media-indicator-${event.id}-${index}`}
                    style={[
                      styles.mediaIndicator,
                      {
                        backgroundColor: index === activeMediaIndex ? theme.colors.mapAccent : 'rgba(240, 240, 240, 0.34)',
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

function MetaItem({ icon, label }: MetaItemProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.metaItem,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.overlay,
        },
      ]}
    >
      <Ionicons name={icon} size={13} color={theme.colors.textSecondary} />
      <AppText variant="caption" maxFontSizeMultiplier={FYP_REEL_TEXT_MAX_FONT_MULTIPLIER} numberOfLines={1} style={styles.metaText}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 9,
    paddingBottom: 2,
  },
  collapsedContent: {
    gap: 7,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    minHeight: 22,
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: {
    color: '#FFFFFF',
  },
  title: {
    color: '#FFFFFF',
  },
  organizerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  about: {
    color: 'rgba(240, 240, 240, 0.82)',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  metaItem: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
    minHeight: 30,
    paddingHorizontal: 9,
  },
  metaText: {
    flexShrink: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tagBubble: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    maxWidth: '100%',
    minHeight: 28,
    paddingHorizontal: 10,
  },
  tagOverflowBubble: {
    minWidth: 40,
  },
  tagText: {
    flexShrink: 1,
  },
  summaryActionRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    maxWidth: '100%',
  },
  detailsButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    minWidth: 190,
    paddingHorizontal: 18,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  collapseButton: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  mediaIndicatorRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginLeft: 18,
    marginTop: 2,
  },
  mediaIndicator: {
    borderRadius: 999,
    height: 4,
    width: 18,
  },
});
