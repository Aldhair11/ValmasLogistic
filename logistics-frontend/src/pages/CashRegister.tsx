import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CircleDollarSign, Eye, Wallet } from 'lucide-react';
import MasterPaginationBar from '../components/masters/MasterPaginationBar';
import MasterSearchPanel from '../components/masters/MasterSearchPanel';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import StatusBadge from '../components/StatusBadge';
import RoleGuard from '../components/RoleGuard';
import { MASTER_DEFAULT_PAGE_SIZE } from '../constants/masters';
import { formatCurrency, PAYMENT_METHOD_LABEL } from '../lib/paymentUtils';
import { notifyError } from '../lib/notify';
import { ShipmentService } from '../services/api';
import type {
  CashSummaryDto,
  PagedResult,
  PaymentMethod,
  ShipmentDto,
} from '../types';
import {
  emptyBoxClass,
  inputClass,
  labelClass,
  loadingBoxClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButtonClass,
  tableWrapperClass,
  tdClass,
  thClass,
} from './masters/shared';

type PaymentFilter = 'ALL' | PaymentMethod;
type PaidFilter = 'UNPAID' | 'PAID' | 'ALL';

const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos los mÃ©todos' },
  { value: 'PrePaid', label: PAYMENT_METHOD_LABEL.PrePaid },
  { value: 'CashOnDelivery', label: PAYMENT_METHOD_LABEL.CashOnDelivery },
];

const PAID_OPTIONS: { value: PaidFilter; label: string }[] = [
  { value: 'UNPAID', label: 'Pendiente de cobro' },
  { value: 'PAID', label: 'Cobrado / pagado' },
  { value: 'ALL', label: 'Todos' },
];

const actionButtonClass =
  'inline-flex h-9 items-center justify-center gap-1 border-2 border-on-surface bg-surface px-3 text-xs font-extrabold uppercase tracking-wide shadow-brutal-sm transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

function SummaryCard({
  title,
  count,
  amount,
  icon,
}: {
  title: string;
  count: number;
  amount: number;
  icon: ReactNode;
}) {
  return (
    <div className="bento-cell">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
            {title}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-on-surface">{count}</p>
          <p className="mt-1 text-sm font-semibold text-primary">
            {formatCurrency(amount)}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center border-2 border-on-surface bg-surface-container-low shadow-brutal-sm">
          {icon}
        </span>
      </div>
    </div>
  );
}

function CashRegister() {
  const [summary, setSummary] = useState<CashSummaryDto | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [paged, setPaged] = useState<PagedResult<ShipmentDto> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MASTER_DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [paidFilter, setPaidFilter] = useState<PaidFilter>('UNPAID');

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await ShipmentService.getCashSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setFetching(true);
    try {
      const data = await ShipmentService.getAll({
        page,
        pageSize,
        search: deferredSearch,
        ...(paymentFilter !== 'ALL' ? { paymentMethod: paymentFilter } : {}),
        ...(paidFilter === 'PAID'
          ? { isPaid: true }
          : paidFilter === 'UNPAID'
            ? { isPaid: false }
            : {}),
      });
      setPaged(data);
    } catch (err) {
      setPaged(null);
      notifyError(err, 'No se pudieron cargar los pagos.');
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, [page, pageSize, deferredSearch, paymentFilter, paidFilter]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const shipments = paged?.items ?? [];
  const totalCount = paged?.totalCount ?? 0;
  const totalPages = useMemo(
    () => (totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Wallet className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className={pageTitleClass}>Caja</h1>
        </div>
        <p className={pageSubtitleClass}>
          Control de cobros, pagos pendientes e ingresos por envÃ­o.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bento-cell h-28 animate-pulse bg-surface-container-low" />
          ))
        ) : summary ? (
          <>
            <SummaryCard
              title="Pendientes de cobro"
              count={summary.pendingPaymentsCount}
              amount={summary.pendingPaymentsAmount}
              icon={<CircleDollarSign className="h-5 w-5 text-amber-700" />}
            />
            <SummaryCard
              title="Cobrado hoy"
              count={summary.collectedTodayCount}
              amount={summary.collectedTodayAmount}
              icon={<Banknote className="h-5 w-5 text-green-700" />}
            />
            <SummaryCard
              title="Prepago confirmado"
              count={summary.prePaidCount}
              amount={summary.prePaidAmount}
              icon={<Wallet className="h-5 w-5 text-primary" />}
            />
            <SummaryCard
              title="Contra entrega pendiente"
              count={summary.cashOnDeliveryPendingCount}
              amount={summary.cashOnDeliveryPendingAmount}
              icon={<CircleDollarSign className="h-5 w-5 text-red-700" />}
            />
          </>
        ) : null}
      </div>

      <MasterSearchPanel
        id="cash-search"
        label="Buscar por tracking o cliente"
        value={search}
        placeholder="Tracking, remitente o destinatario..."
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <div className="bento-cell grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cash-payment-filter" className={labelClass}>
            MÃ©todo de pago
          </label>
          <select
            id="cash-payment-filter"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value as PaymentFilter);
              setPage(1);
            }}
            className={inputClass}
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cash-paid-filter" className={labelClass}>
            Estado de cobro
          </label>
          <select
            id="cash-paid-filter"
            value={paidFilter}
            onChange={(e) => {
              setPaidFilter(e.target.value as PaidFilter);
              setPage(1);
            }}
            className={inputClass}
          >
            {PAID_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={tableWrapperClass}>
        {initialLoading ? (
          <div className={loadingBoxClass}>
            <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
          </div>
        ) : shipments.length === 0 ? (
          <div className={emptyBoxClass}>
            <p>No hay registros de pago con los filtros actuales.</p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto transition-opacity ${fetching ? 'opacity-60' : ''}`}
            aria-busy={fetching}
          >
            <table className="min-w-full border-2 border-on-surface">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className={thClass}>Tracking</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>MÃ©todo</th>
                  <th className={thClass}>Monto</th>
                  <th className={thClass}>Estado pedido</th>
                  <th className={thClass}>Cobro</th>
                  <th className={`${thClass} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-surface-container-low">
                    <td className={`${tdClass} font-mono`}>{shipment.trackingNumber}</td>
                    <td className={tdClass}>{shipment.senderName ?? 'â€”'}</td>
                    <td className={tdClass}>
                      {PAYMENT_METHOD_LABEL[shipment.paymentMethod]}
                    </td>
                    <td className={`${tdClass} font-mono`}>
                      {formatCurrency(shipment.shippingAmount)}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className={tdClass}>
                      <PaymentStatusBadge
                        isPaid={shipment.isPaid}
                        paymentMethod={shipment.paymentMethod}
                      />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/shipments/${shipment.id}`}
                          className={actionButtonClass}
                          title="Ver envÃ­o"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <MasterPaginationBar
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          hasPrev={hasPrev}
          hasNext={hasNext}
          disabled={fetching}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => prev + 1)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

function CashRegisterPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Worker']}>
      <CashRegister />
    </RoleGuard>
  );
}

export default CashRegisterPage;





