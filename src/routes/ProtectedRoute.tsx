import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { EstadoCarregamento } from '../components/shared/Estados.tsx';
export function ProtectedRoute() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <EstadoCarregamento texto="Verificando sua sessão…" />;
  if (!usuario || usuario.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
