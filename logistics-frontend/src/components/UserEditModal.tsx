import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { UserService, type CreateUserRequest, type StaffUserDto } from '../services/api';
import { BranchService } from '../services/masters';
import type { BranchDto } from '../types/masters';

interface UserEditModalProps {
  user: StaffUserDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: StaffUserDto) => void;
}

function UserEditModal({ user, open, onOpenChange, onUserUpdated }: UserEditModalProps) {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [form, setForm] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'Worker',
    branchId: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      void BranchService.getActiveLookup().then(setBranches).catch(() => setBranches([]));
    }
  }, [open]);

  useEffect(() => {
    if (open && user) {
      setForm({
        username: user.username,
        password: '',
        role: user.role,
        branchId: user.branchId,
      });
    }
  }, [open, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const updated = await UserService.update(user.id, {
        username: form.username,
        role: form.role,
        branchId: form.role === 'Worker' ? form.branchId : null,
        ...(form.password ? { password: form.password } : {}),
      });
      onUserUpdated(updated);
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border-2 border-on-surface bg-surface p-6 shadow-brutal">
          <Dialog.Title className="text-lg font-extrabold uppercase">Editar usuario</Dialog.Title>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="brutalist-input w-full" placeholder="Usuario" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="brutalist-input w-full" placeholder="Nueva contrasena (opcional)" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, branchId: e.target.value === 'Worker' ? form.branchId : null })} className="brutalist-input w-full">
              <option value="Admin">Administrador</option>
              <option value="Worker">Operador</option>
            </select>
            {form.role === 'Worker' && (
              <select value={form.branchId ?? ''} onChange={(e) => setForm({ ...form, branchId: e.target.value || null })} className="brutalist-input w-full">
                <option value="">Sucursal</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => onOpenChange(false)} className="brutalist-button-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="brutalist-button-primary">Guardar</button>
            </div>
          </form>
          <Dialog.Close className="absolute right-4 top-4"><X className="h-4 w-4" /></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default UserEditModal;
