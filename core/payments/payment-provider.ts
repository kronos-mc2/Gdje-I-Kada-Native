export const STUB_PAYMENT_CONFIRMATION_TOKEN = 'stub-payment-confirmed';

export function formatMoney(amount: number, currency: string) {
  return `${Number(amount).toFixed(2)} ${currency.toUpperCase()}`;
}
