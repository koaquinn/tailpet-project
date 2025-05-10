// src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = []
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Mostrar un loader mientras verificamos el token
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir al login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se requieren roles específicos
  if (requiredRoles.length > 0) {
    // Comprobar si tiene alguno de los roles requeridos
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