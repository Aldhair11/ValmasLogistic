import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { Eye, Package } from 'lucide-react';
import MasterPaginationBar from '../components/masters/MasterPaginationBar';
import StatusBadge from '../components/StatusBadge';
import RoleGuard from '../components/RoleGuard';
import { MASTER_DEFAULT_PAGE_SIZE } from '../constants/masters';
import { formatCurrency, PAYMENT_METHOD_LABEL } from '../lib/paymentUtils';
import { notifyError } from '../lib/notify';
import { ShipmentService } from '../services/api';
import type { PagedResult, PaymentMethod, ShipmentDto, ShipmentStatus } from '../types';
import {
  emptyBoxClass,
  inputClass,
  labelClass,
  loadingBoxClass,
  pageSubtitleClass,
  pageTitleClass,
  tableWrapperClass,
  tdClass,
  thClass,
} from './masters/shared';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type StatusFilter = ShipmentStatus | 'IN_COURSE' | 'ALL';
type PaymentFilter = 'ALL' | PaymentMethod;
type PaidFilter = 'ALL' | 'PAID' | 'UNPAID';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'IN_COURSE', label: 'En curso' },
  { value: 'PendingValidation', label: 'Requieren validaciÃ³n' },
  { value: 'Pending', label: 'Pendiente' },
  { value: 'InTransit', label: 'En trÃ¡nsito' },
  { value: 'Delivered', label: 'Entregado' },
  { value: 'Cancelled', label: 'Cancelado' },
];

const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos los mÃ©todos' },
  { value: 'PrePaid', label: PAYMENT_METHOD_LABEL.PrePaid },
  { value: 'CashOnDelivery', label: PAYMENT_METHOD_LABEL.CashOnDelivery },
];

const PAID_OPTIONS: { value: PaidFilter; label: string }[] = [
  { value: 'ALL', label: 'Todo el cobro' },
  { value: 'PAID', label: 'Pagado / cobrado' },
  { value: 'UNPAID', label: 'Pendiente de cobro' },
];

function buildQueryParams(
  page: number,
  pageSize: number,
  search: string,
  statusFilter: StatusFilter,
  paymentFilter: PaymentFilter,
  paidFilter: PaidFilter,
) {
  const params: Parameters<typeof ShipmentService.getAll>[0] = {
    page,
    pageSize,
    search,
  };

  if (statusFilter === 'IN_COURSE') {
    params.statuses = 'Pending,InTransit';
  } else if (statusFilter !== 'ALL') {
    params.status = statusFilter;
  }

  if (paymentFilter !== 'ALL') {
    params.paymentMethod = paymentFilter;
  }

  if (paidFilter === 'PAID') {
    params.isPaid = true;
  } else if (paidFilter === 'UNPAID') {
    params.isPaid = false;
  }

  return params;
}

function Shipments() {
  const [paged, setPaged] = useState<PagedResult<ShipmentDto> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MASTER_DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [paidFilter, setPaidFilter] = useState<PaidFilter>('ALL');

  const loadShipments = useCallback(async () => {
    setFetching(true);
    try {
      const data = await ShipmentService.getAll(
        buildQueryParams(
          page,
          pageSize,
          '',
          statusFilter,
          paymentFilter,
          paidFilter,
        ),
      );
      setPaged(data);
    } catch (err) {
      setPaged(null);
      notifyError(err, 'No se pudieron cargar los envÃ­os.');
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, [page, pageSize, '', statusFilter, paymentFilter, paidFilter]);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

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
  const isSearching = ''.trim().length > 0;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Package className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className={pageTitleClass}>EnvÃ­os</h1>
        </div>
        <p className={pageSubtitleClass}>
          Consulta, filtra y gestiona todos los envÃ­os del sistema.
        </p>
      </header>

      <MasterSearchPanel
        id="shipment-search"
        label="Buscar envÃ­o"
        value={search}
        placeholder="Tracking, cliente, ciudad o sucursal..."
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <div className="bento-cell grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="shipment-status-filter" className={labelClass}>
            Estado del pedido
          </label>
          <select
            id="shipment-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="shipment-payment-filter" className={labelClass}>
            MÃ©todo de pago
          </label>
          <select
            id="shipment-payment-filter"
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
          <label htmlFor="shipment-paid-filter" className={labelClass}>
            Estado de pago
          </label>
          <select
            id="shipment-paid-filter"
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
            <p>
              {statusFilter !== 'ALL' || paymentFilter !== 'ALL' || paidFilter !== 'ALL'
                ? 'No hay envÃ­os que coincidan con los filtros.'
                : 'No hay envÃ­os registrados.'}
            </p>
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
                  <th className={thClass}>Remitente</th>
                  <th className={thClass}>Destino</th>
                  <th className={thClass}>MÃ©todo</th>
                  <th className={thClass}>Monto</th>
                  <th className={thClass}>Pago</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Fecha</th>
                  <th className={`${thClass} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-surface-container-low">
                    <td className={`${tdClass} font-mono`}>
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className="font-extrabold text-primary underline-offset-2 hover:underline"
                      >
                        {shipment.trackingNumber}
                      </Link>
                    </td>
                    <td className={tdClass}>{shipment.senderName ?? 'â€”'}</td>
                    <td className={tdClass}>
                      {shipment.destination.city}, {shipment.destination.state}
                    </td>
                    <td className={tdClass}>
                      {PAYMENT_METHOD_LABEL[shipment.paymentMethod]}
                    </td>
                    <td className={`${tdClass} font-mono`}>
                      {formatCurrency(shipment.shippingAmount)}
                    </td>
                    <td className={tdClass}>{shipment.isPaid ? 'Pagado' : 'Pendiente'}</td>
                    <td className={tdClass}>
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className={tdClass}>
                      {dateFormatter.format(new Date(shipment.createdAt))}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-surface shadow-brutal-sm transition hover:bg-surface-container-low"
                        aria-label={`Ver envÃ­o ${shipment.trackingNumber}`}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
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

function ShipmentsPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Worker']}>
      <Shipments />
    </RoleGuard>
  );
}

export default ShipmentsPage;





