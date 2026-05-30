import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppIconButton, AppScreen, AppText } from '@/components/primitives';
import { useTransactionsQuery } from '@/core/api/query-hooks';
import { useI18n } from '@/core/i18n/use-i18n';
import { TransactionRow } from '@/features/profile/components/transaction-row';

export default function TransactionsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: transactions = [], isLoading } = useTransactionsQuery();

  return (
    <AppScreen scroll>
      <View style={styles.header}>
        <AppIconButton icon="arrow-back" onPress={() => router.back()} />
        <AppText variant="headline">{t('myTickets')}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <AppCard variant="glass" style={styles.card}>
        {isLoading ? (
          <AppText variant="body" color="textMuted">
            {t('loading')}
          </AppText>
        ) : transactions.length === 0 ? (
          <AppText variant="body" color="textMuted">
            {t('noTransactions')}
          </AppText>
        ) : (
          transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSpacer: {
    width: 36,
  },
  card: {
    gap: 10,
  },
});
