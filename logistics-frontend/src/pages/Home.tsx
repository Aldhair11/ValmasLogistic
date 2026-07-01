import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Radio } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ShipmentService } from '../services/api';
import {
  setupSignalRConnection,
  stopSignalRConnection,
} from '../services/signalr';
import { notifyError, notifyInfo, notifySuccess } from '../lib/notify';
import {
  buildMetricsFromShipments,
  fetchAllTenantShipments,
} from '../lib/dashboardMetrics';
import StatusBadge, {
  STATUS_LABEL,
} from '../components/StatusBadge';
import DashboardCards from '../components/DashboardCards';
import DashboardCharts from '../components/DashboardCharts';
import RoleGuard from '../components/RoleGuard';
import type {
  PagedResult,
  ShipmentDto,
  ShipmentStatus,
} from '../types';

const PAGE_SIZE = 10;

const QUICK_FILTER_IN_COURSE = -1;

type QuickFilter = number | 'ALL';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter.format(date);
}

function statusToNumber(status: ShipmentStatus): number {
  const map: Record<ShipmentStatus, number> = {
    Pending: 0,
    InTransit: 1,
    Delivered: 2,
    Cancelled: 3,
    PendingValidation: 4,
  };
  return map[status];
}

function matchesQuickFilter(
  status: ShipmentStatus,
  filter: QuickFilter,
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 4) return statusToNumber(status) === 4;
  if (filter === QUICK_FILTER_IN_COURSE) {
    const value = statusToNumber(status);
    return value === 0 || value === 1;
  }
  return statusToNumber(status) === filter;
}

function Home() {
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<QuickFilter>('ALL');

  const [paged, setPaged] = useState<PagedResult<ShipmentDto> | null>(null);
  const [tenantShipments, setTenantShipments] = useState<ShipmentDto[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [listFailed, setListFailed] = useState(false);

  const metrics = useMemo(
    () =>
      tenantShipments.length > 0 || !metricsLoading
        ? buildMetricsFromShipments(tenantShipments)
        : null,
    [tenantShipments, metricsLoading],
  );

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await ShipmentService.getAll({
        page,
        pageSize: PAGE_SIZE,
        status:
          statusFilter === 4 ? ('PendingValidation' as ShipmentStatus) : undefined,
      });
      setPaged(data);
      setListFailed(false);
    } catch (err) {
      setPaged(null);
      setListFailed(true);
      notifyError(err, 'No se pudieron cargar los envíos.');
    } finally {
      setListLoading(false);
    }
  }, [page, statusFilter]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const shipments = await fetchAllTenantShipments();
      setTenantShipments(shipments);
    } catch {
      setTenantShipments([]);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);


  const fetchListRef = useRef(fetchList);
  const fetchMetricsRef = useRef(fetchMetrics);
  useEffect(() => {
    fetchListRef.current = fetchList;
  }, [fetchList]);
  useEffect(() => {
    fetchMetricsRef.current = fetchMetrics;
  }, [fetchMetrics]);


  useEffect(() => {
    const connection = setupSignalRConnection(async (shipmentId) => {
      void fetchListRef.current();
      void fetchMetricsRef.current();

      try {
        const shipment = await ShipmentService.getById(shipmentId);
        notifyInfo(
          'Envío actualizado',
          `El paquete ${shipment.trackingNumber} ha cambiado a ${STATUS_LABEL[shipment.status]}.`,
        );
      } catch {
        notifyInfo(
          'Envío actualizado',
          'Un envío fue actualizado en tiempo real.',
        );
      }
    });
    return () => {
      void stopSignalRConnection(connection);
    };
  }, []);

  const handleQuickFilterChange = (next: QuickFilter) => {
    setStatusFilter(next);
    setPage(1);
  };

  const totalCount = paged?.totalCount ?? 0;
  const items = paged?.items ?? [];
  const filteredItems = useMemo(
    () => items.filter((shipment) => matchesQuickFilter(shipment.status, statusFilter)),
    [items, statusFilter],
  );
  const isFiltered = statusFilter !== 'ALL';
  const totalPages = useMemo(
    () => (totalCount === 0 ? 0 : Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );
  const hasPrev = page > 1;
  const hasNext = page * PAGE_SIZE < totalCount;
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, totalCount);

  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      notifyInfo('Sin datos', 'No hay envíos para exportar con el filtro actual.');
      return;
    }

    const rows = filteredItems.map((shipment) => ({
      Tracking: shipment.trackingNumber,
      Cliente: shipment.senderName ?? shipment.recipientName ?? 'Sin asignar',
      Destino: `${shipment.destination.city}, ${shipment.destination.state}`,
      Estado: STATUS_LABEL[shipment.status],
      Fecha: formatDate(shipment.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Envíos');
    XLSX.writeFile(workbook, 'reporte_envios.xlsx');
    notifySuccess('Exportación lista', 'Se descargó reporte_envios.xlsx');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-on-surface">
              Envíos
            </h1>
            <span className="inline-flex items-center gap-1 border-2 border-on-surface bg-green-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-brutal-sm">
              <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
              En vivo
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-on-surface-muted">
            Panel de control: métricas en tiempo real, distribución y listado
            paginado.
          </p>
        </div>
        <Link to="/shipments/new" className="brutalist-button-primary">
          Nuevo envío
        </Link>
      </header>

      {metricsLoading ? (
        <MetricsSkeleton />
      ) : metrics ? (
        <DashboardCards metrics={metrics} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {metricsLoading ? (
            <div className="flex h-64 items-center justify-center bento-cell text-sm font-bold uppercase tracking-wide text-on-surface-muted">
              Cargando métricas...
            </div>
          ) : metrics ? (
            <DashboardCharts metrics={metrics} />
          ) : (
            <div className="flex h-64 items-center justify-center bento-cell text-sm font-bold uppercase tracking-wide text-on-surface-muted">
              Métricas no disponibles.
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <RoleGuard allowedRoles={['Admin', 'Worker']}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <QuickFilterPills
                value={statusFilter}
                onChange={handleQuickFilterChange}
                disabled={listLoading}
              />
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={listLoading}
                className="brutalist-button-secondary shrink-0"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Exportar a Excel
              </button>
            </div>
          </RoleGuard>

          <div className="bento-cell overflow-hidden p-0">
            {listLoading ? (
              <LoadingState />
            ) : listFailed ? (
              <LoadFailedState onRetry={fetchList} />
            ) : filteredItems.length === 0 ? (
              <EmptyState filtered={isFiltered} />
            ) : (
              <ShipmentsTable shipments={filteredItems} />
            )}
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            hasPrev={hasPrev}
            hasNext={hasNext}
            disabled={listLoading}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function QuickFilterPills({
  value,
  onChange,
  disabled,
}: {
  value: QuickFilter;
  onChange: (next: QuickFilter) => void;
  disabled: boolean;
}) {
  const pills: { label: ReactNode; filter: QuickFilter }[] = [
    { label: 'Todos', filter: 'ALL' },
    {
      label: (
        <span className="inline-flex items-center gap-1.5">
          Requieren validación
          <span
            className="inline-block h-2 w-2 border border-on-surface bg-amber-400"
            aria-hidden="true"
          />
        </span>
      ),
      filter: 4,
    },
    { label: 'En curso', filter: QUICK_FILTER_IN_COURSE },
  ];

  return (
    <div
      className="flex flex-wrap gap-2 border-2 border-on-surface bg-surface-container-low p-3 shadow-brutal-sm"
      role="group"
      aria-label="Filtros rápidos de envíos"
    >
      {pills.map((pill) => {
        const isActive = value === pill.filter;
        return (
          <button
            key={pill.filter === 'ALL' ? 'all' : String(pill.filter)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(pill.filter)}
            className={`px-3 py-2 text-xs ${
              isActive ? 'brutalist-button-primary' : 'brutalist-button-secondary'
            }`}
            aria-pressed={isActive}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  totalCount,
  rangeFrom,
  rangeTo,
  hasPrev,
  hasNext,
  disabled,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  rangeFrom: number;
  rangeTo: number;
  hasPrev: boolean;
  hasNext: boolean;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-2 border-on-surface bg-surface p-4 shadow-brutal-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-muted sm:text-sm">
        {totalCount === 0 ? (
          'Sin resultados'
        ) : (
          <>
            Mostrando{' '}
            <span className="font-extrabold tabular-nums text-on-surface">{rangeFrom}</span>–
            <span className="font-extrabold tabular-nums text-on-surface">{rangeTo}</span> de{' '}
            <span className="font-extrabold tabular-nums text-on-surface">{totalCount}</span>
            {totalPages > 1 && (
              <span className="ml-1 text-on-surface-muted">
                (página {page} de {totalPages})
              </span>
            )}
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={disabled || !hasPrev}
          className="brutalist-button-secondary px-3 py-1.5 text-xs"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled || !hasNext}
          className="brutalist-button-secondary px-3 py-1.5 text-xs"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="h-24 animate-pulse border-2 border-on-surface bg-surface-container-low shadow-brutal-sm"
        />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16" aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-on-surface-muted">
        <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
        <p className="text-sm font-bold uppercase tracking-wide">Cargando envíos...</p>
      </div>
    </div>
  );
}

function LoadFailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-on-surface-muted">
        No se pudo cargar la lista. Revisa la notificación o intenta de nuevo.
      </p>
      <button type="button" onClick={onRetry} className="brutalist-button-primary mt-4">
        Reintentar
      </button>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="border-2 border-on-surface bg-primary p-3 text-on-primary shadow-brutal">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7h13l4 5v5h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3V7z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-extrabold uppercase tracking-tight text-on-surface">
        {filtered ? 'No hay envíos en este estado' : 'Aún no hay envíos'}
      </h2>
      <p className="mt-1 max-w-sm text-sm font-medium text-on-surface-muted">
        {filtered
          ? 'Prueba con otro filtro rápido o selecciona "Todos".'
          : 'Crea tu primer envío para empezar a llevar el control de la operación logística.'}
      </p>
      {!filtered && (
        <Link to="/shipments/new" className="brutalist-button-primary mt-5">
          Crear primer envío
        </Link>
      )}
    </div>
  );
}

function ShipmentsTable({ shipments }: { shipments: ShipmentDto[] }) {
  const hiddenColClass = 'hidden md:table-cell';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-2 border-on-surface">
        <thead className="bg-surface-container-low">
          <tr>
            <Th>Tracking</Th>
            <Th>Origen</Th>
            <Th>Destino</Th>
            <Th className={hiddenColClass}>Remitente</Th>
            <Th className={hiddenColClass}>Asignación</Th>
            <Th>Fecha</Th>
            <Th>Estado</Th>
          </tr>
        </thead>
        <tbody className="bg-surface">
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="transition hover:bg-surface-container-low">
              <Td>
                <Link
                  to={`/shipments/${shipment.id}`}
                  className="font-mono text-sm font-bold text-primary underline decoration-2 underline-offset-2 hover:text-on-surface"
                >
                  {shipment.trackingNumber}
                </Link>
              </Td>
              <Td>
                <span className="text-sm font-semibold text-on-surface">
                  {shipment.origin.city}
                </span>
                <span className="block text-xs font-medium text-on-surface-muted">
                  {shipment.origin.state}
                </span>
              </Td>
              <Td>
                <span className="text-sm font-semibold text-on-surface">
                  {shipment.destination.city}
                </span>
                <span className="block text-xs font-medium text-on-surface-muted">
                  {shipment.destination.state}
                </span>
              </Td>
              <Td className={`${hiddenColClass} whitespace-normal`}>
                {shipment.senderName ? (
                  <span className="text-sm font-semibold text-on-surface">
                    {shipment.senderName}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-on-surface-muted">Sin asignar</span>
                )}
              </Td>
              <Td className={`${hiddenColClass} whitespace-normal`}>
                <AssignmentCell
                  courierName={shipment.courierName}
                  branchName={shipment.branchName}
                />
              </Td>
              <Td>
                <span className="text-sm font-semibold text-on-surface">
                  {formatDate(shipment.createdAt)}
                </span>
              </Td>
              <Td>
                <StatusBadge status={shipment.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignmentCell({
  courierName,
  branchName,
}: {
  courierName?: string | null;
  branchName?: string | null;
}) {
  if (!courierName && !branchName) {
    return <span className="text-sm font-medium text-on-surface-muted">Sin asignar</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {courierName && (
        <span className="inline-flex flex-wrap items-center gap-1.5 text-sm font-semibold text-on-surface">
          <span className="border-2 border-on-surface bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-primary">
            Repartidor
          </span>
          {courierName}
        </span>
      )}
      {branchName && (
        <span className="inline-flex flex-wrap items-center gap-1.5 text-sm font-semibold text-on-surface">
          <span className="border-2 border-on-surface bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface">
            Sucursal
          </span>
          {branchName}
        </span>
      )}
    </div>
  );
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`border-b-2 border-on-surface px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-on-surface-muted ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-b-2 border-on-surface whitespace-nowrap px-4 py-3 align-top ${className}`}>
      {children}
    </td>
  );
}

export default Home;
