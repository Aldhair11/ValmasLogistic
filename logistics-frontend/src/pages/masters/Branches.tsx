import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Building2, Pencil, Plus, UserCheck, UserX } from 'lucide-react';
import BranchEditModal from '../../components/BranchEditModal';
import CatalogStatusConfirmModal from '../../components/masters/CatalogStatusConfirmModal';
import MasterPaginationBar from '../../components/masters/MasterPaginationBar';
import MasterSearchPanel from '../../components/masters/MasterSearchPanel';
import RoleGuard from '../../components/RoleGuard';
import { MASTER_DEFAULT_PAGE_SIZE } from '../../constants/masters';
import { formatBranchLocation } from '../../lib/branchUtils';
import { BranchService } from '../../services/masters';
import { notifyError } from '../../lib/notify';
import type { PagedResult } from '../../types';
import type { BranchDto, CreateBranchRequest } from '../../types/masters';
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
} from './shared';

const emptyForm: CreateBranchRequest = {
  phone: '',
  name: '',
  address: '',
  businessHours: '',
  country: 'PerÃº',
  department: '',
  province: '',
  district: '',
};

const formFields: { key: keyof CreateBranchRequest; label: string; span?: boolean }[] = [
  { key: 'phone', label: 'TelÃ©fono' },
  { key: 'name', label: 'Nombre' },
  { key: 'address', label: 'DirecciÃ³n', span: true },
  { key: 'businessHours', label: 'Horario de atenciÃ³n' },
  { key: 'country', label: 'PaÃ­s' },
  { key: 'department', label: 'Departamento' },
  { key: 'province', label: 'Provincia' },
  { key: 'district', label: 'Distrito' },
];

const actionButtonClass =
  'inline-flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-surface shadow-brutal-sm transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

function Branches() {
  const [paged, setPaged] = useState<PagedResult<BranchDto> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MASTER_DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateBranchRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusBranch, setStatusBranch] = useState<BranchDto | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusActivating, setStatusActivating] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const loadBranches = useCallback(async () => {
    setFetching(true);
    try {
      const data = await BranchService.getPage({
        page,
        pageSize,
        search: deferredSearch,
      });
      setPaged(data);
    } catch (err) {
      setPaged(null);
      notifyError(err, 'No se pudieron cargar las sucursales.');
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, [page, pageSize, deferredSearch]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const branches = paged?.items ?? [];
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

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await BranchService.create(form);
      setForm(emptyForm);
      setShowForm(false);
      setPage(1);
      await loadBranches();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusModal = (branch: BranchDto, activating: boolean) => {
    setStatusBranch(branch);
    setStatusActivating(activating);
    setStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!statusBranch) return;
    setStatusSubmitting(true);
    try {
      await BranchService.setActive(statusBranch.id, statusActivating);
      setStatusModalOpen(false);
      setStatusBranch(null);
      await loadBranches();
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
            <Building2 className="h-7 w-7 text-indigo-600" aria-hidden="true" />
            <h1 className={pageTitleClass}>Sucursales</h1>
          </div>
          <p className={pageSubtitleClass}>
            Puntos de operaciÃ³n con ubicaciÃ³n administrativa (paÃ­s, departamento, provincia y distrito).
          </p>
        </div>
        <RoleGuard allowedRoles={['Admin']}>
          <button type="button" onClick={() => setShowForm((prev) => !prev)} className={primaryButtonClass}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {showForm ? 'Cancelar' : 'Agregar Nuevo'}
          </button>
        </RoleGuard>
      </header>

      {showForm && (
        <RoleGuard allowedRoles={['Admin']}>
          <form onSubmit={handleSubmit} noValidate className={formSectionClass}>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
              Nueva sucursal
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {formFields.map((field) => (
                <div key={field.key} className={field.span ? 'sm:col-span-2' : ''}>
                  <label htmlFor={`branch-${field.key}`} className={labelClass}>
                    {field.label}
                  </label>
                  <input
                    id={`branch-${field.key}`}
                    type={field.key === 'phone' ? 'tel' : 'text'}
                    required
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className={primaryButtonClass}>
                {submitting ? 'Guardando...' : 'Guardar sucursal'}
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
        </RoleGuard>
      )}

      <MasterSearchPanel
        id="branch-search"
        label="Buscar sucursal"
        value={search}
        placeholder="Nombre, telÃ©fono, direcciÃ³n, distrito..."
        onChange={handleSearchChange}
      />

      <div className={tableWrapperClass}>
        {initialLoading ? (
          <div className={loadingBoxClass}>
            <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
          </div>
        ) : branches.length === 0 ? (
          <div className={emptyBoxClass}>
            <p>
              {isSearching
                ? 'No hay sucursales que coincidan con la bÃºsqueda.'
                : 'No hay sucursales registradas.'}
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
                  <th className={thClass}>TelÃ©fono</th>
                  <th className={thClass}>Nombre</th>
                  <th className={thClass}>UbicaciÃ³n</th>
                  <th className={thClass}>Horario</th>
                  <th className={thClass}>Estado</th>
                  <RoleGuard allowedRoles={['Admin']}>
                    <th className={`${thClass} text-right`}>Acciones</th>
                  </RoleGuard>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {branches.map((branch) => (
                  <tr
                    key={branch.id}
                    className={`hover:bg-surface-container-low ${!branch.isActive ? 'opacity-70' : ''}`}
                  >
                    <td className={`${tdClass} font-mono`}>{branch.phone}</td>
                    <td className={tdClass}>
                      <div>{branch.name}</div>
                      <div className="text-xs font-medium text-on-surface-muted">{branch.address}</div>
                    </td>
                    <td className={tdClass}>{formatBranchLocation(branch)}</td>
                    <td className={tdClass}>{branch.businessHours}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex border-2 border-on-surface px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide shadow-brutal-sm ${
                          branch.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-surface-container-low text-on-surface-muted'
                        }`}
                      >
                        {branch.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <RoleGuard allowedRoles={['Admin']}>
                      <td className={`${tdClass} text-right`}>
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBranch(branch);
                              setEditModalOpen(true);
                            }}
                            className={actionButtonClass}
                            aria-label={`Editar ${branch.name}`}
                            title="Editar sucursal"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {branch.isActive ? (
                            <button
                              type="button"
                              onClick={() => openStatusModal(branch, false)}
                              className={`${actionButtonClass} hover:bg-red-100`}
                              aria-label={`Desactivar ${branch.name}`}
                              title="Desactivar sucursal"
                            >
                              <UserX className="h-4 w-4 text-red-700" aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStatusModal(branch, true)}
                              className={`${actionButtonClass} hover:bg-green-100`}
                              aria-label={`Reactivar ${branch.name}`}
                              title="Reactivar sucursal"
                            >
                              <UserCheck className="h-4 w-4 text-green-700" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </RoleGuard>
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
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <RoleGuard allowedRoles={['Admin']}>
        <BranchEditModal
          branch={editingBranch}
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open);
            if (!open) setEditingBranch(null);
          }}
          onBranchUpdated={(updated) =>
            setPaged((prev) =>
              prev
                ? {
                    ...prev,
                    items: prev.items.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  }
                : prev,
            )
          }
        />
        <CatalogStatusConfirmModal
          open={statusModalOpen}
          activating={statusActivating}
          submitting={statusSubmitting}
          title={statusActivating ? 'Reactivar sucursal' : 'Desactivar sucursal'}
          description={
            statusActivating
              ? `Â¿Deseas reactivar ${statusBranch?.name ?? 'esta sucursal'}? VolverÃ¡ a estar disponible para operaciones.`
              : `Â¿Deseas desactivar ${statusBranch?.name ?? 'esta sucursal'} (${statusBranch?.phone ?? ''})? No aparecerÃ¡ en asignaciones nuevas.`
          }
          confirmLabel={statusActivating ? 'Reactivar' : 'Desactivar'}
          onOpenChange={(open) => {
            if (!open && statusSubmitting) return;
            setStatusModalOpen(open);
            if (!open) setStatusBranch(null);
          }}
          onConfirm={() => void handleStatusConfirm()}
        />
      </RoleGuard>
    </div>
  );
}

export default Branches;





