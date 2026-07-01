import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, Plus } from 'lucide-react';
import RoleGuard from '../../components/RoleGuard';
import { BranchService } from '../../services/masters';
import { notifyError } from '../../lib/notify';
import type { BranchDto, CreateBranchRequest } from '../../types/masters';
import { formatBranchLocation } from '../../lib/branchUtils';
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
  country: 'Peru',
  department: '',
  province: '',
  district: '',
};

const formFields: { key: keyof CreateBranchRequest; label: string; span?: boolean }[] = [
  { key: 'phone', label: 'Telefono' },
  { key: 'name', label: 'Nombre' },
  { key: 'address', label: 'Direccion', span: true },
  { key: 'businessHours', label: 'Horario de atencion' },
  { key: 'country', label: 'Pais' },
  { key: 'department', label: 'Departamento' },
  { key: 'province', label: 'Provincia' },
  { key: 'district', label: 'Distrito' },
];

function Branches() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateBranchRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BranchService.getPage({ page: 1, pageSize: 100, search: '' });
      setBranches(data.items);
    } catch (err) {
      setBranches([]);
      notifyError(err, 'No se pudieron cargar las sucursales.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await BranchService.create(form);
      setForm(emptyForm);
      setShowForm(false);
      await loadBranches();
    } catch {
    } finally {
      setSubmitting(false);
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
            Puntos de operacion con ubicacion administrativa.
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
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-on-surface">Nueva sucursal</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {formFields.map((field) => (
                <div key={field.key} className={field.span ? 'sm:col-span-2' : ''}>
                  <label htmlFor={`branch-${field.key}`} className={labelClass}>{field.label}</label>
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
              <button type="button" disabled={submitting} onClick={() => { setShowForm(false); setForm(emptyForm); }} className={secondaryButtonClass}>
                Cancelar
              </button>
            </div>
          </form>
        </RoleGuard>
      )}

      <div className={tableWrapperClass}>
        {loading ? (
          <div className={loadingBoxClass}>
            <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
          </div>
        ) : branches.length === 0 ? (
          <div className={emptyBoxClass}><p>No hay sucursales registradas.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-on-surface">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className={thClass}>Telefono</th>
                  <th className={thClass}>Nombre</th>
                  <th className={thClass}>Ubicacion</th>
                  <th className={thClass}>Horario</th>
                  <th className={thClass}>Estado</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-surface-container-low">
                    <td className={`${tdClass} font-mono`}>{branch.phone}</td>
                    <td className={tdClass}>
                      <div>{branch.name}</div>
                      <div className="text-xs font-medium text-on-surface-muted">{branch.address}</div>
                    </td>
                    <td className={tdClass}>{formatBranchLocation(branch)}</td>
                    <td className={tdClass}>{branch.businessHours}</td>
                    <td className={tdClass}>{branch.isActive ? 'Activo' : 'Inactivo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Branches;
