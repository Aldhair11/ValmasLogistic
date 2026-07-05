import type { ShipmentStatus } from '../types';

export const STATUS_OPTIONS: ShipmentStatus[] = [
  'PendingValidation',
  'Pending',
  'InTransit',
  'Delivered',
  'Cancelled',
];

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  PendingValidation: 'Pendiente de Validación',
  Pending: 'Pendiente',
  InTransit: 'En tránsito',
  Delivered: 'Entregado',
  Cancelled: 'Cancelado',
};

export const STATUS_BADGE_CLASS: Record<ShipmentStatus, string> = {
  PendingValidation: 'bg-amber-400 text-on-surface',
  Pending: 'bg-surface-container-low text-on-surface',
  InTransit: 'bg-blue-600 text-white',
  Delivered: 'bg-green-600 text-white',
  Cancelled: 'bg-red-600 text-white',
};

interface StatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
}

function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border-2 border-on-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE_CLASS[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export default StatusBadge;
