import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Pencil, Plus, UserCheck, UserX, Users } from 'lucide-react';
import CatalogStatusConfirmModal from '../../components/masters/CatalogStatusConfirmModal';
import MasterPaginationBar from '../../components/masters/MasterPaginationBar';
import MasterSearchPanel from '../../components/masters/MasterSearchPanel';
import CustomerEditModal from '../../components/CustomerEditModal';
import RoleGuard from '../../components/RoleGuard';
import { useAuth } from '../../context/AuthContext';
import { MASTER_DEFAULT_PAGE_SIZE } from '../../constants/masters';
import { CustomerService } from '../../services/masters';
import { notifyError } from '../../lib/notify';
import type { PagedResult } from '../../types';
import type { CreateCustomerRequest, CustomerDto } from '../../types/masters';
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

const emptyForm: CreateCustomerRequest = {
  dni: '',
  fullName: '',
  email: '',
  phone: '',
};

const actionButtonClass =
  'inline-flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-surface shadow-brutal-sm transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

function Customers() {
  const { role } = useAuth();
  const isAdmin = role === 'Admin';
  const canEdit = role === 'Admin' || role === 'Worker';
  const canCreate = canEdit;
  const [paged, setPaged] = useState<PagedResult<CustomerDto> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MASTER_DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCustomerRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusCustomer, setStatusCustomer] = useState<CustomerDto | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusActivating, setStatusActivating] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setFetching(true);
    try {
      const data = await CustomerService.getPage({
        page,
        pageSize,
        search: deferredSearch,
      });
      setPaged(data);
    } catch (err) {
      setPaged(null);
      notifyError(err, 'No se pudieron cargar los clientes.');
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, [page, pageSize, deferredSearch]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const customers = paged?.items ?? [];
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await CustomerService.create(form);
      setForm(emptyForm);
      setShowForm(false);
      setPage(1);
      await loadCustomers();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (customer: CustomerDto) => {
    setEditingCustomer(customer);
    setEditModalOpen(true);
  };

  const handleCustomerUpdated = (updated: CustomerDto) => {
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

  const openStatusModal = (customer: CustomerDto, activating: boolean) => {
    setStatusCustomer(customer);
    setStatusActivating(activating);
    setStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!statusCustomer) return;

    setStatusSubmitting(true);
    try {
      await CustomerService.setActive(statusCustomer.id, statusActivating);
      setStatusModalOpen(false);
      setStatusCustomer(null);
      await loadCustomers();
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
            <Users className="h-7 w-7 text-primary" aria-hidden="true" />
            <h1 className={pageTitleClass}>Clientes</h1>
          </div>
          <p className={pageSubtitleClass}>
            Administra remitentes y destinatarios del sistema. El DNI debe ser único.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className={primaryButtonClass}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {showForm ? 'Cancelar' : 'Agregar Nuevo'}
          </button>
        ) : null}
      </header>

      {showForm && canCreate ? (
        <form onSubmit={handleSubmit} noValidate className={formSectionClass}>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">
              Nuevo cliente
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="customer-dni" className={labelClass}>
                  DNI
                </label>
                <input
                  id="customer-dni"
                  type="text"
                  required
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="customer-fullName" className={labelClass}>
                  Nombre completo
                </label>
                <input
                  id="customer-fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="customer-email" className={labelClass}>
                  Correo electrónico
                </label>
                <input
                  id="customer-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="customer-phone" className={labelClass}>
                  Teléfono
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className={primaryButtonClass}>
                {submitting ? 'Guardando...' : 'Guardar cliente'}
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
      ) : null}

      <MasterSearchPanel
        id="customer-search"
        label="Buscar cliente"
        value={search}
        placeholder="DNI, nombre o correo..."
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
        ) : customers.length === 0 ? (
          <div className={emptyBoxClass}>
            <p>
              {isSearching
                ? 'No hay clientes que coincidan con la búsqueda.'
                : 'No hay clientes registrados.'}
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
                  <th className={thClass}>DNI</th>
                  <th className={thClass}>Nombre</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Teléfono</th>
                  <th className={thClass}>Estado</th>
                  {canEdit ? (
                    <th className={`${thClass} text-right`}>Acciones</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="bg-surface">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-surface-container-low ${!customer.isActive ? 'opacity-70' : ''}`}
                  >
                    <td className={`${tdClass} font-mono`}>{customer.dni}</td>
                    <td className={tdClass}>{customer.fullName}</td>
                    <td className={tdClass}>{customer.email}</td>
                    <td className={tdClass}>{customer.phone}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex border-2 border-on-surface px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide shadow-brutal-sm ${
                          customer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-surface-container-low text-on-surface-muted'
                        }`}
                      >
                        {customer.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canEdit ? (
                      <td className={`${tdClass} text-right`}>
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(customer)}
                            className={actionButtonClass}
                            aria-label={`Editar ${customer.fullName}`}
                            title="Editar cliente"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {isAdmin ? (
                            customer.isActive ? (
                              <button
                                type="button"
                                onClick={() => openStatusModal(customer, false)}
                                className={`${actionButtonClass} hover:bg-red-100`}
                                aria-label={`Desactivar ${customer.fullName}`}
                                title="Desactivar cliente"
                              >
                                <UserX className="h-4 w-4 text-red-700" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openStatusModal(customer, true)}
                                className={`${actionButtonClass} hover:bg-green-100`}
                                aria-label={`Reactivar ${customer.fullName}`}
                                title="Reactivar cliente"
                              >
                                <UserCheck className="h-4 w-4 text-green-700" aria-hidden="true" />
                              </button>
                            )
                          ) : null}
                        </div>
                      </td>
                    ) : null}
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

      {canEdit ? (
        <CustomerEditModal
          customer={editingCustomer}
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open);
            if (!open) setEditingCustomer(null);
          }}
          onCustomerUpdated={handleCustomerUpdated}
        />
      ) : null}

      <RoleGuard allowedRoles={['Admin']}>
        <CatalogStatusConfirmModal
          open={statusModalOpen}
          activating={statusActivating}
          submitting={statusSubmitting}
          title={statusActivating ? 'Reactivar cliente' : 'Desactivar cliente'}
          description={
            statusActivating
              ? `¿Deseas reactivar a ${statusCustomer?.fullName ?? 'este cliente'}? Volverá a estar disponible en el catálogo.`
              : `¿Deseas desactivar a ${statusCustomer?.fullName ?? 'este cliente'} (DNI ${statusCustomer?.dni ?? ''})? El registro se conservará pero no aparecerá en búsquedas operativas.`
          }
          confirmLabel={statusActivating ? 'Reactivar' : 'Desactivar'}
          onOpenChange={(open) => {
            if (!open && statusSubmitting) return;
            setStatusModalOpen(open);
            if (!open) setStatusCustomer(null);
          }}
          onConfirm={() => void handleStatusConfirm()}
        />
      </RoleGuard>
    </div>
  );
}

export default Customers;
