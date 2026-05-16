import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives';
import { useI18n } from '@/core/i18n/use-i18n';
import { useAppTheme } from '@/core/theme';
import { Transaction } from '@/core/types/domain';
import { formatEventDate } from '@/core/utils/date';

type TransactionRowProps = Readonly<{
  transaction: Transaction;
}>;

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { theme } = useAppTheme();
  const { locale } = useI18n();
  const amount = `${Number(transaction.amount).toFixed(2)} ${transaction.currency}`;
  const providerLabel = transaction.paymentProvider ? ` · ${transaction.paymentProvider}` : '';

  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
      <View style={[styles.iconFrame, { backgroundColor: theme.colors.mapAccentSoft }]}>
        <Ionicons name="receipt-outline" size={19} color={theme.colors.mapAccent} />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {transaction.eventTitle || transaction.description || transaction.type}
        </AppText>
        <AppText variant="caption" color="textMuted" style={styles.meta}>
          {formatEventDate(transaction.createdAt, locale)} · {transaction.status}
          {providerLabel}
        </AppText>
        {transaction.orderId ? (
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {transaction.orderId}
          </AppText>
        ) : null}
      </View>
      <AppText variant="bodyStrong">{amount}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconFrame: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  meta: {
    marginTop: 2,
  },
});
