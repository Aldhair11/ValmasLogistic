import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { BanknoteArrowUp } from 'lucide-react';
import type { PaymentMethod } from '../types';

interface DeliveryPinDialogProps {
  open: boolean;
  submitting: boolean;
  errorMessage?: string | null;
  paymentMethod: PaymentMethod;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}


function DeliveryPinDialog({
  open,
  submitting,
  errorMessage,
  paymentMethod,
  onConfirm,
  onCancel,
}: DeliveryPinDialogProps) {
  const [pin, setPin] = useState('');
  const [cashCollected, setCashCollected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCashOnDelivery = paymentMethod === 'CashOnDelivery';

  useEffect(() => {
    if (open) {
      setPin('');
      setCashCollected(false);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const isPinValid = /^\d{4}$/.test(pin);
  const isPaymentSatisfied = !isCashOnDelivery || cashCollected;
  const canSubmit = isPinValid && isPaymentSatisfied && !submitting;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onConfirm(pin);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) {
      onCancel();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 focus:outline-none"
          onEscapeKeyDown={(event) => {
            if (submitting) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (submitting) event.preventDefault();
          }}
        >
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            Confirmar entrega
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-600">
            Solicita al destinatario el PIN de 4 dígitos que recibió al
            registrar su envío e ingrésalo a continuación.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="delivery-pin-input"
                className="block text-sm font-medium text-slate-700"
              >
                PIN del cliente
              </label>
              <input
                id="delivery-pin-input"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, '').slice(0, 4))
                }
                disabled={submitting}
                placeholder="0000"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-center font-mono text-2xl tracking-[0.6em] shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={
                  errorMessage ? 'delivery-pin-error' : undefined
                }
              />
            </div>

            {isCashOnDelivery && (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  cashCollected
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-amber-300 bg-amber-50 hover:bg-amber-100/70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={cashCollected}
                  onChange={(event) => setCashCollected(event.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex flex-1 items-start gap-2">
                  <BanknoteArrowUp
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                      cashCollected ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-sm font-medium ${
                      cashCollected ? 'text-emerald-900' : 'text-amber-900'
                    }`}
                  >
                    Confirmar recepción del pago en efectivo
                  </span>
                </span>
              </label>
            )}

            {errorMessage && (
              <div
                id="delivery-pin-error"
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {submitting ? 'Confirmando...' : 'Confirmar entrega'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default DeliveryPinDialog;
