import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useConfirmTicketCheckoutMutation, useCreateTicketCheckoutMutation } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { formatMoney, STUB_PAYMENT_CONFIRMATION_TOKEN } from '@/core/payments/payment-provider';
import { AppEvent } from '@/core/types/domain';

type UsePaidEventCheckoutOptions = {
  onAlreadyPaid: (eventId: string) => Promise<AppEvent>;
  onJoined: (event: AppEvent) => void;
};

export function usePaidEventCheckout({ onAlreadyPaid, onJoined }: UsePaidEventCheckoutOptions) {
  const { t } = useI18n();
  const createCheckoutMutation = useCreateTicketCheckoutMutation();
  const confirmCheckoutMutation = useConfirmTicketCheckoutMutation();
  const isPending = createCheckoutMutation.isPending || confirmCheckoutMutation.isPending;

  const startPaidJoin = useCallback(
    async (event: AppEvent) => {
      try {
        const checkout = await createCheckoutMutation.mutateAsync(event.id);
        if (checkout.status === 'succeeded') {
          const joinedEvent = await onAlreadyPaid(event.id);
          onJoined(joinedEvent);
          return;
        }
        if (!checkout.orderId) {
          Alert.alert(t('paymentFailed'));
          return;
        }

        const amount = formatMoney(checkout.amount, checkout.currency);
        Alert.alert(t('paymentRequired'), `${t('paymentStubDescription')} ${amount} (${checkout.provider}).`, [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('payAndJoin'),
            onPress: async () => {
              try {
                const result = await confirmCheckoutMutation.mutateAsync({
                  orderId: checkout.orderId!,
                  confirmationToken: STUB_PAYMENT_CONFIRMATION_TOKEN,
                });
                onJoined(result.event);
              } catch {
                Alert.alert(t('paymentFailed'));
              }
            },
          },
        ]);
      } catch {
        Alert.alert(t('paymentFailed'));
      }
    },
    [confirmCheckoutMutation, createCheckoutMutation, onAlreadyPaid, onJoined, t],
  );

  return {
    isPending,
    startPaidJoin,
  };
}
