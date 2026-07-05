import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { BranchService } from '../services/masters';
import type { BranchDto, CreateBranchRequest } from '../types/masters';

interface BranchEditModalProps {
  branch: BranchDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBranchUpdated: (branch: BranchDto) => void;
}

function BranchEditModal({ branch, open, onOpenChange, onBranchUpdated }: BranchEditModalProps) {
  const [form, setForm] = useState<CreateBranchRequest>({
    phone: '',
    name: '',
    address: '',
    businessHours: '',
    country: 'Peru',
    department: '',
    province: '',
    district: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && branch) {
      setForm({
        phone: branch.phone,
        name: branch.name,
        address: branch.address,
        businessHours: branch.businessHours,
        country: branch.country,
        department: branch.department,
        province: branch.province,
        district: branch.district,
      });
    }
  }, [open, branch]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branch) return;
    setSubmitting(true);
    try {
      const updated = await BranchService.update(branch.id, form);
      onBranchUpdated(updated);
      onOpenChange(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-on-surface/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-on-surface bg-surface p-6 shadow-brutal">
          <Dialog.Title className="text-lg font-extrabold uppercase">Editar sucursal</Dialog.Title>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['phone', 'Telefono'],
                ['name', 'Nombre'],
                ['address', 'Direccion', true],
                ['businessHours', 'Horario'],
                ['country', 'Pais'],
                ['department', 'Departamento'],
                ['province', 'Provincia'],
                ['district', 'Distrito'],
              ] as const
            ).map(([key, label, span]) => (
              <div key={key} className={span ? 'sm:col-span-2' : ''}>
                <label className="brutalist-label">{label}</label>
                <input
                  required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="brutalist-input w-full"
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex justify-end gap-2">
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

export default BranchEditModal;
