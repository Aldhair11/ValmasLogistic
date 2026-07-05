import {
  CheckCircle2,
  Clock,
  Clock4,
  Package,
  TrendingUp,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ShipmentMetricsDto } from '../types';

interface DashboardCardsProps {
  metrics: ShipmentMetricsDto;
}

interface MetricCardConfig {
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  Icon: LucideIcon;
  trendLabel?: string;
  hint?: string;
  valueSize?: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatLastUpdated(iso: string | null): string {
  if (!iso) return 'Sin registros';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateTimeFormatter.format(date);
}

function DashboardCards({ metrics }: DashboardCardsProps) {
  const newToday = metrics.newShipmentsToday;
  const trendLabel =
    newToday > 0
      ? `+${newToday} nuevo${newToday === 1 ? '' : 's'} hoy`
      : undefined;

  const cards: MetricCardConfig[] = [
    {
      label: 'Total',
      value: metrics.totalShipments.toLocaleString('es-PE'),
      iconBg: 'bg-surface-container-low',
      iconColor: 'text-on-surface',
      Icon: Package,
      trendLabel,
    },
    {
      label: 'Pendientes',
      value: metrics.pending.toLocaleString('es-PE'),
      iconBg: 'bg-amber-400',
      iconColor: 'text-on-surface',
      Icon: Clock,
    },
    {
      label: 'En tránsito',
      value: metrics.inTransit.toLocaleString('es-PE'),
      iconBg: 'bg-blue-600',
      iconColor: 'text-white',
      Icon: Truck,
    },
    {
      label: 'Entregados',
      value: metrics.delivered.toLocaleString('es-PE'),
      iconBg: 'bg-green-600',
      iconColor: 'text-white',
      Icon: CheckCircle2,
    },
    {
      label: 'Cancelados',
      value: metrics.cancelled.toLocaleString('es-PE'),
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
      Icon: XCircle,
    },
    {
      label: 'Última actualización',
      value: formatLastUpdated(metrics.lastUpdatedAt),
      iconBg: 'bg-primary',
      iconColor: 'text-on-primary',
      Icon: Clock4,
      hint: metrics.lastUpdatedAt ? 'Último envío creado' : undefined,
      valueSize: 'text-base',
    },
  ];

  return (
    <section
      aria-label="Métricas de envíos"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      {cards.map((card) => (
        <article key={card.label} className="bento-cell p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-muted">
              {card.label}
            </p>
            <span
              className={`flex h-9 w-9 items-center justify-center border-2 border-on-surface shadow-brutal-sm ${card.iconBg} ${card.iconColor}`}
            >
              <card.Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <p
            className={`mt-3 font-extrabold tabular-nums text-on-surface ${card.valueSize ?? 'text-3xl'}`}
          >
            {card.value}
          </p>
          {card.trendLabel && (
            <p className="mt-2 inline-flex items-center gap-1 border-2 border-on-surface bg-green-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {card.trendLabel}
            </p>
          )}
          {card.hint && (
            <p className="mt-2 text-xs font-medium text-on-surface-muted">{card.hint}</p>
          )}
        </article>
      ))}
    </section>
  );
}

export default DashboardCards;
