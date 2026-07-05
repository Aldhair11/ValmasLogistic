import { useMemo } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { STATUS_LABEL } from './StatusBadge';
import type { ShipmentMetricsDto, ShipmentStatus } from '../types';

interface DashboardChartsProps {
  metrics: ShipmentMetricsDto;
}

interface ChartSlice {
  name: string;
  value: number;
  color: string;
  status: ShipmentStatus;
}

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  PendingValidation: '#d97706',
  Pending: '#64748b',
  InTransit: '#2563eb',
  Delivered: '#16a34a',
  Cancelled: '#dc2626',
};

function DashboardCharts({ metrics }: DashboardChartsProps) {
  const data = useMemo<ChartSlice[]>(() => {
    const rows: ChartSlice[] = [
      { status: 'Pending', name: STATUS_LABEL.Pending, value: metrics.pending, color: STATUS_COLORS.Pending },
      { status: 'InTransit', name: STATUS_LABEL.InTransit, value: metrics.inTransit, color: STATUS_COLORS.InTransit },
      { status: 'Delivered', name: STATUS_LABEL.Delivered, value: metrics.delivered, color: STATUS_COLORS.Delivered },
      { status: 'Cancelled', name: STATUS_LABEL.Cancelled, value: metrics.cancelled, color: STATUS_COLORS.Cancelled },
    ];
    return rows.filter((row) => row.value > 0);
  }, [metrics]);

  const total = metrics.totalShipments;
  const hasData = total > 0 && data.length > 0;

  return (
    <section aria-label="Distribución de envíos por estado" className="bento-cell">
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal-sm">
          <PieChartIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-tight text-on-surface">
            Distribución por estado
          </h2>
          <p className="text-xs font-medium text-on-surface-muted">
            Proporción de envíos según su estado actual.
          </p>
        </div>
      </header>

      {hasData ? (
        <div className="relative mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke="#0F172A"
                strokeWidth={2}
              >
                {data.map((slice) => (
                  <Cell key={slice.status} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const numeric = typeof value === 'number' ? value : Number(value);
                  return [
                    `${numeric} envío${numeric === 1 ? '' : 's'}`,
                    name,
                  ];
                }}
                contentStyle={{
                  borderRadius: 0,
                  border: '2px solid #0F172A',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
              <Legend
                iconType="square"
                wrapperStyle={{ fontSize: 12, paddingTop: 8, fontWeight: 700 }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
              Total
            </p>
            <p className="text-3xl font-extrabold tabular-nums text-on-surface">
              {total.toLocaleString('es-PE')}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex h-64 flex-col items-center justify-center border-2 border-dashed border-on-surface bg-surface-container-low text-center text-on-surface-muted">
          <p className="text-sm font-bold uppercase tracking-wide">
            Aún no hay envíos suficientes para mostrar el gráfico.
          </p>
        </div>
      )}
    </section>
  );
}

export default DashboardCharts;
