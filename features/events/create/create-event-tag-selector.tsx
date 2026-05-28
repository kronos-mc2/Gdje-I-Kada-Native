import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/primitives';
import {
  canSelectEventTag,
  countSelectedTagsInCategory,
  EVENT_TAG_CATEGORIES,
  filterEventTags,
  MAX_EVENT_TAGS_PER_CATEGORY,
  MAX_EVENT_TAGS_TOTAL,
} from '@/core/events/event-tags';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import type { Locale } from '@/core/types/domain';

type CreateEventTagSelectorProps = Readonly<{
  selectedTags: string[];
  locale: Locale;
  onChange: (tags: string[]) => void;
}>;

export function CreateEventTagSelector({ selectedTags, locale, onChange }: CreateEventTagSelectorProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const selectedTagSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTagSet.has(tag)) {
      onChange(selectedTags.filter((selectedTag) => selectedTag !== tag));
      return;
    }

    if (!canSelectEventTag(selectedTags, tag)) {
      return;
    }

    onChange([...selectedTags, tag]);
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="bodyStrong">{t('eventTags')}</AppText>
          <AppText variant="caption" color="textMuted">
            {t('eventTagsHint')}
          </AppText>
        </View>
        <View style={[styles.countPill, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}>
          <AppText variant="caption" color="textSecondary">
            {selectedTags.length}/{MAX_EVENT_TAGS_TOTAL}
          </AppText>
        </View>
      </View>

      <View style={[styles.searchRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}>
        <Ionicons name="search" size={16} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchTags')}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.searchInput, { color: theme.colors.textPrimary, fontFamily: theme.tokens.typography.body.fontFamily }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('clearSearch')} onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.categoryScroll}>
        {EVENT_TAG_CATEGORIES.map((category) => {
          const visibleTags = filterEventTags(query, category.tags);
          const selectedCount = countSelectedTagsInCategory(selectedTags, category.id);

          if (visibleTags.length === 0) {
            return null;
          }

          return (
            <View key={category.id} style={styles.categoryBlock}>
              <View style={styles.categoryHeader}>
                <AppText variant="label" color="textSecondary">
                  {category.title[locale]}
                </AppText>
                <AppText variant="caption" color={selectedCount >= MAX_EVENT_TAGS_PER_CATEGORY ? 'textSecondary' : 'textMuted'}>
                  {selectedCount}/{MAX_EVENT_TAGS_PER_CATEGORY}
                </AppText>
              </View>

              <View style={styles.tagWrap}>
                {visibleTags.map((tag) => {
                  const selected = selectedTagSet.has(tag);
                  const disabled = !selected && !canSelectEventTag(selectedTags, tag);

                  return (
                    <Pressable
                      key={`${category.id}-${tag}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled }}
                      disabled={disabled}
                      onPress={() => toggleTag(tag)}
                      style={({ pressed }) => [
                        styles.tagChip,
                        {
                          borderColor: selected ? theme.colors.mapAccent : theme.colors.border,
                          backgroundColor: selected ? theme.colors.mapAccentSoft : theme.colors.surfaceElevated,
                          opacity: disabled ? 0.42 : pressed ? 0.78 : 1,
                        },
                      ]}
                    >
                      <AppText variant="caption" style={{ color: selected ? theme.colors.mapAccent : theme.colors.textSecondary }}>
                        {tag}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  countPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  searchRow: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 0,
  },
  categoryScroll: {
    maxHeight: 360,
  },
  categoryBlock: {
    gap: 8,
    paddingBottom: 14,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
});
