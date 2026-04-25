import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Alert, Modal, Pressable, Share, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/components/primitives';
import { useConversationsQuery, useShareEventMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type EventShareModalProps = {
  event?: AppEvent | null;
  visible: boolean;
  locale: Locale;
  onClose: () => void;
};

export function EventShareModal({ event, visible, locale, onClose }: EventShareModalProps) {
  const { t } = useI18n();
  const { theme } = useAppTheme();
  const { data: conversations = [] } = useConversationsQuery();
  const shareEventMutation = useShareEventMutation();

  const nativeMessage = useMemo(() => {
    if (!event) {
      return '';
    }

    return `${event.title[locale]}\n${event.where[locale]}\n${formatEventDate(event.whenISO, locale)}\n\n${event.about[locale]}`;
  }, [event, locale]);

  const onNativeShare = async () => {
    if (!event) {
      return;
    }

    try {
      await Share.share({
        title: event.title[locale],
        message: nativeMessage,
      });
    } catch {
      // ignore native share dismiss/errors
    }
  };

  const onShareToConversation = async (conversationId: string) => {
    if (!event) {
      return;
    }

    try {
      const conversation = await shareEventMutation.mutateAsync({ conversationId, eventId: event.id });
      Alert.alert(t('eventSharedToChat'), conversation.contact);
      onClose();
    } catch {
      Alert.alert(t('eventShareFailed'));
    }
  };

  return (
    <Modal visible={visible && !!event} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable style={styles.panelPressable} onPress={() => {}}>
          <AppCard variant="glass" style={styles.panel}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <AppText variant="headline">{t('shareEvent')}</AppText>
                {event ? (
                  <AppText variant="body" color="textSecondary" style={styles.eventTitle}>
                    {event.title[locale]}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, { borderColor: theme.colors.border, opacity: pressed ? 0.74 : 1 }]}
              >
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <AppText variant="label" color="textMuted" style={styles.sectionLabel}>
              {t('shareToChats')}
            </AppText>

            {conversations.length === 0 ? (
              <AppText variant="body" color="textMuted">
                {t('noConversations')}
              </AppText>
            ) : (
              conversations.map((conversation) => (
                <Pressable
                  key={conversation.id}
                  onPress={() => void onShareToConversation(conversation.id)}
                  disabled={shareEventMutation.isPending}
                  style={({ pressed }) => [
                    styles.conversationButton,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      opacity: pressed || shareEventMutation.isPending ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={styles.conversationCopy}>
                    <AppText variant="bodyStrong">{conversation.contact}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {conversation.lastMessage[locale]}
                    </AppText>
                  </View>
                  <Ionicons name="paper-plane-outline" size={18} color={theme.colors.textSecondary} />
                </Pressable>
              ))
            )}

            <View style={styles.footerActions}>
              <AppButton title={t('shareOutsideApp')} variant="glass" style={styles.footerButton} onPress={() => void onNativeShare()} />
              <AppButton title={t('cancel')} variant="secondary" style={styles.footerButton} onPress={onClose} />
            </View>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  panelPressable: {
    width: '100%',
  },
  panel: {
    gap: 14,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eventTitle: {
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: 4,
  },
  conversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  conversationCopy: {
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  footerButton: {
    flex: 1,
  },
});
