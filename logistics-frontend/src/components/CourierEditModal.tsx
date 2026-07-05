import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, X } from 'lucide-react';
import { CourierService, VehicleService } from '../services/masters';
import type { CourierDto, CreateCourierRequest, VehicleDto } from '../types/masters';

interface CourierEditModalProps {
  courier: CourierDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourierUpdated: (courier: CourierDto) => void;
}

function CourierEditModal({
  courier,
  open,
  onOpenChange,
  onCourierUpdated,
}: CourierEditModalProps) {
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [form, setForm] = useState<CreateCourierRequest>({
    fullName: '',
    phone: '',
    isAvailable: true,
    currentVehicleId: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      void VehicleService.getActiveLookup().then(setVehicles).catch(() => setVehicles([]));
    }
  }, [open]);

  useEffect(() => {
    if (open && courier) {
      setForm({
        fullName: courier.fullName,
        phone: courier.phone,
        isAvailable: courier.isAvailable,
        currentVehicleId: courier.currentVehicleId,
      });
    }
  }, [open, courier]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courier) return;

    setSubmitting(true);
    try {
      const updated = await CourierService.update(courier.id, form);
      onCourierUpdated(updated);
      onOpenChange(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-on-surface/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border-2 border-on-surface bg-surface p-6 shadow-brutal">
          <Dialog.Title className="text-lg font-extrabold uppercase">Editar repartidor</Dialog.Title>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="brutalist-input w-full"
              placeholder="Nombre"
            />
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="brutalist-input w-full"
              placeholder="Telefono"
            />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              />
              Disponible para asignacion
            </label>
            <select
              value={form.currentVehicleId ?? ''}
              onChange={(e) =>
                setForm({ ...form, currentVehicleId: e.target.value || null })
              }
              className="brutalist-input w-full"
            >
              <option value="">Sin vehiculo</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} - {v.model}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => onOpenChange(false)} className="brutalist-button-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="brutalist-button-primary">
                Guardar
              </button>
            </div>
          </form>
          <Dialog.Close className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CourierEditModal;
