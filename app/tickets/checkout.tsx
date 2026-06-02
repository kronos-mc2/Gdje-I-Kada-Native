import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText } from '@/components/primitives';
import { useConfirmTicketCheckoutMutation, useCreateTicketCheckoutMutation, useEventQuery, useJoinEventMutation } from '@/core/api/query-hooks';
import { getEventPosterSource } from '@/core/events/event-cover';
import { useI18n } from '@/core/i18n/use-i18n';
import { STUB_PAYMENT_CONFIRMATION_TOKEN } from '@/core/payments/payment-provider';
import { useAppTheme } from '@/core/theme';
import { AppEvent, Locale } from '@/core/types/domain';
import { formatEventDay, formatEventTime } from '@/core/utils/date';

export default function TicketCheckoutScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { t, locale } = useI18n();
  const { theme } = useAppTheme();
  const { data: event, isLoading } = useEventQuery(eventId);
  const createCheckoutMutation = useCreateTicketCheckoutMutation();
  const confirmCheckoutMutation = useConfirmTicketCheckoutMutation();
  const joinEventMutation = useJoinEventMutation();
  const isPaid = event?.attendanceMode === 'paid' && event.priceAmount != null;
  const isWaitlist = event?.attendanceMode === 'waitlist';
  const isPending = createCheckoutMutation.isPending || confirmCheckoutMutation.isPending || joinEventMutation.isPending;
  const isActionDisabled = !event || event.canJoin === false || isPending;

  const handlePaidCheckout = async () => {
    if (!event) {
      return;
    }

    try {
      const checkout = await createCheckoutMutation.mutateAsync(event.id);
      if (checkout.status === 'succeeded') {
        const joinedEvent = await joinEventMutation.mutateAsync(event.id);
        Alert.alert(t('paymentSucceeded'));
        router.replace(`/event/${joinedEvent.id}`);
        return;
      }

      if (!checkout.orderId) {
        Alert.alert(t('paymentFailed'));
        return;
      }

      const result = await confirmCheckoutMutation.mutateAsync({
        orderId: checkout.orderId,
        confirmationToken: STUB_PAYMENT_CONFIRMATION_TOKEN,
      });
      Alert.alert(t('paymentSucceeded'));
      router.replace(`/event/${result.event.id}`);
    } catch {
      Alert.alert(t('paymentFailed'));
    }
  };

  const handleFreeJoin = async () => {
    if (!event) {
      return;
    }

    try {
      const joinedEvent = await joinEventMutation.mutateAsync(event.id);
      if (joinedEvent.attendanceStatus === 'waitlisted') {
        Alert.alert(t('eventJoined'), t('onWaitlist'));
      } else {
        Alert.alert(t('eventJoined'));
      }
      router.replace(`/event/${joinedEvent.id}`);
    } catch {
      Alert.alert(t('joinEventFailed'));
    }
  };

  const actionTitle = isPaid ? getPlatformPaymentLabel(t) : isWaitlist ? t('joinWaitlist') : t('joinEvent');

  return (
    <AppScreen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText variant="headline">{isPaid ? t('checkoutTitle') : t('eventAccessTitle')}</AppText>
          <AppText variant="caption" color="textMuted">
            {isPaid ? t('checkoutSubtitle') : t('eventAccessSubtitle')}
          </AppText>
        </View>
      </View>

      {event ? <CheckoutEventCard event={event} locale={locale} /> : null}

      <AppCard variant="glass" style={styles.card}>
        <AppText variant="bodyStrong">{t('orderSummary')}</AppText>
        {event ? (
          <View style={styles.summaryRows}>
            <SummaryRow label={t('ticketType')} value={getTicketTypeLabel(event, t)} />
            <SummaryRow label={t('priceAmountLabel')} value={getPriceLabel(event, locale, t)} />
            <SummaryRow label={t('paymentProvider')} value={isPaid ? t('stubPaymentProvider') : t('freePrice')} />
          </View>
        ) : (
          <AppText color="textMuted">{isLoading ? '...' : t('eventNotFound')}</AppText>
        )}
      </AppCard>

      <AppCard variant="glass" style={styles.card}>
        <View style={styles.paymentHeader}>
          <Ionicons name={isPaid ? 'card-outline' : 'ticket-outline'} size={20} color={theme.colors.mapAccent} />
          <AppText variant="bodyStrong">{isPaid ? t('paymentMethod') : t('eventAccessMethod')}</AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          {isPaid ? t('paymentStubNotice') : t('freeAccessNotice')}
        </AppText>
        <AppButton
          variant="glass"
          disabled={isActionDisabled}
          onPress={() => void (isPaid ? handlePaidCheckout() : handleFreeJoin())}
          style={[styles.primaryAction, { borderColor: theme.colors.mapAccent, backgroundColor: theme.colors.mapAccent }]}
        >
          <View style={styles.primaryActionContent}>
            <Ionicons name={isPaid ? 'card-outline' : 'ticket-outline'} size={20} color="#FFFFFF" />
            <AppText variant="bodyStrong" style={styles.primaryActionText}>
              {isPending ? t('loading') : actionTitle}
            </AppText>
          </View>
        </AppButton>
      </AppCard>
    </AppScreen>
  );
}

function CheckoutEventCard({ event, locale }: { event: AppEvent; locale: Locale }) {
  const { theme } = useAppTheme();
  const posterSource = getEventPosterSource(event);
  const startIso = event.startAt ?? event.whenISO;

  return (
    <AppCard variant="glass" style={styles.eventCard}>
      <View style={[styles.poster, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}>
        {posterSource ? (
          <Image source={posterSource} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Ionicons name="image-outline" size={24} color={theme.colors.textMuted} />
        )}
      </View>
      <View style={styles.eventCopy}>
        <AppText variant="headline" numberOfLines={2}>
          {event.title[locale]}
        </AppText>
        <View style={styles.eventMetaRow}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.mapAccent} />
          <AppText variant="caption" style={{ color: theme.colors.mapAccent }}>
            {formatEventDay(startIso, locale)}
          </AppText>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <AppText variant="caption" color="textMuted">
            {formatEventTime(startIso, locale)}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
      <AppText variant="body" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.summaryValue}>
        {value}
      </AppText>
    </View>
  );
}

function getTicketTypeLabel(event: AppEvent, t: ReturnType<typeof useI18n>['t']) {
  if (event.attendanceMode === 'paid') {
    return t('paidAttendance');
  }
  if (event.attendanceMode === 'waitlist') {
    return t('waitlistAttendance');
  }
  return t('openAttendance');
}

function getPriceLabel(event: AppEvent, locale: Locale, t: ReturnType<typeof useI18n>['t']) {
  if (event.attendanceMode !== 'paid' || event.priceAmount == null) {
    return t('freePrice');
  }

  return new Intl.NumberFormat(locale === 'hr' ? 'hr-HR' : 'en-US', {
    style: 'currency',
    currency: event.priceCurrency ?? 'EUR',
    maximumFractionDigits: Number(event.priceAmount) % 1 === 0 ? 0 : 2,
  }).format(Number(event.priceAmount));
}

function getPlatformPaymentLabel(t: ReturnType<typeof useI18n>['t']) {
  if (Platform.OS === 'ios') {
    return t('payWithApplePay');
  }
  if (Platform.OS === 'android') {
    return t('payWithGooglePay');
  }
  return t('payAndJoin');
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 14,
    paddingBottom: 24,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    gap: 12,
  },
  eventCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  poster: {
    alignItems: 'center',
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 68,
  },
  eventCopy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  eventMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryRows: {
    gap: 0,
  },
  summaryRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    minHeight: 38,
    paddingVertical: 8,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
  },
  paymentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryAction: {
    marginTop: 4,
  },
  primaryActionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
});
