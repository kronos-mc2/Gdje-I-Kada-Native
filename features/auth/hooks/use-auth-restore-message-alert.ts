import { useEffect } from 'react';
import { Alert } from 'react-native';

import { useI18n } from '@/core/i18n/use-i18n';
import { useAuthStore } from '@/core/store/auth-store';

export function useAuthRestoreMessageAlert() {
  const { t } = useI18n();
  const consumeAuthRestoreMessage = useAuthStore((state) => state.consumeAuthRestoreMessage);

  useEffect(() => {
    const restoreMessage = consumeAuthRestoreMessage();
    if (restoreMessage) {
      Alert.alert(t('authError'), restoreMessage);
    }
  }, [consumeAuthRestoreMessage, t]);
}
