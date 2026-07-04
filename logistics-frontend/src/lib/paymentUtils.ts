import type { PaymentMethod } from '../types';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PrePaid: 'Prepago',
  CashOnDelivery: 'Contra entrega',
};

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function paymentStatusLabel(isPaid: boolean, paymentMethod: PaymentMethod): string {
  if (isPaid) {
    return paymentMethod === 'PrePaid' ? 'Prepago confirmado' : 'Cobrado';
  }

  return paymentMethod === 'PrePaid' ? 'Pendiente prepago' : 'Pendiente de cobro';
}



