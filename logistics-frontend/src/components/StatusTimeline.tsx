import { Check, Package, Truck, X } from 'lucide-react';
import type { ShipmentStatus } from '../types';

interface StatusTimelineProps {
  status: ShipmentStatus;
  className?: string;
}

interface Step {
  status: ShipmentStatus;
  label: string;
  Icon: typeof Check;
}


const STEPS: Step[] = [
  { status: 'Pending', label: 'Pendiente', Icon: Package },
  { status: 'InTransit', label: 'En tránsito', Icon: Truck },
  { status: 'Delivered', label: 'Entregado', Icon: Check },
];

const STATUS_ORDER: Record<ShipmentStatus, number> = {
  PendingValidation: -2,
  Pending: 0,
  InTransit: 1,
  Delivered: 2,
  Cancelled: -1,
};

function StatusTimeline({ status, className = '' }: StatusTimelineProps) {
  if (status === 'Cancelled') {
    return (
      <div
        className={`rounded-xl border border-red-200 bg-red-50 p-6 ${className}`}
        aria-label="Estado del envío: cancelado"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow">
            <X className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Envío cancelado
            </p>
            <p className="mt-1 text-sm text-red-700/80">
              Este envío fue cancelado y ya no continuará su ruta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER[status];

  
  const isDelivered = status === 'Delivered';
  const completedUpTo = isDelivered ? STEPS.length : currentIndex;

  return (
    <ol
      aria-label="Progreso del envío"
      className={`relative flex items-start justify-between gap-2 ${className}`}
    >
      {STEPS.map((step, index) => {
        const isCompleted = index < completedUpTo;
        const isCurrent = !isDelivered && index === currentIndex;

        const circleClasses = isCompleted
          ? 'bg-green-500 text-white ring-green-200'
          : isCurrent
            ? 'bg-blue-500 text-white ring-blue-200 animate-pulse'
            : 'bg-slate-200 text-slate-500 ring-slate-100';

        const labelClasses = isCompleted
          ? 'text-green-700'
          : isCurrent
            ? 'text-blue-700'
            : 'text-slate-500';

        const isLast = index === STEPS.length - 1;

        const leftConnectorCompleted = index > 0 && index <= completedUpTo;
        const rightConnectorCompleted = !isLast && index < completedUpTo;

        return (
          <li
            key={step.status}
            className="relative flex flex-1 flex-col items-center text-center"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex w-full items-center">
              <span
                aria-hidden="true"
                className={`h-1 flex-1 ${
                  index === 0
                    ? 'invisible'
                    : leftConnectorCompleted
                      ? 'bg-green-500'
                      : 'bg-slate-200'
                }`}
              />
              <span
                className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow ring-4 ${circleClasses}`}
              >
                <step.Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span
                aria-hidden="true"
                className={`h-1 flex-1 ${
                  isLast
                    ? 'invisible'
                    : rightConnectorCompleted
                      ? 'bg-green-500'
                      : 'bg-slate-200'
                }`}
              />
            </div>
            <p
              className={`mt-2 text-xs font-semibold uppercase tracking-wide sm:text-sm ${labelClasses}`}
            >
              {step.label}
            </p>
            {isCurrent && (
              <p className="mt-0.5 text-xs text-blue-600">En curso</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default StatusTimeline;
