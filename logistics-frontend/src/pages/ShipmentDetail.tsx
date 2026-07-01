import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ClipboardCheck, Printer } from 'lucide-react';
import { sileo } from 'sileo';
import { ShipmentService } from '../services/api';
import { BranchService, CourierService } from '../services/masters';
import { useAuth } from '../context/AuthContext';
import { notifyError, notifySuccess } from '../lib/notify';
import StatusBadge, {
  STATUS_LABEL,
  STATUS_OPTIONS,
} from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import DeliveryPinDialog from '../components/DeliveryPinDialog';
import type {
  AddressDto,
  DeliveryType,
  PackageType,
  ShipmentDto,
  ShipmentStatus,
} from '../types';
import { formatBranchOptionLabel } from '../lib/branchUtils';
import type { BranchDto, CourierDto } from '../types/masters';

const PACKAGE_TYPE_LABEL: Record<PackageType, string> = {
  Envelope: 'Sobre',
  Bag: 'Bolsa',
  Box: 'Caja',
};

function formatOriginRoute(pickupRequired?: boolean): string {
  if (pickupRequired === undefined) return '—';
  return pickupRequired ? 'Recojo a domicilio' : 'Dejado en sucursal';
}

function formatDestinationRoute(deliveryType?: DeliveryType): string {
  if (!deliveryType) return '—';
  return deliveryType === 'HomeDelivery' ? 'A domicilio' : 'Retiro en sucursal';
}

interface ShipmentDetailLocationState {
  deliveryPin?: string;
}

const STATUS_FLOW: ShipmentStatus[] = ['Pending', 'InTransit', 'Delivered'];

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'long',
  timeStyle: 'short',
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter.format(date);
}

function AddressCard({
  title,
  address,
}: {
  title: string;
  address: AddressDto;
}) {
  return (
    <div className="bento-cell">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-muted">
        {title}
      </h3>
      <p className="text-base font-bold text-on-surface">{address.street}</p>
      <p className="text-sm font-medium text-on-surface-muted">
        {address.city}, {address.state}
      </p>
      <p className="text-sm font-medium text-on-surface-muted">CP {address.zipCode}</p>
    </div>
  );
}

function ParticipantItem({
  label,
  name,
}: {
  label: string;
  name?: string | null;
}) {
  return (
    <div className="border-2 border-on-surface bg-surface-container-low p-4 shadow-brutal-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-on-surface">
        {name ?? '— Sin asignar —'}
      </p>
    </div>
  );
}

const selectClass = 'brutalist-input';
const actionButtonClass = 'brutalist-button-primary';

function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const navigationState = location.state as ShipmentDetailLocationState | null;
  const receiptPin = navigationState?.deliveryPin;

  const [shipment, setShipment] = useState<ShipmentDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  const [deliverDialogOpen, setDeliverDialogOpen] = useState<boolean>(false);

  const [couriers, setCouriers] = useState<CourierDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);

  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [assigningCourier, setAssigningCourier] = useState(false);
  const [assigningBranch, setAssigningBranch] = useState(false);
  const [validating, setValidating] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const { role } = useAuth();
  const isStaff = role === 'Admin' || role === 'Worker';

  const fetchShipment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ShipmentService.getById(id);
      setShipment(data);
    } catch (err) {
      setShipment(null);
      const message = 'No se pudo cargar la información del envío.';
      setError(message);
      notifyError(err, message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  useEffect(() => {
    let cancelled = false;

    async function loadMasters() {
      setMastersLoading(true);
      try {
        const [courierData, branchData] = await Promise.all([
          CourierService.getForAssignment(),
          BranchService.getActiveLookup(),
        ]);
        if (!cancelled) {
          setCouriers(courierData);
          setBranches(branchData);
        }
      } catch (err) {
        if (!cancelled) {
          setCouriers([]);
          setBranches([]);
          notifyError(err, 'No se pudieron cargar repartidores o sucursales.');
        }
      } finally {
        if (!cancelled) {
          setMastersLoading(false);
        }
      }
    }

    void loadMasters();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!shipment) return;
    setSelectedCourierId(shipment.assignedCourierId ?? '');
    setSelectedBranchId(shipment.currentBranchId ?? '');
  }, [shipment]);

  const handleAssignCourier = async () => {
    if (!id || !selectedCourierId) return;
    setAssigningCourier(true);
    try {
      await ShipmentService.assignCourier(id, selectedCourierId);
      await fetchShipment();
    } catch {
    } finally {
      setAssigningCourier(false);
    }
  };

  const handleAssignBranch = async () => {
    if (!id || !selectedBranchId) return;
    setAssigningBranch(true);
    try {
      await ShipmentService.assignBranch(id, selectedBranchId);
      await fetchShipment();
    } catch {
    } finally {
      setAssigningBranch(false);
    }
  };

  const handleApproveValidation = async () => {
    if (!id || !selectedCourierId || !selectedBranchId) return;

    setValidating(true);
    try {
      await ShipmentService.assignBranch(id, selectedBranchId, true);
      await ShipmentService.assignCourier(id, selectedCourierId, true);
      await ShipmentService.updateStatus(id, 'Pending', undefined, true);
      notifySuccess('Envío validado y en ruta de recojo');
      await fetchShipment();
    } catch (err) {
      notifyError(err, 'No se pudo validar el envío.');
    } finally {
      setValidating(false);
    }
  };

  const handleRejectValidation = async () => {
    if (!id) return;

    setRejecting(true);
    try {
      await ShipmentService.updateStatus(id, 'Cancelled', undefined, true);
      sileo.error({ title: 'Envío rechazado' });
      await fetchShipment();
    } catch (err) {
      notifyError(err, 'No se pudo rechazar el envío.');
    } finally {
      setRejecting(false);
    }
  };

  const performStatusUpdate = useCallback(
    async (
      newStatus: ShipmentStatus,
      pin?: string,
      paymentCollected?: boolean,
    ) => {
      if (!id) return false;
      setUpdating(true);
      try {
        await ShipmentService.updateStatus(
          id,
          newStatus,
          pin,
          false,
          paymentCollected,
        );
        await fetchShipment();
        return true;
      } catch {
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [fetchShipment, id],
  );

  const handleStatusChange = (newStatus: ShipmentStatus) => {
    if (!shipment || newStatus === shipment.status) return;

    if (newStatus === 'Delivered') {
      setDeliverDialogOpen(true);
      return;
    }

    void performStatusUpdate(newStatus);
  };

  const handleDeliverConfirm = async (pin: string) => {
    const paymentCollected =
      shipment?.paymentMethod === 'CashOnDelivery' ? true : undefined;
    const success = await performStatusUpdate('Delivered', pin, paymentCollected);
    if (success) {
      setDeliverDialogOpen(false);
    }
  };

  const handleDeliverCancel = () => {
    if (updating) return;
    setDeliverDialogOpen(false);
  };

  const trackingUrl = useMemo(() => {
    if (!shipment) return '';
    return `${window.location.origin}/track/${shipment.trackingNumber}`;
  }, [shipment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" aria-busy="true">
        <div className="flex flex-col items-center gap-3 text-on-surface-muted">
          <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
          <p className="text-sm font-bold uppercase tracking-wide">Cargando envío...</p>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="mx-auto max-w-2xl bento-cell border-red-600 bg-red-100">
        <h2 className="text-lg font-extrabold uppercase tracking-tight text-red-900">
          No se pudo cargar el envío
        </h2>
        <p className="mt-2 text-sm font-medium text-red-800">
          {error ?? 'El envío no está disponible.'}
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={fetchShipment} className="brutalist-button-primary">
            Reintentar
          </button>
          <Link to="/dashboard" className="brutalist-button-secondary">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(shipment.status);
  const isTerminal =
    shipment.status === 'Delivered' || shipment.status === 'Cancelled';
  const isCashOnDelivery = shipment.paymentMethod === 'CashOnDelivery';
  const showValidationPanel =
    isStaff && shipment.status === 'PendingValidation';
  const validationBusy = validating || rejecting;
  const canApproveValidation =
    Boolean(selectedCourierId) && Boolean(selectedBranchId) && !validationBusy;

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6 print:hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/dashboard"
            className="brutalist-button-secondary px-3 py-2 text-xs"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al panel
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="brutalist-button-secondary px-3 py-2 text-xs"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir etiquetas
          </button>
        </div>

        <header className="bento-cell sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                    Tracking number
                  </p>
                  <h1 className="mt-1 font-mono text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                    {shipment.trackingNumber}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-on-surface-muted">
                    Creado el {formatDate(shipment.createdAt)}
                  </p>
                </div>
              <StatusBadge status={shipment.status} />
            </div>

            {receiptPin && (
              <div className="mt-6 border-2 border-on-surface bg-surface-container-low p-4 shadow-brutal-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface">
                  Recibo generado
                </p>
                <p className="mt-1 text-sm font-medium text-on-surface-muted">
                  El PIN de entrega se ha incluido en el recibo del cliente.
                  Imprime las etiquetas para entregarle su copia.
                </p>
              </div>
            )}
          </div>

            <div className="flex flex-col items-center gap-2">
              <div className="border-2 border-on-surface bg-surface p-3 shadow-brutal-sm">
                <QRCodeSVG
                  value={trackingUrl}
                  size={140}
                  level="M"
                  aria-label={`Código QR del envío ${shipment.trackingNumber}`}
                />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-muted">
                Escanea para rastrear
              </p>
            </div>
          </div>
        </header>

        <section className="bento-cell sm:p-8">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-muted">
            Progreso del envío
          </h2>
          <div className="mt-6">
            <StatusTimeline status={shipment.status} />
          </div>
        </section>

        <section className="bento-cell sm:p-8">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-muted">
            Ruta del envío
          </h2>
          <p className="mt-3 text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Origen: {formatOriginRoute(shipment.pickupRequired)} → Destino:{' '}
            {formatDestinationRoute(shipment.deliveryType)}
          </p>
          {shipment.destinationBranchName && (
            <p className="mt-2 text-sm font-bold text-on-surface-muted">
              Sucursal de retiro: {shipment.destinationBranchName}
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AddressCard title="Origen" address={shipment.origin} />
          <AddressCard title="Destino" address={shipment.destination} />
        </section>

        <section className="bento-cell sm:p-8">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Características del paquete
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                Tipo
              </dt>
              <dd className="mt-1 text-base font-extrabold text-on-surface">
                {shipment.type
                  ? PACKAGE_TYPE_LABEL[shipment.type]
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                Tamaño
              </dt>
              <dd className="mt-1 text-base font-extrabold text-on-surface">
                {shipment.size ?? '—'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                Contenido
              </dt>
              <dd className="mt-1 text-base font-bold text-on-surface">
                {shipment.contentDescription?.trim() || '—'}
              </dd>
            </div>
          </dl>
          {shipment.isFragile && (
            <div className="mt-4">
              <span className="inline-flex border-2 border-on-surface bg-red-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-brutal-sm">
                Frágil
              </span>
            </div>
          )}
        </section>

        <section className="bento-cell sm:p-8">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Participantes y operación
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ParticipantItem label="Remitente" name={shipment.senderName} />
            <ParticipantItem label="Destinatario" name={shipment.recipientName} />
            <ParticipantItem
              label="Repartidor asignado"
              name={shipment.courierName}
            />
            <ParticipantItem
              label="Sucursal actual"
              name={shipment.branchName}
            />
          </div>
        </section>

        {isStaff && !showValidationPanel && (
        <section className="bento-cell sm:p-8">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Asignación operativa
          </h2>
          <p className="mt-1 text-sm font-medium text-on-surface-muted">
            Asigna repartidor y sucursal al envío. Requiere permisos de
            operador.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3 border-2 border-on-surface bg-surface-container-low p-4 shadow-brutal-sm">
              <label
                htmlFor="assign-courier"
                className="brutalist-label"
              >
                Repartidor
              </label>
              <select
                id="assign-courier"
                value={selectedCourierId}
                onChange={(e) => setSelectedCourierId(e.target.value)}
                disabled={
                  mastersLoading || assigningCourier || assigningBranch || isTerminal
                }
                className={selectClass}
              >
                <option value="">— Seleccionar repartidor —</option>
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.fullName}
                    {courier.isAvailable ? '' : ' (no disponible)'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleAssignCourier()}
                disabled={
                  !selectedCourierId ||
                  mastersLoading ||
                  assigningCourier ||
                  assigningBranch ||
                  isTerminal
                }
                className={actionButtonClass}
              >
                {assigningCourier ? 'Asignando...' : 'Asignar Repartidor'}
              </button>
            </div>

            <div className="space-y-3 border-2 border-on-surface bg-surface-container-low p-4 shadow-brutal-sm">
              <label
                htmlFor="assign-branch"
                className="brutalist-label"
              >
                Sucursal
              </label>
              <select
                id="assign-branch"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={
                  mastersLoading || assigningCourier || assigningBranch || isTerminal
                }
                className={selectClass}
              >
                <option value="">— Seleccionar sucursal —</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {formatBranchOptionLabel(branch)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleAssignBranch()}
                disabled={
                  !selectedBranchId ||
                  mastersLoading ||
                  assigningCourier ||
                  assigningBranch ||
                  isTerminal
                }
                className={actionButtonClass}
              >
                {assigningBranch ? 'Asignando...' : 'Asignar Sucursal'}
              </button>
            </div>
          </div>

          {isTerminal && (
            <p className="mt-4 text-sm font-medium text-on-surface-muted">
              No se pueden modificar asignaciones en envíos entregados o
              cancelados.
            </p>
          )}

        </section>
        )}

        {showValidationPanel && (
          <section className="bento-cell border-amber-500 bg-amber-400 shadow-brutal sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-on-surface bg-surface text-on-surface shadow-brutal-sm">
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
                  Validación de recojo
                </h2>
                <p className="mt-1 text-sm font-bold text-on-surface">
                  Este envío fue solicitado por un cliente desde su domicilio.
                  Asigna sucursal de destino y repartidor de recojo antes de
                  aprobarlo.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="validation-branch"
                  className="brutalist-label"
                >
                  Sucursal de destino <span className="text-red-700">*</span>
                </label>
                <select
                  id="validation-branch"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  disabled={mastersLoading || validationBusy}
                  className={selectClass}
                >
                  <option value="">— Seleccionar sucursal —</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {formatBranchOptionLabel(branch)}
                    </option>
                  ))}
                </select>
                <p className="text-xs font-bold uppercase tracking-wide text-on-surface">
                  Sucursal donde llegará el paquete tras el recojo.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="validation-courier"
                  className="brutalist-label"
                >
                  Repartidor de recojo <span className="text-red-700">*</span>
                </label>
                <select
                  id="validation-courier"
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  disabled={mastersLoading || validationBusy}
                  className={selectClass}
                >
                  <option value="">— Seleccionar repartidor —</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.fullName}
                      {courier.isAvailable ? '' : ' (no disponible)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs font-bold uppercase tracking-wide text-on-surface">
                  Repartidor que irá a recoger el paquete al domicilio.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t-2 border-on-surface pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => void handleRejectValidation()}
                disabled={validationBusy}
                className="brutalist-button-secondary border-red-700 bg-red-100 text-red-900"
              >
                {rejecting ? 'Rechazando...' : 'Rechazar envío'}
              </button>
              <button
                type="button"
                onClick={() => void handleApproveValidation()}
                disabled={!canApproveValidation || mastersLoading}
                className="brutalist-button-primary border-green-800 bg-green-600"
              >
                {validating ? 'Validando...' : 'Aprobar y validar envío'}
              </button>
            </div>
          </section>
        )}

        <section className="bento-cell sm:p-8">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">Detalles</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                Peso
              </dt>
              <dd className="mt-1 text-lg font-extrabold text-on-surface">
                {shipment.weightInKg} kg
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                Método de pago
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex border-2 border-on-surface px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    isCashOnDelivery
                      ? 'bg-amber-400 text-on-surface'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {isCashOnDelivery ? 'Contra entrega' : 'Pagado'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                ID
              </dt>
              <dd className="mt-1 break-all font-mono text-xs font-semibold text-on-surface-muted">
                {shipment.id}
              </dd>
            </div>
          </dl>
        </section>

        {isStaff && !showValidationPanel && (
        <section className="bento-cell sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
                Actualizar estado
              </h2>
              <p className="mt-1 text-sm font-medium text-on-surface-muted">
                Los estados solo avanzan: una vez en tránsito no se puede volver
                a pendiente.
              </p>
            </div>
            {updating && (
              <span className="text-xs font-bold uppercase tracking-wide text-primary">
                Actualizando...
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter((option) => option !== 'PendingValidation').map((option) => {
              const isCurrent = option === shipment.status;
              const optionIndex = STATUS_FLOW.indexOf(option);

              let disabled = updating || isCurrent || isTerminal;

              if (option === 'Cancelled') {
                disabled = updating || isTerminal;
              } else {
                if (optionIndex !== -1 && optionIndex <= currentIndex) {
                  disabled = true;
                }
              }

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleStatusChange(option)}
                  disabled={disabled}
                  className={`px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                    isCurrent
                      ? 'brutalist-button-primary'
                      : 'brutalist-button-secondary'
                  }`}
                >
                  {STATUS_LABEL[option]}
                </button>
              );
            })}
          </div>
        </section>
        )}

        <DeliveryPinDialog
          open={deliverDialogOpen}
          submitting={updating}
          errorMessage={null}
          paymentMethod={shipment.paymentMethod}
          onConfirm={handleDeliverConfirm}
          onCancel={handleDeliverCancel}
        />
      </div>

      
      <PrintLabels
        shipment={shipment}
        trackingUrl={trackingUrl}
        deliveryPin={receiptPin}
      />
    </>
  );
}

function PrintLabels({
  shipment,
  trackingUrl,
  deliveryPin,
}: {
  shipment: ShipmentDto;
  trackingUrl: string;
  deliveryPin?: string;
}) {
  return (
    <div className="hidden text-slate-900 print:block">
      <section className="p-6 print:break-after-page">
        <div className="border-2 border-slate-900 p-6">
          <header className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest">
                Logistics System
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-600">
                Etiqueta de paquete
              </p>
            </div>
            <p className="font-mono text-lg font-bold">
              {shipment.trackingNumber}
            </p>
          </header>

          <div className="mt-4 flex items-start gap-6">
            <div className="flex-shrink-0">
              <QRCodeSVG
                value={trackingUrl}
                size={140}
                level="M"
                aria-label="QR de tracking"
              />
            </div>
            <div className="flex-1 space-y-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  De
                </p>
                <p className="font-semibold">{shipment.origin.street}</p>
                <p>
                  {shipment.origin.city}, {shipment.origin.state}
                </p>
                <p>CP {shipment.origin.zipCode}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Para
                </p>
                <p className="font-semibold">{shipment.destination.street}</p>
                <p>
                  {shipment.destination.city}, {shipment.destination.state}
                </p>
                <p>CP {shipment.destination.zipCode}</p>
              </div>
            </div>
          </div>

          <footer className="mt-4 flex items-end justify-between border-t-2 border-slate-900 pt-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-600">
                Peso
              </p>
              <p className="font-semibold">{shipment.weightInKg} kg</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-600">
                Pago
              </p>
              <p className="font-semibold">
                {shipment.paymentMethod === 'CashOnDelivery'
                  ? 'Contra entrega'
                  : 'Pagado'}
              </p>
            </div>
          </footer>
        </div>
      </section>
      <section className="p-6">
        <div className="border-2 border-dashed border-slate-900 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest">
            Logistics System
          </p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">
            Recibo del cliente
          </p>

          <h2 className="mt-4 text-lg font-bold">Rastree su paquete</h2>
          <p className="mt-1 text-sm">
            Escanee este código con la cámara de su celular para ver el estado
            actualizado de su envío.
          </p>

          <div className="my-5 flex justify-center">
            <QRCodeSVG
              value={trackingUrl}
              size={180}
              level="M"
              aria-label="QR de rastreo público"
            />
          </div>

          <p className="text-[10px] uppercase tracking-widest text-slate-600">
            Número de tracking
          </p>
          <p className="font-mono text-xl font-bold tracking-wider">
            {shipment.trackingNumber}
          </p>

          {deliveryPin && (
            <div className="mt-5 border-t-2 border-dashed border-slate-900 pt-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-600">
                PIN de entrega
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-[0.5em]">
                {deliveryPin}
              </p>
              <p className="mt-2 text-[10px] text-slate-600">
                Conserve este PIN en privado: el repartidor lo solicitará al
                momento de entregar el paquete.
              </p>
            </div>
          )}

          {!deliveryPin && (
            <p className="mt-4 text-[10px] text-slate-600">
              Guarde este recibo y su PIN de entrega: el repartidor lo solicitará
              al momento de la entrega.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ShipmentDetail;
