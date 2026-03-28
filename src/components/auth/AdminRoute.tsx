import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/app-store';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const user = useAppStore((state) => state.user);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
