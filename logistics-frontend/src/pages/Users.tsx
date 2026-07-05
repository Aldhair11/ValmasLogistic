import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Pencil, Plus, UserCheck, UserCog, UserX } from 'lucide-react';
import CatalogStatusConfirmModal from '../components/masters/CatalogStatusConfirmModal';
import MasterPaginationBar from '../components/masters/MasterPaginationBar';
import MasterSearchPanel from '../components/masters/MasterSearchPanel';
import UserEditModal from '../components/UserEditModal';
import { MASTER_DEFAULT_PAGE_SIZE } from '../constants/masters';
import { formatBranchOptionLabel } from '../lib/branchUtils';
import { BranchService } from '../services/masters';
import { UserService, type CreateUserRequest, type StaffUserDto } from '../services/api';
import { notifyError } from '../lib/notify';
import type { PagedResult } from '../types';
import type { BranchDto } from '../types/masters';
import {
  emptyBoxClass,
  formSectionClass,
  inputClass,
  labelClass,
  loadingBoxClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButtonClass,
  secondaryButtonClass,
  tableWrapperClass,
  tdClass,
  thClass,
} from './masters/shared';

const ROLES = [
  { value: 'Admin', label: 'Administrador' },
  { value: 'Worker', label: 'Operador (Worker)' },
] as const;

const emptyForm: CreateUserRequest = {
  username: '',
  password: '',
  role: 'Worker',
  branchId: null,
};

const roleLabel: Record<string, string> = {
  Admin: 'Administrador',
  Worker: 'Operador',
};

const actionButtonClass =
  'inline-flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-surface shadow-brutal-sm transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

function Users() {
  const [paged, setPaged] = useState<PagedResult<StaffUserDto> | null>(null);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MASTER_DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateUserRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUserDto | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<StaffUserDto | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusActivating, setStatusActivating] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setFetching(true);
    try {
      const data = await UserService.getPage({
        page,
        pageSize,
        search: deferredSearch,
      });
      setPaged(data);
    } catch (err) {
      setPaged(null);
      notifyError(err, 'No se pudieron cargar los usuarios.');
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, [page, pageSize, deferredSearch]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    let cancelled = false;

    void BranchService.getActiveLookup()
      .then((data) => {
        if (!cancelled) setBranches(data);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const users = paged?.items ?? [];
  const totalCount = paged?.totalCount ?? 0;
  const totalPages = useMemo(
    () => (totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, totalCount);
  const isSearching = deferredSearch.trim().length > 0;
  const isWorkerRole = form.role === 'Worker';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isWorkerRole && !form.branchId) {
      notifyError(null, 'Selecciona la sucursal del operador.', 'Sucursal requerida');
      return;
    }

    setSubmitting(true);
    try {
      await UserService.create({
        ...form,
        branchId: isWorkerRole ? form.branchId : null,
      });
      setForm(emptyForm);
      setShowForm(false);
      setPage(1);
      await loadUsers();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: StaffUserDto) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  const handleUserUpdated = (updated: StaffUserDto) => {
    setPaged((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          }
        : prev,
    );
  };

  const openStatusModal = (user: StaffUserDto, activating: boolean) => {
    setStatusUser(user);
    setStatusActivating(activating);
    setStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!statusUser) return;

    setStatusSubmitting(true);
    try {
      await UserService.setActive(statusUser.id, statusActivating);
      setStatusModalOpen(false);
      setStatusUser(null);
      await loadUsers();
    } catch {
    } finally {
      setStatusSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-7 w-7 text-primary" aria-hidden="true" />
            <h1 className={pageTitleClass}>Usuarios</h1>
          </div>
          <p className={pageSubtitleClass}>
            Administra cuentas de administradores y operadores del sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className={primaryButtonClass}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {showForm ? 'Cancelar' : 'Agregar Nuevo'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} noValidate className={formSectionClass}>
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
            Nuevo usuario
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="user-username" className={labelClass}>
                Nombre de usuario
              </label>
              <input
                id="user-username"
                type="text"
                autoComplete="username"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={submitting}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="user-password" className={labelClass}>
                ContraseÃ±a
              </label>
              <input
                id="user-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={submitting}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="user-role" className={labelClass}>
                Rol
              </label>
              <select
                id="user-role"
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value,
                    branchId: e.target.value === 'Worker' ? form.branchId : null,
                  })
                }
                disabled={submitting}
                className={inputClass}
              >
                {ROLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {isWorkerRole && (
              <div>
                <label htmlFor="user-branch" className={labelClass}>
                  Sucursal asignada
                </label>
                <select
                  id="user-branch"
                  required
                  value={form.branchId ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branchId: e.target.value || null,
                    })
                  }
                  disabled={submitting}
                  className={inputClass}
                >
                  <option value="">â€” Seleccionar sucursal â€”</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {formatBranchOptionLabel(branch)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? 'Guardando...' : 'Registrar usuario'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <MasterSearchPanel
        id="user-search"
        label="Buscar usuario"
        value={search}
        placeholder="Usuario o rol..."
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <div className={tableWrapperClass}>
        {initialLoading ? (
          <div className={loadingBoxClass}>
            <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
          </div>
        ) : users.length === 0 ? (
          <div className={emptyBoxClass}>
            <p>
              {isSearching
                ? 'No hay usuarios que coincidan con la bÃºsqueda.'
                : 'No hay usuarios registrados.'}
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto transition-opacity ${fetching ? 'opacity-60' : ''}`}
            aria-busy={fetching}
          >
            <table className="min-w-full border-2 border-on-surface">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className={thClass}>Usuario</th>
                  <th className={thClass}>Rol</th>
                  <th className={thClass}>Sucursal</th>
                  <th className={thClass}>Estado</th>
                  <th className={`${thClass} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-surface-container-low ${!user.isActive ? 'opacity-70' : ''}`}
                  >
                    <td className={`${tdClass} font-mono`}>{user.username}</td>
                    <td className={tdClass}>{roleLabel[user.role] ?? user.role}</td>
                    <td className={tdClass}>{user.branchName ?? 'â€”'}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex border-2 border-on-surface px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide shadow-brutal-sm ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-surface-container-low text-on-surface-muted'
                        }`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className={actionButtonClass}
                          aria-label={`Editar ${user.username}`}
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {user.isActive ? (
                          <button
                            type="button"
                            onClick={() => openStatusModal(user, false)}
                            className={`${actionButtonClass} hover:bg-red-100`}
                            aria-label={`Desactivar ${user.username}`}
                            title="Desactivar usuario"
                          >
                            <UserX className="h-4 w-4 text-red-700" aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openStatusModal(user, true)}
                            className={`${actionButtonClass} hover:bg-green-100`}
                            aria-label={`Reactivar ${user.username}`}
                            title="Reactivar usuario"
                          >
                            <UserCheck className="h-4 w-4 text-green-700" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <MasterPaginationBar
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          hasPrev={hasPrev}
          hasNext={hasNext}
          disabled={fetching}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => prev + 1)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      <UserEditModal
        user={editingUser}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingUser(null);
        }}
        onUserUpdated={handleUserUpdated}
      />

      <CatalogStatusConfirmModal
        open={statusModalOpen}
        activating={statusActivating}
        submitting={statusSubmitting}
        title={statusActivating ? 'Reactivar usuario' : 'Desactivar usuario'}
        description={
          statusActivating
            ? `Â¿Deseas reactivar a ${statusUser?.username ?? 'este usuario'}? PodrÃ¡ volver a iniciar sesiÃ³n.`
            : `Â¿Deseas desactivar a ${statusUser?.username ?? 'este usuario'}? No podrÃ¡ iniciar sesiÃ³n hasta que lo reactives.`
        }
        confirmLabel={statusActivating ? 'Reactivar' : 'Desactivar'}
        onOpenChange={(open) => {
          if (!open && statusSubmitting) return;
          setStatusModalOpen(open);
          if (!open) setStatusUser(null);
        }}
        onConfirm={() => void handleStatusConfirm()}
      />
    </div>
  );
}

export default Users;





