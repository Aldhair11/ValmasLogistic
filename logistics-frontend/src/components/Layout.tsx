import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, PackagePlus, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifyInfo } from '../lib/notify';

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
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
