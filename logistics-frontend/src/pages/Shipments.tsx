import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Package } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import RoleGuard from '../components/RoleGuard';
import { notifyError } from '../lib/notify';
import { ShipmentService } from '../services/api';
import type { PagedResult, ShipmentDto } from '../types';
import {
  emptyBoxClass,
  loadingBoxClass,
  pageSubtitleClass,
  pageTitleClass,
  tableWrapperClass,
  tdClass,
  thClass,
} from './masters/shared';

const dateFormatter = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

function Shipments() {
  const [paged, setPaged] = useState<PagedResult<ShipmentDto> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ShipmentService.getAll({ page: 1, pageSize: 20, search: '' });
      setPaged(data);
    } catch (err) {
      setPaged(null);
      notifyError(err, 'No se pudieron cargar los envios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadShipments(); }, [loadShipments]);

  const shipments = paged?.items ?? [];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Package className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className={pageTitleClass}>Envios</h1>
        </div>
        <p className={pageSubtitleClass}>Listado general de envios del sistema.</p>
      </header>

      <div className={tableWrapperClass}>
        {loading ? (
          <div className={loadingBoxClass}>
            <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
          </div>
        ) : shipments.length === 0 ? (
          <div className={emptyBoxClass}><p>No hay envios registrados.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-on-surface">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className={thClass}>Tracking</th>
                  <th className={thClass}>Remitente</th>
                  <th className={thClass}>Destino</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Fecha</th>
                  <th className={`${thClass} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-surface-container-low">
                    <td className={`${tdClass} font-mono`}>{shipment.trackingNumber}</td>
                    <td className={tdClass}>{shipment.senderName ?? '-'}</td>
                    <td className={tdClass}>{shipment.destination.city}, {shipment.destination.state}</td>
                    <td className={tdClass}><StatusBadge status={shipment.status} /></td>
                    <td className={tdClass}>{dateFormatter.format(new Date(shipment.createdAt))}</td>
                    <td className={`${tdClass} text-right`}>
                      <Link to={`/shipments/${shipment.id}`} className="inline-flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-surface shadow-brutal-sm" title="Ver detalle">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
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

function ShipmentsPage() {
  return (
    <RoleGuard allowedRoles={['Admin', 'Worker']}>
      <Shipments />
    </RoleGuard>
  );
}

export default ShipmentsPage;
