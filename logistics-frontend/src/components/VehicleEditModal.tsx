import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { VehicleService } from '../services/masters';
import type { CreateVehicleRequest, VehicleDto } from '../types/masters';

interface VehicleEditModalProps {
  vehicle: VehicleDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleUpdated: (vehicle: VehicleDto) => void;
}

function VehicleEditModal({
  vehicle,
  open,
  onOpenChange,
  onVehicleUpdated,
}: VehicleEditModalProps) {
  const [form, setForm] = useState<CreateVehicleRequest>({
    licensePlate: '',
    model: '',
    capacityInKg: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && vehicle) {
      setForm({
        licensePlate: vehicle.licensePlate,
        model: vehicle.model,
        capacityInKg: vehicle.capacityInKg,
      });
    }
  }, [open, vehicle]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vehicle) return;

    setSubmitting(true);
    try {
      const updated = await VehicleService.update(vehicle.id, form);
      onVehicleUpdated(updated);
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
          <Dialog.Title className="text-lg font-extrabold uppercase">Editar vehiculo</Dialog.Title>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              required
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
              className="brutalist-input w-full"
              placeholder="Placa"
            />
            <input
              required
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="brutalist-input w-full"
              placeholder="Modelo"
            />
            <input
              required
              type="number"
              min={1}
              value={form.capacityInKg}
              onChange={(e) => setForm({ ...form, capacityInKg: Number(e.target.value) })}
              className="brutalist-input w-full"
              placeholder="Capacidad kg"
            />
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

export default VehicleEditModal;
