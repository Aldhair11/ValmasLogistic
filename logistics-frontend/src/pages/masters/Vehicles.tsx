import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Truck } from 'lucide-react';
import RoleGuard from '../../components/RoleGuard';
import { VehicleService } from '../../services/masters';
import { notifyError } from '../../lib/notify';
import type { CreateVehicleRequest, VehicleDto } from '../../types/masters';
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

const emptyForm: CreateVehicleRequest = {
  licensePlate: '',
  model: '',
  capacityInKg: 500,
};

function Vehicles() {
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateVehicleRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await VehicleService.getPage({ page: 1, pageSize: 100, search: '' });
      setVehicles(data.items);
    } catch (err) {
      setVehicles([]);
      notifyError(err, 'No se pudieron cargar los vehiculos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await VehicleService.create(form);
      setForm(emptyForm);
      setShowForm(false);
      await loadVehicles();
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
            <Truck className="h-7 w-7 text-primary" aria-hidden="true" />
            <h1 className={pageTitleClass}>Vehiculos</h1>
          </div>
          <p className={pageSubtitleClass}>Flota de transporte y capacidad de carga.</p>
        </div>
        <RoleGuard allowedRoles={['Admin']}>
          <button type="button" onClick={() => setShowForm((p) => !p)} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancelar' : 'Agregar Nuevo'}
          </button>
        </RoleGuard>
      </header>

      {showForm && (
        <RoleGuard allowedRoles={['Admin']}>
          <form onSubmit={handleSubmit} className={formSectionClass}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Placa</label>
                <input required value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Modelo</label>
                <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Capacidad (kg)</label>
                <input required type="number" min={1} value={form.capacityInKg} onChange={(e) => setForm({ ...form, capacityInKg: Number(e.target.value) })} className={inputClass} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={submitting} className={primaryButtonClass}>Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className={secondaryButtonClass}>Cancelar</button>
            </div>
          </form>
        </RoleGuard>
      )}

      <div className={tableWrapperClass}>
        {loading ? (
          <div className={loadingBoxClass}><div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" /></div>
        ) : vehicles.length === 0 ? (
          <div className={emptyBoxClass}><p>No hay vehiculos registrados.</p></div>
        ) : (
          <table className="min-w-full border-2 border-on-surface">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={thClass}>Placa</th>
                <th className={thClass}>Modelo</th>
                <th className={thClass}>Capacidad</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className={`${tdClass} font-mono`}>{v.licensePlate}</td>
                  <td className={tdClass}>{v.model}</td>
                  <td className={tdClass}>{v.capacityInKg} kg</td>
                  <td className={tdClass}>{v.isActive ? 'Activo' : 'Inactivo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Vehicles;
