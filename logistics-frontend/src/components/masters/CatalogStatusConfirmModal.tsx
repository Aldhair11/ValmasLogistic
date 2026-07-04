import * as Dialog from '@radix-ui/react-dialog';
import { UserCheck, UserX, X } from 'lucide-react';

export interface CatalogStatusConfirmModalProps {
  open: boolean;
  activating: boolean;
  submitting: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function CatalogStatusConfirmModal({
  open,
  activating,
  submitting,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: CatalogStatusConfirmModalProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next && submitting) return;
    onOpenChange(next);
  };

  const Icon = activating ? UserCheck : UserX;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-on-surface/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-on-surface bg-surface p-6 shadow-brutal focus:outline-none"
          onEscapeKeyDown={(event) => {
            if (submitting) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (submitting) event.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-9 w-9 items-center justify-center border-2 border-on-surface shadow-brutal-sm ${
                  activating ? 'bg-primary text-on-primary' : 'bg-red-100 text-red-800'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <Dialog.Title className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm font-medium text-on-surface-muted">
                  {description}
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

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button type="button" disabled={submitting} className="brutalist-button-secondary">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={submitting}
              onClick={onConfirm}
              className={
                activating
                  ? 'brutalist-button-primary'
                  : 'border-2 border-on-surface bg-red-600 px-4 py-2 font-extrabold uppercase tracking-wide text-white shadow-brutal transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
              }
            >
              {submitting ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CatalogStatusConfirmModal;
