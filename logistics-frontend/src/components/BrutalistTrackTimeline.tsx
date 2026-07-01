import type { ShipmentStatus } from '../types';

const STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: 'Pending', label: 'Pendiente' },
  { status: 'InTransit', label: 'En tránsito' },
  { status: 'Delivered', label: 'Entregado' },
];

const STATUS_ORDER: Record<ShipmentStatus, number> = {
  PendingValidation: 0,
  Pending: 0,
  InTransit: 1,
  Delivered: 2,
  Cancelled: -1,
};

interface BrutalistTrackTimelineProps {
  status: ShipmentStatus;
}

function BrutalistTrackTimeline({ status }: BrutalistTrackTimelineProps) {
  if (status === 'Cancelled') {
    return (
      <div
        className="border-2 border-on-surface bg-red-100 p-4 shadow-brutal"
        aria-label="Estado del envío: cancelado"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-red-800">
          Envío cancelado
        </p>
        <p className="mt-1 text-sm font-semibold text-red-900">
          Este envío ya no está en circulación.
        </p>
      </div>
    );
  }

  const currentOrder = STATUS_ORDER[status];

  return (
    <div
      className="flex items-start justify-between gap-2"
      aria-label="Progreso del envío"
    >
      {STEPS.map((step, index) => {
        const stepOrder = STATUS_ORDER[step.status];
        const isComplete = currentOrder > stepOrder;
        const isCurrent = currentOrder === stepOrder;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.status} className="flex flex-1 items-start">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center border-2 border-on-surface ${
                  isComplete || isCurrent
                    ? 'bg-primary'
                    : 'bg-surface'
                } shadow-brutal-sm`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {(isComplete || isCurrent) && (
                  <span className="h-2.5 w-2.5 bg-on-primary" aria-hidden="true" />
                )}
              </div>
              <p
                className={`mt-3 text-center text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
                  isCurrent ? 'text-on-surface' : 'text-on-surface-muted'
                }`}
              >
                {step.label}
              </p>
            </div>

            {!isLast && (
              <div
                className="mx-2 mt-4 h-1 flex-1 border-t-4 border-on-surface"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BrutalistTrackTimeline;
