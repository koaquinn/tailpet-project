// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = []
}) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Mientras verificamos el token, mostrar un loader ligero
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir al login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se requieren roles específicos
  if (requiredRoles.length > 0) {
    // hasRole ahora comprueba user.rol === role
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      // Si no tiene el rol necesario, acceso denegado
      return <Navigate to="/forbidden" replace />;
    }
  }

  // Si pasa todas las comprobaciones, renderiza los children
  return <>{children}</>;
};

export default ProtectedRoute;
