import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bike,
  Building2,
  Car,
  LayoutDashboard,
  LogOut,
  Package,
  PackagePlus,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifyInfo } from '../lib/notify';
import RoleGuard from './RoleGuard';

const SIDEBAR_WIDTH_CLASS = 'w-64';
const SIDEBAR_OFFSET_CLASS = 'lg:ml-64';

function sidebarLinkClass(isActive: boolean) {
  return `brutalist-sidebar-link ${isActive ? 'brutalist-sidebar-link-active' : ''}`;
}

function Layout() {
  const { logout, role, user } = useAuth();
  const navigate = useNavigate();
  const isClient = role === 'Client';

  const handleLogout = () => {
    const username = user?.username;
    logout();
    notifyInfo(
      username ? `¡Hasta pronto, ${username}!` : '¡Hasta pronto!',
      'Has cerrado sesión correctamente. Te esperamos de vuelta.',
    );
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface print:block">
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen ${SIDEBAR_WIDTH_CLASS} flex-col border-r-2 border-on-surface bg-surface-container-low lg:flex print:hidden`}
      >
        <div className="border-b-2 border-on-surface p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal-sm">
              <Truck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-extrabold uppercase tracking-tight">
              Valmas Logistics
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Navegación principal">
          <NavLink to="/dashboard" end className={({ isActive }) => sidebarLinkClass(isActive)}>
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            {isClient ? 'Mis Envíos' : 'Dashboard'}
          </NavLink>
          <NavLink
            to="/shipments/new"
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <PackagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            {isClient ? 'Programar Recojo' : 'Nuevo Envío'}
          </NavLink>

          <RoleGuard allowedRoles={['Admin', 'Worker']}>
            <NavLink
              to="/shipments/list"
              className={({ isActive }) => sidebarLinkClass(isActive)}
            >
              <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
              Envíos
            </NavLink>
            <NavLink
              to="/cash"
              className={({ isActive }) => sidebarLinkClass(isActive)}
            >
              <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
              Caja
            </NavLink>
            <div className="my-2 border-t-2 border-on-surface" aria-hidden="true" />
            <NavLink
              to="/masters/customers"
              className={({ isActive }) => sidebarLinkClass(isActive)}
            >
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              Clientes
            </NavLink>
            <NavLink
              to="/masters/vehicles"
              className={({ isActive }) => sidebarLinkClass(isActive)}
            >
              <Car className="h-4 w-4 shrink-0" aria-hidden="true" />
              Vehículos
            </NavLink>
            <NavLink
              to="/masters/couriers"
              className={({ isActive }) => sidebarLinkClass(isActive)}
            >
              <Bike className="h-4 w-4 shrink-0" aria-hidden="true" />
              Repartidores
            </NavLink>
            <RoleGuard allowedRoles={['Admin']}>
              <NavLink
                to="/masters/branches"
                className={({ isActive }) => sidebarLinkClass(isActive)}
              >
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sucursales
              </NavLink>
            </RoleGuard>
            <RoleGuard allowedRoles={['Admin']}>
              <NavLink
                to="/users"
                className={({ isActive }) => sidebarLinkClass(isActive)}
              >
                <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
                Usuarios
              </NavLink>
            </RoleGuard>
          </RoleGuard>
        </nav>

        <div className="shrink-0 border-t-2 border-on-surface p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="brutalist-sidebar-link w-full text-left hover:bg-red-100"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className={`flex min-h-screen min-w-0 flex-col ${SIDEBAR_OFFSET_CLASS}`}>
        <header className="border-b-2 border-on-surface bg-background print:hidden">
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="flex h-8 w-8 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal-sm">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-extrabold uppercase tracking-tight">
                  Valmas Logistics
                </span>
              </div>
              <p className="hidden text-xs font-bold uppercase tracking-widest text-on-surface-muted lg:block">
                Panel operativo
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="brutalist-button-secondary px-3 py-2 text-xs lg:hidden"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Salir
              </button>
            </div>

            <nav
              className="flex flex-wrap gap-2 lg:hidden"
              aria-label="Navegación móvil"
            >
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  isActive ? 'brutalist-button-primary px-3 py-2 text-xs' : 'brutalist-button-secondary px-3 py-2 text-xs'
                }
              >
                {isClient ? 'Mis Envíos' : 'Inicio'}
              </NavLink>
              <NavLink
                to="/shipments/new"
                className={({ isActive }) =>
                  isActive ? 'brutalist-button-primary px-3 py-2 text-xs' : 'brutalist-button-secondary px-3 py-2 text-xs'
                }
              >
                {isClient ? 'Recojo' : 'Nuevo'}
              </NavLink>
              <RoleGuard allowedRoles={['Admin', 'Worker']}>
                <NavLink
                  to="/shipments/list"
                  className={({ isActive }) =>
                    isActive ? 'brutalist-button-primary px-3 py-2 text-xs' : 'brutalist-button-secondary px-3 py-2 text-xs'
                  }
                >
                  Envíos
                </NavLink>
                <NavLink
                  to="/cash"
                  className={({ isActive }) =>
                    isActive ? 'brutalist-button-primary px-3 py-2 text-xs' : 'brutalist-button-secondary px-3 py-2 text-xs'
                  }
                >
                  Caja
                </NavLink>
                <NavLink
                  to="/masters/customers"
                  className={({ isActive }) =>
                    isActive ? 'brutalist-button-primary px-3 py-2 text-xs' : 'brutalist-button-secondary px-3 py-2 text-xs'
                  }
                >
                  Clientes
                </NavLink>
              </RoleGuard>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
