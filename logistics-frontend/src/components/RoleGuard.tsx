import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;
