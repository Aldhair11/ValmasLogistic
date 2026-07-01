import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Search, UserPlus } from 'lucide-react';
import { sileo } from 'sileo';
import CustomerRegistrationModal from '../components/CustomerRegistrationModal';
import CatalogStatusConfirmModal from '../components/masters/CatalogStatusConfirmModal';
import { ShipmentService } from '../services/api';
import { BranchService, CustomerService } from '../services/masters';
import { useAuth } from '../context/AuthContext';
import { notifyError } from '../lib/notify';
import { formatBranchOptionLabel } from '../lib/branchUtils';
import type {
  AddressDto,
  CreateShipmentCommand,
  DeliveryType,
  PackageSize,
  PackageType,
} from '../types';
import type { BranchDto, CustomerDto } from '../types/masters';

const looseAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
});

const addressSchema = z.object({
  street: z.string().min(1, 'La calle es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  state: z.string().min(1, 'El estado/provincia es obligatorio'),
  zipCode: z.string().min(1, 'El código postal es obligatorio'),
});

const pinSchema = z
  .string()
  .length(4, 'Debe tener 4 dígitos')
  .regex(/^\d+$/, 'Solo números');

const shipmentSchemaBase = z.object({
  pickupRequired: z.boolean(),
  deliveryType: z.enum(['HomeDelivery', 'BranchPickup']),
  origin: looseAddressSchema,
  destination: looseAddressSchema,
  weightInKg: z.coerce
    .number({ message: 'Debe ser un número válido' })
    .positive('El peso debe ser mayor a 0'),
  paymentMethod: z.enum(['PrePaid', 'CashOnDelivery']),
  shippingAmount: z.coerce
    .number({ message: 'Debe ser un número válido' })
    .positive('El monto debe ser mayor a 0'),
  type: z.enum(['Envelope', 'Bag', 'Box']),
  size: z.enum(['S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
  isFragile: z.boolean(),
  contentDescription: z.string().min(1, 'Describe el contenido del paquete'),
  senderId: z.string().optional(),
  recipientId: z.string().optional(),
  currentBranchId: z.string().optional(),
  destinationBranchId: z.string().optional(),
  pin: pinSchema,
  confirmPin: z.string(),
});

function buildShipmentSchema(isStaff: boolean) {
  return shipmentSchemaBase.superRefine((values, ctx) => {
    if (!isStaff && values.pickupRequired) {
      const originResult = addressSchema.safeParse(values.origin);
      if (!originResult.success) {
        originResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ['origin', ...(issue.path ?? [])],
          });
        });
      }
    }

    if (isStaff && !values.currentBranchId?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecciona la sucursal de origen (admisión)',
        path: ['currentBranchId'],
      });
    }

    if (values.deliveryType === 'HomeDelivery') {
      const destinationResult = addressSchema.safeParse(values.destination);
      if (!destinationResult.success) {
        destinationResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ['destination', ...(issue.path ?? [])],
          });
        });
      }
    }

    if (
      values.deliveryType === 'BranchPickup' &&
      !values.destinationBranchId?.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecciona la sucursal de retiro',
        path: ['destinationBranchId'],
      });
    }

    if (values.pin !== values.confirmPin) {
      ctx.addIssue({
        code: 'custom',
        message: 'Los PIN no coinciden',
        path: ['confirmPin'],
      });
    }
  });
}

type ShipmentFormInput = z.input<typeof shipmentSchemaBase>;
type ShipmentFormOutput = z.output<ReturnType<typeof buildShipmentSchema>>;

interface SuccessViewState {
  trackingNumber: string;
  showQr: boolean;
}

const emptyAddress: AddressDto = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
};

const branchDropOrigin: AddressDto = {
  street: 'Entrega en sucursal',
  city: 'N/A',
  state: 'N/A',
  zipCode: '00000',
};

const defaultValues: ShipmentFormInput = {
  pickupRequired: true,
  deliveryType: 'HomeDelivery',
  origin: {
    street: 'Av. Eduardo de Habich',
    city: 'Lima',
    state: 'San Martín de Porres',
    zipCode: '15106',
  },
  destination: { ...emptyAddress },
  weightInKg: '',
  paymentMethod: 'PrePaid',
  shippingAmount: '',
  type: 'Box',
  size: 'M',
  isFragile: false,
  contentDescription: '',
  senderId: '',
  recipientId: '',
  currentBranchId: '',
  destinationBranchId: '',
  pin: '',
  confirmPin: '',
};

const errorClass = 'mt-1 text-xs font-bold text-red-700';

type FieldErrorLike = { message?: string | undefined } | undefined;

function ErrorMessage({ error }: { error?: FieldErrorLike }) {
  if (!error?.message) return null;
  return <p className={errorClass}>{error.message}</p>;
}

const radioInputClass =
  'h-5 w-5 shrink-0 appearance-none border-2 border-on-surface bg-surface checked:border-on-surface checked:bg-primary focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60';

const checkboxInputClass =
  'h-5 w-5 shrink-0 appearance-none border-2 border-on-surface bg-surface checked:border-on-surface checked:bg-primary focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60';

function BrutalistRadio({
  name,
  value,
  checked,
  onChange,
  disabled,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 border-2 border-on-surface px-4 py-3 shadow-brutal-sm transition ${
        checked
          ? 'bg-primary text-on-primary'
          : 'bg-surface text-on-surface hover:bg-surface-container-low'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={radioInputClass}
      />
      <span className="text-sm font-bold uppercase tracking-wide">{label}</span>
    </label>
  );
}

function branchToAddress(branch: BranchDto): AddressDto {
  return {
    street: branch.address,
    city: branch.district,
    state: branch.department,
    zipCode: '00000',
  };
}

function upsertCustomer(
  customers: CustomerDto[],
  customer: CustomerDto,
): CustomerDto[] {
  if (customers.some((item) => item.id === customer.id)) {
    return customers;
  }
  return [...customers, customer];
}

function ParticipantDniSearch({
  id,
  label,
  value,
  onChange,
  onSearch,
  searching,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  searching: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por DNI"
        disabled={disabled || searching}
        className="brutalist-input flex-1"
        aria-label={label}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSearch();
          }
        }}
      />
      <button
        type="button"
        onClick={onSearch}
        disabled={disabled || searching}
        className="brutalist-button-secondary shrink-0 px-3"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        {searching ? '...' : 'Buscar'}
      </button>
    </div>
  );
}

function CreateShipment() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const isClient = role === 'Client';
  const isStaff = role === 'Admin' || role === 'Worker';
  const isWorker = role === 'Worker';
  const assignedBranchId = user?.branchId ?? null;
  const shipmentSchema = useMemo(
    () => buildShipmentSchema(isStaff),
    [isStaff],
  );

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [senderDniSearch, setSenderDniSearch] = useState('');
  const [recipientDniSearch, setRecipientDniSearch] = useState('');
  const [senderDniSearching, setSenderDniSearching] = useState(false);
  const [recipientDniSearching, setRecipientDniSearching] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [successView, setSuccessView] = useState<SuccessViewState | null>(null);
  const [branchChangeModalOpen, setBranchChangeModalOpen] = useState(false);
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentFormInput, unknown, ShipmentFormOutput>({
    resolver: zodResolver(shipmentSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const pickupRequired = useWatch({ control, name: 'pickupRequired' });
  const deliveryType = useWatch({ control, name: 'deliveryType' });
  const isFragile = useWatch({ control, name: 'isFragile' });
  const currentBranchId = useWatch({ control, name: 'currentBranchId' });

  useEffect(() => {
    if (isWorker && assignedBranchId) {
      setValue('currentBranchId', assignedBranchId, { shouldValidate: true });
    }
  }, [isWorker, assignedBranchId, setValue]);

  useEffect(() => {
    if (isStaff) {
      setValue('pickupRequired', false, { shouldValidate: false });
    }
  }, [isStaff, setValue]);

  useEffect(() => {
    let cancelled = false;

    async function loadMasters() {
      setMastersLoading(true);
      try {
        const [customerData, branchData] = await Promise.all([
          CustomerService.getActiveLookup(),
          BranchService.getActiveLookup(),
        ]);
        if (!cancelled) {
          setCustomers(customerData);
          setBranches(branchData);
        }
      } catch (err) {
        if (!cancelled) {
          setCustomers([]);
          setBranches([]);
          notifyError(err, 'No se pudieron cargar clientes o sucursales.');
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

  const handleOriginBranchChange = (nextBranchId: string) => {
    if (
      isWorker &&
      assignedBranchId &&
      nextBranchId &&
      nextBranchId !== assignedBranchId
    ) {
      setPendingBranchId(nextBranchId);
      setBranchChangeModalOpen(true);
      return;
    }

    setValue('currentBranchId', nextBranchId, { shouldValidate: true });
  };

  const confirmOriginBranchChange = () => {
    if (pendingBranchId) {
      setValue('currentBranchId', pendingBranchId, { shouldValidate: true });
    }
    setPendingBranchId(null);
    setBranchChangeModalOpen(false);
  };

  const searchCustomerByDni = async (
    dni: string,
    field: 'senderId' | 'recipientId',
    roleLabel: 'remitente' | 'destinatario',
    setSearching: (value: boolean) => void,
  ) => {
    const trimmed = dni.trim();
    if (!trimmed) {
      notifyError(null, 'Ingresa un DNI para buscar.', 'Búsqueda vacía');
      return;
    }

    setSearching(true);
    try {
      const customer = await CustomerService.getByDni(trimmed);
      setValue(field, customer.id, { shouldValidate: true });
      setCustomers((prev) => upsertCustomer(prev, customer));

      sileo.success({
        title: 'Cliente encontrado',
        description: `${customer.fullName} fue seleccionado como ${roleLabel}.`,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        notifyError(
          err,
          'Cliente no encontrado. Puedes registrarlo manualmente con el botón superior.',
        );
      } else {
        notifyError(err, 'No se pudo buscar el cliente por DNI.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSenderDniSearch = () => {
    void searchCustomerByDni(
      senderDniSearch,
      'senderId',
      'remitente',
      setSenderDniSearching,
    );
  };

  const handleRecipientDniSearch = () => {
    void searchCustomerByDni(
      recipientDniSearch,
      'recipientId',
      'destinatario',
      setRecipientDniSearching,
    );
  };

  const handleCustomerCreated = (customer: CustomerDto) => {
    setCustomers((prev) => upsertCustomer(prev, customer));
    setSenderDniSearch(customer.dni);
    setRecipientDniSearch(customer.dni);
  };

  const onSubmit: SubmitHandler<ShipmentFormOutput> = async (values) => {
    const effectivePickupRequired = isStaff ? false : values.pickupRequired;

    let origin: AddressDto = values.origin;
    let destination: AddressDto = values.destination;

    if (!effectivePickupRequired) {
      if (isStaff && values.currentBranchId) {
        const admissionBranch = branches.find(
          (b) => b.id === values.currentBranchId,
        );
        origin = admissionBranch
          ? branchToAddress(admissionBranch)
          : branchDropOrigin;
      } else {
        origin = branchDropOrigin;
      }
    }

    if (values.deliveryType === 'BranchPickup') {
      const branch = branches.find((b) => b.id === values.destinationBranchId);
      if (!branch) {
        notifyError(null, 'La sucursal de retiro seleccionada no es válida.');
        return;
      }
      destination = branchToAddress(branch);
    }

    const payload: CreateShipmentCommand = {
      origin,
      destination,
      weightInKg: values.weightInKg,
      pin: values.pin,
      paymentMethod: values.paymentMethod,
      shippingAmount: values.shippingAmount,
      type: values.type as PackageType,
      size: values.size as PackageSize,
      isFragile: values.isFragile,
      contentDescription: values.contentDescription.trim(),
      pickupRequired: effectivePickupRequired,
      deliveryType: values.deliveryType as DeliveryType,
      ...(values.senderId ? { senderId: values.senderId } : {}),
      ...(values.recipientId ? { recipientId: values.recipientId } : {}),
      ...(isStaff && values.currentBranchId
        ? { currentBranchId: values.currentBranchId }
        : {}),
      ...(values.deliveryType === 'BranchPickup' && values.destinationBranchId
        ? { destinationBranchId: values.destinationBranchId }
        : {}),
    };

    try {
      const receipt = await ShipmentService.create(payload);

      if (isClient && !effectivePickupRequired) {
        sileo.success({
          title: 'Envío registrado',
          description: `Tracking: ${receipt.trackingNumber}`,
        });
        setSuccessView({ trackingNumber: receipt.trackingNumber, showQr: true });
        return;
      }

      if (isStaff) {
        sileo.success({
          title: 'Envío admitido correctamente',
          description: `Tracking: ${receipt.trackingNumber}`,
        });
        setSuccessView({ trackingNumber: receipt.trackingNumber, showQr: false });
        return;
      }

      sileo.success({
        title: 'Recojo programado',
        description: `Tracking: ${receipt.trackingNumber}`,
      });

      navigate(`/shipments/${receipt.id}`, {
        state: { deliveryPin: receipt.deliveryPin },
      });
    } catch {
    }
  };

  if (successView) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="bento-cell-highlight space-y-6 text-center sm:p-10">
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-on-surface">
            {successView.showQr ? '¡Envío registrado!' : 'Envío admitido correctamente'}
          </h1>
          <p className="text-sm font-bold text-on-surface-muted">
            {successView.showQr
              ? 'Muestra este código al trabajador de la sucursal para admitir tu paquete.'
              : 'El paquete fue registrado en mostrador y ya está en el sistema.'}
          </p>
          {successView.showQr && (
            <div className="mx-auto inline-block border-2 border-on-surface bg-surface p-4 shadow-brutal">
              <QRCodeSVG
                value={successView.trackingNumber}
                size={200}
                level="M"
                aria-label={`Código QR del envío ${successView.trackingNumber}`}
              />
            </div>
          )}
          <p className="font-mono text-xl font-extrabold tracking-wider text-on-surface">
            {successView.trackingNumber}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="brutalist-button-primary w-full sm:w-auto"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-on-surface">
          {isClient ? 'Programar Recojo' : 'Nuevo Envío'}
        </h1>
        <p className="mt-1 text-sm font-medium text-on-surface-muted">
          {isClient
            ? 'Configura origen, destino y las características físicas del paquete.'
            : 'Registra un envío con origen dinámico, destino y detalles del paquete.'}
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <section className="bento-cell space-y-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Origen
          </h2>

          {isStaff ? (
            <div>
              <label className="brutalist-label" htmlFor="originAdmissionBranchId">
                Sucursal de Origen (Admisión){' '}
                <span className="text-red-700">*</span>
              </label>
              <select
                id="originAdmissionBranchId"
                className="brutalist-input"
                disabled={isSubmitting || mastersLoading}
                value={currentBranchId ?? ''}
                onChange={(event) => handleOriginBranchChange(event.target.value)}
              >
                <option value="">— Seleccionar sucursal —</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {formatBranchOptionLabel(branch)}
                  </option>
                ))}
              </select>
              <ErrorMessage error={errors.currentBranchId} />
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-on-surface-muted">
                {isWorker && user?.branchName
                  ? `Por defecto se usa tu sucursal asignada (${user.branchName}). Puedes cambiarla con confirmación.`
                  : 'Indica en qué sucursal estás admitiendo el paquete en mostrador.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <BrutalistRadio
                  name="pickupRequired"
                  value="true"
                  checked={pickupRequired === true}
                  onChange={() =>
                    setValue('pickupRequired', true, { shouldValidate: true })
                  }
                  disabled={isSubmitting}
                  label="Recojo a domicilio"
                />
                <BrutalistRadio
                  name="pickupRequired"
                  value="false"
                  checked={pickupRequired === false}
                  onChange={() =>
                    setValue('pickupRequired', false, { shouldValidate: true })
                  }
                  disabled={isSubmitting}
                  label="Dejar en sucursal"
                />
              </div>

              {pickupRequired ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="brutalist-label" htmlFor="origin.street">
                      Calle
                    </label>
                    <input
                      id="origin.street"
                      className="brutalist-input"
                      disabled={isSubmitting}
                      {...register('origin.street')}
                    />
                    <ErrorMessage error={errors.origin?.street} />
                  </div>
                  <div>
                    <label className="brutalist-label" htmlFor="origin.city">
                      Ciudad
                    </label>
                    <input
                      id="origin.city"
                      className="brutalist-input"
                      disabled={isSubmitting}
                      {...register('origin.city')}
                    />
                    <ErrorMessage error={errors.origin?.city} />
                  </div>
                  <div>
                    <label className="brutalist-label" htmlFor="origin.state">
                      Estado / Provincia
                    </label>
                    <input
                      id="origin.state"
                      className="brutalist-input"
                      disabled={isSubmitting}
                      {...register('origin.state')}
                    />
                    <ErrorMessage error={errors.origin?.state} />
                  </div>
                  <div>
                    <label className="brutalist-label" htmlFor="origin.zipCode">
                      Código Postal
                    </label>
                    <input
                      id="origin.zipCode"
                      className="brutalist-input"
                      disabled={isSubmitting}
                      {...register('origin.zipCode')}
                    />
                    <ErrorMessage error={errors.origin?.zipCode} />
                  </div>
                </div>
              ) : (
                <p className="border-2 border-on-surface bg-amber-400 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-on-surface shadow-brutal-sm">
                  Debes acercarte a la sucursal más cercana con el código QR que
                  se generará al finalizar.
                </p>
              )}
            </>
          )}
        </section>
        <section className="bento-cell space-y-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Destino
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BrutalistRadio
              name="deliveryType"
              value="HomeDelivery"
              checked={deliveryType === 'HomeDelivery'}
              onChange={() =>
                setValue('deliveryType', 'HomeDelivery', { shouldValidate: true })
              }
              disabled={isSubmitting}
              label="Entrega a domicilio"
            />
            <BrutalistRadio
              name="deliveryType"
              value="BranchPickup"
              checked={deliveryType === 'BranchPickup'}
              onChange={() =>
                setValue('deliveryType', 'BranchPickup', { shouldValidate: true })
              }
              disabled={isSubmitting}
              label="Retiro en sucursal"
            />
          </div>

          {deliveryType === 'HomeDelivery' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="brutalist-label" htmlFor="destination.street">
                  Calle
                </label>
                <input
                  id="destination.street"
                  className="brutalist-input"
                  disabled={isSubmitting}
                  {...register('destination.street')}
                />
                <ErrorMessage error={errors.destination?.street} />
              </div>
              <div>
                <label className="brutalist-label" htmlFor="destination.city">
                  Ciudad
                </label>
                <input
                  id="destination.city"
                  className="brutalist-input"
                  disabled={isSubmitting}
                  {...register('destination.city')}
                />
                <ErrorMessage error={errors.destination?.city} />
              </div>
              <div>
                <label className="brutalist-label" htmlFor="destination.state">
                  Estado / Provincia
                </label>
                <input
                  id="destination.state"
                  className="brutalist-input"
                  disabled={isSubmitting}
                  {...register('destination.state')}
                />
                <ErrorMessage error={errors.destination?.state} />
              </div>
              <div>
                <label className="brutalist-label" htmlFor="destination.zipCode">
                  Código Postal
                </label>
                <input
                  id="destination.zipCode"
                  className="brutalist-input"
                  disabled={isSubmitting}
                  {...register('destination.zipCode')}
                />
                <ErrorMessage error={errors.destination?.zipCode} />
              </div>
            </div>
          ) : (
            <div>
              <label className="brutalist-label" htmlFor="destinationBranchId">
                Sucursal de retiro
              </label>
              <select
                id="destinationBranchId"
                className="brutalist-input"
                disabled={isSubmitting || mastersLoading}
                {...register('destinationBranchId')}
              >
                <option value="">— Seleccionar sucursal —</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {formatBranchOptionLabel(branch)}
                  </option>
                ))}
              </select>
              <ErrorMessage error={errors.destinationBranchId} />
            </div>
          )}
        </section>
        <section className="bento-cell space-y-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Detalles del paquete
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="brutalist-label" htmlFor="type">
                Tipo
              </label>
              <select
                id="type"
                className="brutalist-input"
                disabled={isSubmitting}
                {...register('type')}
              >
                <option value="Envelope">Sobre</option>
                <option value="Bag">Bolsa</option>
                <option value="Box">Caja</option>
              </select>
              <ErrorMessage error={errors.type} />
            </div>
            <div>
              <label className="brutalist-label" htmlFor="size">
                Tamaño
              </label>
              <select
                id="size"
                className="brutalist-input"
                disabled={isSubmitting}
                {...register('size')}
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="XXXL">XXXL</option>
              </select>
              <ErrorMessage error={errors.size} />
            </div>
            <div className="sm:col-span-2">
              <label className="brutalist-label" htmlFor="contentDescription">
                Contenido del paquete
              </label>
              <input
                id="contentDescription"
                className="brutalist-input"
                placeholder="Ej. Documentos, ropa, electrónicos..."
                disabled={isSubmitting}
                {...register('contentDescription')}
              />
              <ErrorMessage error={errors.contentDescription} />
            </div>
            <div className="sm:col-span-2">
              <label className="inline-flex cursor-pointer items-center gap-3 border-2 border-on-surface bg-surface px-4 py-3 shadow-brutal-sm">
                <input
                  type="checkbox"
                  checked={isFragile}
                  onChange={(event) =>
                    setValue('isFragile', event.target.checked, {
                      shouldValidate: true,
                    })
                  }
                  disabled={isSubmitting}
                  className={checkboxInputClass}
                />
                <span className="text-sm font-bold uppercase tracking-wide text-on-surface">
                  Paquete frágil
                </span>
              </label>
            </div>
          </div>
        </section>
        <section className="bento-cell space-y-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Detalles del envío
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="brutalist-label" htmlFor="weightInKg">
                Peso (kg)
              </label>
              <input
                id="weightInKg"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                className="brutalist-input"
                disabled={isSubmitting}
                {...register('weightInKg')}
              />
              <ErrorMessage error={errors.weightInKg} />
            </div>
            <div>
              <label className="brutalist-label" htmlFor="shippingAmount">
                Monto del envío (S/)
              </label>
              <input
                id="shippingAmount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                className="brutalist-input"
                disabled={isSubmitting}
                {...register('shippingAmount')}
              />
              <ErrorMessage error={errors.shippingAmount} />
            </div>
            <div>
              <label className="brutalist-label" htmlFor="paymentMethod">
                Método de pago
              </label>
              <select
                id="paymentMethod"
                className="brutalist-input"
                disabled={isSubmitting}
                {...register('paymentMethod')}
              >
                <option value="PrePaid">Pagado</option>
                <option value="CashOnDelivery">Contra entrega</option>
              </select>
              <ErrorMessage error={errors.paymentMethod} />
            </div>
          </div>
        </section>
        <section className="bento-cell space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
                Participantes
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-on-surface-muted">
                {isClient
                  ? 'Opcional: vincula remitente y destinatario. Busca participantes por DNI.'
                  : 'Vincula remitente y/o destinatario. No es obligatorio que estén ambos registrados.'}
              </p>
            </div>
            {isStaff && (
              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                disabled={isSubmitting}
                className="brutalist-button-secondary shrink-0"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Registrar cliente
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="brutalist-label" htmlFor="senderId">
                Remitente
              </label>
              <select
                id="senderId"
                className="brutalist-input"
                disabled={isSubmitting || mastersLoading}
                {...register('senderId')}
              >
                <option value="">— Sin asignar —</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName} ({customer.dni})
                  </option>
                ))}
              </select>
              <ParticipantDniSearch
                id="sender-dni-search"
                label="Buscar remitente por DNI"
                value={senderDniSearch}
                onChange={setSenderDniSearch}
                onSearch={handleSenderDniSearch}
                searching={senderDniSearching}
                disabled={isSubmitting || mastersLoading}
              />
            </div>
            <div>
              <label className="brutalist-label" htmlFor="recipientId">
                Destinatario
              </label>
              <select
                id="recipientId"
                className="brutalist-input"
                disabled={isSubmitting || mastersLoading}
                {...register('recipientId')}
              >
                <option value="">— Sin asignar —</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName} ({customer.dni})
                  </option>
                ))}
              </select>
              <ParticipantDniSearch
                id="recipient-dni-search"
                label="Buscar destinatario por DNI"
                value={recipientDniSearch}
                onChange={setRecipientDniSearch}
                onSearch={handleRecipientDniSearch}
                searching={recipientDniSearching}
                disabled={isSubmitting || mastersLoading}
              />
            </div>
          </div>
        </section>

        {isStaff && (
          <CustomerRegistrationModal
            open={customerModalOpen}
            onOpenChange={setCustomerModalOpen}
            onCustomerCreated={handleCustomerCreated}
            onAssignSender={(customerId) =>
              setValue('senderId', customerId, { shouldValidate: true })
            }
            onAssignRecipient={(customerId) =>
              setValue('recipientId', customerId, { shouldValidate: true })
            }
          />
        )}
        <section className="bento-cell space-y-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            PIN de entrega
          </h2>
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-muted">
            El destinatario deberá entregar este PIN al repartidor para confirmar
            la entrega. Usa 4 dígitos numéricos.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="brutalist-label" htmlFor="pin">
                PIN (4 dígitos)
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                className="brutalist-input font-mono tracking-[0.4em]"
                disabled={isSubmitting}
                {...register('pin')}
              />
              <ErrorMessage error={errors.pin} />
            </div>
            <div>
              <label className="brutalist-label" htmlFor="confirmPin">
                Confirmar PIN
              </label>
              <input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                className="brutalist-input font-mono tracking-[0.4em]"
                disabled={isSubmitting}
                {...register('confirmPin')}
              />
              <ErrorMessage error={errors.confirmPin} />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="brutalist-button-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="brutalist-button-primary"
          >
            {isSubmitting
              ? 'Cargando...'
              : isClient
                ? 'Solicitar recojo'
                : 'Crear envío'}
          </button>
        </div>
      </form>

      <CatalogStatusConfirmModal
        open={branchChangeModalOpen}
        activating
        submitting={false}
        title="Cambiar sucursal de origen"
        description="Estás cambiando la sucursal de admisión respecto a la que tienes asignada. ¿Deseas continuar?"
        confirmLabel="Sí, cambiar"
        onOpenChange={(open) => {
          if (!open) {
            setPendingBranchId(null);
          }
          setBranchChangeModalOpen(open);
        }}
        onConfirm={confirmOriginBranchChange}
      />
    </div>
  );
}

export default CreateShipment;
