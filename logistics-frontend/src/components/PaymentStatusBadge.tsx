import { paymentStatusLabel } from '../lib/paymentUtils';
import type { PaymentMethod } from '../types';

interface PaymentStatusBadgeProps {
  isPaid: boolean;
  paymentMethod: PaymentMethod;
}

function PaymentStatusBadge({ isPaid, paymentMethod }: PaymentStatusBadgeProps) {
  const label = paymentStatusLabel(isPaid, paymentMethod);

  return (
    <span
      className={`inline-flex border-2 border-on-surface px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide shadow-brutal-sm ${
        isPaid
          ? 'bg-green-100 text-green-800'
          : 'bg-amber-100 text-amber-900'
      }`}
    >
      {label}
    </span>
  );
}

export default PaymentStatusBadge;



