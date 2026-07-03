import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, X } from 'lucide-react';
import { CustomerService } from '../services/masters';
import type { CreateCustomerRequest, CustomerDto } from '../types/masters';

interface CustomerEditModalProps {
  customer: CustomerDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated: (customer: CustomerDto) => void;
}

function CustomerEditModal({
  customer,
  open,
  onOpenChange,
  onCustomerUpdated,
}: CustomerEditModalProps) {
  const [form, setForm] = useState<CreateCustomerRequest>({
    dni: '',
    fullName: '',
    email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && customer) {
      setForm({
        dni: customer.dni,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      });
    }
  }, [open, customer]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer) return;

    setSubmitting(true);
    try {
      const updated = await CustomerService.update(customer.id, form);
      onCustomerUpdated(updated);
      onOpenChange(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && submitting) return;
    onOpenChange(next);
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
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <Dialog.Title className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
                  Editar cliente
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs font-bold uppercase tracking-wide text-on-surface-muted">
                  {customer?.fullName ?? 'Actualiza los datos del participante'}
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

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-customer-dni" className="brutalist-label">
                  DNI
                </label>
                <input
                  id="edit-customer-dni"
                  type="text"
                  required
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  disabled={submitting}
                  className="brutalist-input"
                />
              </div>
              <div>
                <label htmlFor="edit-customer-fullName" className="brutalist-label">
                  Nombre completo
                </label>
                <input
                  id="edit-customer-fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  disabled={submitting}
                  className="brutalist-input"
                />
              </div>
              <div>
                <label htmlFor="edit-customer-email" className="brutalist-label">
                  Correo electr├│nico
                </label>
                <input
                  id="edit-customer-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={submitting}
                  className="brutalist-input"
                />
              </div>
              <div>
                <label htmlFor="edit-customer-phone" className="brutalist-label">
                  Tel├®fono
                </label>
                <input
                  id="edit-customer-phone"
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
                disabled={submitting || !customer}
                className="brutalist-button-primary"
              >
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CustomerEditModal;
