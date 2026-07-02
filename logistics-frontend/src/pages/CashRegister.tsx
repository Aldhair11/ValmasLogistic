import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CircleDollarSign, Eye, Wallet } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import RoleGuard from '../components/RoleGuard';
import { formatCurrency } from '../lib/paymentUtils';
import { ShipmentService } from '../services/api';
import type { CashSummaryDto, PagedResult, ShipmentDto } from '../types';
import {
  emptyBoxClass,
  loadingBoxClass,
  pageSubtitleClass,
  pageTitleClass,
  tableWrapperClass,
  tdClass,
  thClass,
} from './masters/shared';

function SummaryCard({ title, count, amount, icon }: { title: string; count: number; amount: number; icon: ReactNode }) {
  return (
    <div className="bento-cell">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-on-surface">{count}</p>
          <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(amount)}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center border-2 border-on-surface bg-surface-container-low shadow-brutal-sm">{icon}</span>
      </div>
    </div>
  );
}

function CashRegister() {
  const [summary, setSummary] = useState<CashSummaryDto | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [paged, setPaged] = useState<PagedResult<ShipmentDto> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try { setSummary(await ShipmentService.getCashSummary()); } catch { setSummary(null); }
    finally { setSummaryLoading(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      setPaged(await ShipmentService.getAll({ page: 1, pageSize: 20, search: '', isPaid: false }));
    } catch { setPaged(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { void loadPayments(); }, [loadPayments]);

  const shipments = paged?.items ?? [];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Wallet className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className={pageTitleClass}>Caja</h1>
        </div>
        <p className={pageSubtitleClass}>Resumen de cobros e ingresos por envio.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bento-cell h-28 animate-pulse bg-surface-container-low" />
        )) : summary ? (
          <>
            <SummaryCard title="Pendientes de cobro" count={summary.pendingPaymentsCount} amount={summary.pendingPaymentsAmount} icon={<CircleDollarSign className="h-5 w-5 text-amber-700" />} />
            <SummaryCard title="Cobrado hoy" count={summary.collectedTodayCount} amount={summary.collectedTodayAmount} icon={<Banknote className="h-5 w-5 text-green-700" />} />
            <SummaryCard title="Prepago confirmado" count={summary.prePaidCount} amount={summary.prePaidAmount} icon={<Wallet className="h-5 w-5 text-primary" />} />
            <SummaryCard title="Contra entrega pendiente" count={summary.cashOnDeliveryPendingCount} amount={summary.cashOnDeliveryPendingAmount} icon={<CircleDollarSign className="h-5 w-5 text-red-700" />} />
          </>
        ) : null}
      </div>

      <div className={tableWrapperClass}>
        {loading ? (
          <div className={loadingBoxClass}><div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" /></div>
        ) : shipments.length === 0 ? (
          <div className={emptyBoxClass}><p>No hay pagos pendientes.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-on-surface">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className={thClass}>Tracking</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Monto</th>
                  <th className={thClass}>Estado pedido</th>
                  <th className={`${thClass} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td className={`${tdClass} font-mono`}>{shipment.trackingNumber}</td>
                    <td className={tdClass}>{shipment.senderName ?? '-'}</td>
                    <td className={`${tdClass} font-mono`}>{formatCurrency(shipment.shippingAmount)}</td>
                    <td className={tdClass}><StatusBadge status={shipment.status} /></td>
                    <td className={`${tdClass} text-right`}>
                      <Link to={`/shipments/${shipment.id}`} className="inline-flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-surface shadow-brutal-sm">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CashRegisterPage() {
  return (<RoleGuard allowedRoles={['Admin', 'Worker']}><CashRegister /></RoleGuard>);
}

export default CashRegisterPage;
