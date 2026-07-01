import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { UserPlus, X } from 'lucide-react';
import { CustomerService } from '../services/masters';
import type { CreateCustomerRequest, CustomerDto } from '../types/masters';

const emptyForm: CreateCustomerRequest = {
  dni: '',
  fullName: '',
  email: '',
  phone: '',
};

interface CustomerRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: CustomerDto) => void;
  onAssignSender?: (customerId: string) => void;
  onAssignRecipient?: (customerId: string) => void;
}

function CustomerRegistrationModal({
  open,
  onOpenChange,
  onCustomerCreated,
  onAssignSender,
  onAssignRecipient,
}: CustomerRegistrationModalProps) {
  const [form, setForm] = useState<CreateCustomerRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<CustomerDto | null>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setLastCreated(null);
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const customer = await CustomerService.create(form);
      onCustomerCreated(customer);
      setLastCreated(customer);
      setForm(emptyForm);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && submitting) return;
    onOpenChange(next);
  };

  const handleAssignSender = () => {
    if (!lastCreated) return;
    onAssignSender?.(lastCreated.id);
    onOpenChange(false);
  };

  const handleAssignRecipient = () => {
    if (!lastCreated) return;
    onAssignRecipient?.(lastCreated.id);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-on-surface/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-on-surface bg-surface p-6 shadow-brutal focus:outline-none"
          onEscapeKeyDown={(event) => {
            if (submitting) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (submitting) event.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal-sm">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <Dialog.Title className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
                  Registrar cliente
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs font-bold uppercase tracking-wide text-on-surface-muted">
                  Alta rápida sin salir del formulario de envío
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={submitting}
                className="brutalist-button-secondary px-2 py-2"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {lastCreated ? (
            <div className="mt-5 space-y-4 border-2 border-on-surface bg-green-100 p-4 shadow-brutal-sm">
              <p className="text-sm font-bold text-on-surface">
                <span className="font-extrabold uppercase tracking-wide">
                  {lastCreated.fullName}
                </span>{' '}
                (DNI {lastCreated.dni}) fue registrado correctamente.
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-muted">
                Asigna el rol en este envío o registra otro participante.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleAssignSender}
                  className="brutalist-button-primary flex-1"
                >
                  Asignar como remitente
                </button>
                <button
                  type="button"
                  onClick={handleAssignRecipient}
                  className="brutalist-button-primary flex-1"
                >
                  Asignar como destinatario
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setLastCreated(null)}
                  className="brutalist-button-secondary flex-1"
                >
                  Registrar otro
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="brutalist-button-secondary flex-1"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-customer-dni" className="brutalist-label">
                    DNI
                  </label>
                  <input
                    id="modal-customer-dni"
                    type="text"
                    required
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                    disabled={submitting}
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label htmlFor="modal-customer-fullName" className="brutalist-label">
                    Nombre completo
                  </label>
                  <input
                    id="modal-customer-fullName"
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    disabled={submitting}
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label htmlFor="modal-customer-email" className="brutalist-label">
                    Correo electrónico
                  </label>
                  <input
                    id="modal-customer-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={submitting}
                    className="brutalist-input"
                  />
                </div>
                <div>
                  <label htmlFor="modal-customer-phone" className="brutalist-label">
                    Teléfono
                  </label>
                  <input
                    id="modal-customer-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={submitting}
                    className="brutalist-input"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={submitting}
                    className="brutalist-button-secondary"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting}
                  className="brutalist-button-primary"
                >
                  {submitting ? 'Guardando...' : 'Guardar cliente'}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CustomerRegistrationModal;
