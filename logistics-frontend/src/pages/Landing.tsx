import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  MapPin,
  Truck,
} from 'lucide-react';
import TrackingSearchBar from '../components/TrackingSearchBar';

function Landing() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTrackSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = trackingNumber.trim();
    if (!trimmed) return;
    navigate(`/track/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="border-b-2 border-on-surface bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold uppercase tracking-tight">
              Valmas Logistics
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="brutalist-nav-link">
              Iniciar sesión
            </Link>
            <Link to="/register" className="brutalist-nav-button">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b-2 border-on-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-block border-2 border-on-surface bg-surface-container-low px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-brutal-sm">
                Plataforma logística B2B y B2C
              </p>
              <h1 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl lg:text-6xl">
                Logística inteligente para tu negocio
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-on-surface-muted sm:text-lg">
                Centraliza envíos, recojos a domicilio y seguimiento en un solo
                lugar. Valmas Logistics conecta a tu equipo operativo con tus
                clientes de forma directa y segura.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register" className="brutalist-button-primary px-6 py-3">
                  Comienza ahora
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/login" className="brutalist-button-secondary px-6 py-3">
                  Ya tengo cuenta
                </Link>
              </div>

              <TrackingSearchBar
                id="hero-tracking"
                value={trackingNumber}
                onChange={setTrackingNumber}
                onSubmit={handleTrackSubmit}
                className="mx-auto mt-8 max-w-xl"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
                Operación de alto impacto
              </h2>
              <p className="mt-2 text-sm font-medium text-on-surface-muted">
                Módulos diseñados para equipos que necesitan control, velocidad y
                trazabilidad sin fricción.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="bento-cell md:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl">
                    <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal-sm">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
                      Control total B2B
                    </h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-on-surface-muted">
                      Gestión multi-sucursal con visibilidad centralizada de
                      envíos, asignaciones y validaciones operativas en tiempo
                      real.
                    </p>
                  </div>
                  <div className="border-2 border-on-surface bg-surface-container-low px-4 py-3 text-xs font-bold uppercase tracking-widest shadow-brutal-sm">
                    Multi-sucursal
                  </div>
                </div>
              </article>

              <article className="bento-cell-highlight aspect-square flex flex-col justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-primary bg-primary text-on-primary shadow-brutal-sm">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold uppercase tracking-tight">
                    Rastreo GPS
                  </h3>
                  <p className="mt-2 text-sm font-medium text-on-surface-muted">
                    Seguimiento preciso del paquete en cada etapa del recorrido.
                  </p>
                </div>
              </article>

              <article className="bento-cell aspect-square flex flex-col justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-on-surface bg-surface text-on-surface shadow-brutal-sm">
                  <Truck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold uppercase tracking-tight">
                    Flota inteligente
                  </h3>
                  <p className="mt-2 text-sm font-medium text-on-surface-muted">
                    Optimiza repartidores, vehículos y rutas con datos
                    operativos accionables.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-on-surface py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs font-bold uppercase tracking-widest text-on-surface-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Valmas Logistics
        </div>
      </footer>
    </div>
  );
}

export default Landing;
