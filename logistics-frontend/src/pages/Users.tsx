import { useCallback, useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import { UserService, type StaffUserDto } from '../services/api';
import { notifyError } from '../lib/notify';
import type { PagedResult } from '../types';
import {
  emptyBoxClass,
  loadingBoxClass,
  pageSubtitleClass,
  pageTitleClass,
  tableWrapperClass,
  tdClass,
  thClass,
} from './masters/shared';

const roleLabel: Record<string, string> = { Admin: 'Administrador', Worker: 'Operador' };

function Users() {
  const [paged, setPaged] = useState<PagedResult<StaffUserDto> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setPaged(await UserService.getPage({ page: 1, pageSize: 50, search: '' }));
    } catch (err) {
      setPaged(null);
      notifyError(err, 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const users = paged?.items ?? [];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <UserCog className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className={pageTitleClass}>Usuarios</h1>
        </div>
        <p className={pageSubtitleClass}>Listado de cuentas del sistema.</p>
      </header>

      <div className={tableWrapperClass}>
        {loading ? (
          <div className={loadingBoxClass}><div className="h-10 w-10 animate-pulse border-2 border-on-surface bg-surface shadow-brutal" /></div>
        ) : users.length === 0 ? (
          <div className={emptyBoxClass}><p>No hay usuarios registrados.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-on-surface">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className={thClass}>Usuario</th>
                  <th className={thClass}>Rol</th>
                  <th className={thClass}>Sucursal</th>
                  <th className={thClass}>Estado</th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className={`${tdClass} font-mono`}>{user.username}</td>
                    <td className={tdClass}>{roleLabel[user.role] ?? user.role}</td>
                    <td className={tdClass}>{user.branchName ?? '-'}</td>
                    <td className={tdClass}>{user.isActive ? 'Activo' : 'Inactivo'}</td>
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

export default Users;
