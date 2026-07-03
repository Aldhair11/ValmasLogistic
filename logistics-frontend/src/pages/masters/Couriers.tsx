import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Bike, Plus } from 'lucide-react';
import RoleGuard from '../../components/RoleGuard';
import { CourierService, VehicleService } from '../../services/masters';
import { notifyError } from '../../lib/notify';
import type { CourierDto, CreateCourierRequest, VehicleDto } from '../../types/masters';
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

const emptyForm: CreateCourierRequest = {
  fullName: '',
  phone: '',
  isAvailable: true,
  currentVehicleId: null,
};

function Couriers() {
  const [couriers, setCouriers] = useState<CourierDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCourierRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [courierPage, vehicleList] = await Promise.all([
        CourierService.getPage({ page: 1, pageSize: 100, search: '' }),
        VehicleService.getActiveLookup(),
      ]);
      setCouriers(courierPage.items);
      setVehicles(vehicleList);
    } catch (err) {
      setCouriers([]);
      notifyError(err, 'No se pudieron cargar los repartidores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await CourierService.create(form);
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
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
            <Bike className="h-7 w-7 text-primary" aria-hidden="true" />
            <h1 className={pageTitleClass}>Repartidores</h1>
          </div>
          <p className={pageSubtitleClass}>Equipo de entrega y asignacion de vehiculos.</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nombre</label>
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telefono</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Vehiculo asignado</label>
                <select
                  value={form.currentVehicleId ?? ''}
                  onChange={(e) => setForm({ ...form, currentVehicleId: e.target.value || null })}
                  className={inputClass}
                >
                  <option value="">Sin vehiculo</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.licensePlate} - {v.model}</option>
                  ))}
                </select>
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
        ) : couriers.length === 0 ? (
          <div className={emptyBoxClass}><p>No hay repartidores registrados.</p></div>
        ) : (
          <table className="min-w-full border-2 border-on-surface">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Telefono</th>
                <th className={thClass}>Vehiculo</th>
                <th className={thClass}>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((c) => (
                <tr key={c.id}>
                  <td className={tdClass}>{c.fullName}</td>
                  <td className={tdClass}>{c.phone}</td>
                  <td className={tdClass}>{c.currentVehicle?.licensePlate ?? '-'}</td>
                  <td className={tdClass}>{c.isAvailable ? 'Si' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Couriers;
