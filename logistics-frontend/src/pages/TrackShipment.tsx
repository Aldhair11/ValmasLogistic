import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { ShipmentService } from '../services/api';
import { notifyError } from '../lib/notify';
import StatusBadge from '../components/StatusBadge';
import BrutalistTrackTimeline from '../components/BrutalistTrackTimeline';
import TrackingSearchBar from '../components/TrackingSearchBar';
import type { PublicShipmentDto } from '../types';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'long',
  timeStyle: 'short',
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter.format(date);
}

function TrackShipment() {
  const { trackingNumber: routeTrackingNumber } = useParams<{
    trackingNumber: string;
  }>();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState(routeTrackingNumber ?? '');
  const [shipment, setShipment] = useState<PublicShipmentDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipment = useCallback(async (trackingNumber: string) => {
    if (!trackingNumber.trim()) {
      setLoading(false);
      setShipment(null);
      setError('Número de tracking no válido.');
      return;
    }

    setLoading(true);
    try {
      const data = await ShipmentService.track(trackingNumber.trim());
      setShipment(data);
      setError(null);
    } catch (err) {
      setShipment(null);
      const message = 'No encontramos un envío con ese número de tracking.';
      setError(message);
      notifyError(err, message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeTrackingNumber) {
      setSearchValue(routeTrackingNumber);
      void fetchShipment(routeTrackingNumber);
    } else {
      setLoading(false);
    }
  }, [routeTrackingNumber, fetchShipment]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    navigate(`/track/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-surface-container-low px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="bento-cell text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            Rastreo de envío
          </h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted">
            Consulta el estado de tu paquete en tiempo real.
          </p>

          <TrackingSearchBar
            id="track-page-search"
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-6 max-w-xl"
          />
        </section>

        {loading ? (
          <div
            className="bento-cell flex items-center justify-center py-16"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-3 text-on-surface-muted">
              <div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" />
              <p className="text-sm font-bold uppercase tracking-wide">
                Buscando tu envío...
              </p>
            </div>
          </div>
        ) : error || !shipment ? (
          <div
            role="alert"
            className="border-2 border-on-surface bg-amber-100 p-6 shadow-brutal"
          >
            <h2 className="text-lg font-extrabold uppercase tracking-tight">
              Envío no encontrado
            </h2>
            <p className="mt-2 text-sm font-medium">
              {error ?? 'No encontramos un envío con ese número de tracking.'}
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-on-surface-muted">
              Verifica el número e intenta de nuevo.
            </p>
            <Link
              to="/"
              className="brutalist-button-secondary mt-5 inline-flex"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            <section className="bento-cell space-y-8">
              <div className="border-b-2 border-on-surface pb-6 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                  Número de tracking
                </p>
                <p className="mt-2 font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {shipment.trackingNumber}
                </p>
                <div className="mt-4 flex justify-center">
                  <StatusBadge status={shipment.status} />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-on-surface-muted">
                  Creado el {formatDate(shipment.createdAt)}
                </p>
              </div>

              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                  Estado del envío
                </p>
                <BrutalistTrackTimeline status={shipment.status} />
              </div>

              <div className="grid grid-cols-1 gap-4 border-t-2 border-on-surface pt-6 sm:grid-cols-2">
                <div className="border-2 border-on-surface bg-surface-container-low p-4 shadow-brutal-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                    Origen
                  </p>
                  <p className="mt-2 text-lg font-extrabold uppercase">
                    {shipment.originCity}
                  </p>
                </div>
                <div className="border-2 border-on-surface bg-surface-container-low p-4 shadow-brutal-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                    Destino
                  </p>
                  <p className="mt-2 text-lg font-extrabold uppercase">
                    {shipment.destinationCity}
                  </p>
                </div>
                <div className="border-2 border-on-surface bg-surface p-4 shadow-brutal-sm sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-muted">
                    Peso
                  </p>
                  <p className="mt-2 text-lg font-extrabold">
                    {shipment.weightInKg} kg
                  </p>
                </div>
              </div>
            </section>

            <p className="text-center text-xs font-bold uppercase tracking-wide text-on-surface-muted">
              ¿Tu paquete tarda más de lo esperado? Contacta al remitente con tu
              número de tracking.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default TrackShipment;
