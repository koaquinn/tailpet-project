// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Layouts
import Layout from './components/layout/Layout';

// Páginas
import LoginPage from './pages/auth/PaginaLogin';
import ForbiddenPage from './pages/auth/ForbiddenPage';
import DashboardPage from './pages/Dashboard';
import ClientesList from './pages/clientes/ClientesLIst';
import ClienteForm from './pages/clientes/ClienteForm';
import MascotasList from './pages/mascotas/MascotasList';
import MascotaForm from './pages/mascotas/MascotaForm';
import UsersPage from './pages/admin/UserPage';
import ClienteMascotas from './pages/clientes/ClienteMascota';
// Constantes de roles
const ADMIN = 'ADMIN';
const VETERINARIO = 'VETERINARIO';
const RECEPCIONISTA = 'RECEPCIONISTA';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Rutas de Clientes */}
            <Route
              path="clientes"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA]}>
                  <ClientesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="clientes/nuevo"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA]}>
                  <ClienteForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="clientes/editar/:id"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA]}>
                  <ClienteForm />
                </ProtectedRoute>
              }
            />
            {/* Ruta para ver las mascotas de un cliente */}
            <Route
              path="clientes/:id/mascotas"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA, VETERINARIO]}>
                  <ClienteMascotas />
                </ProtectedRoute>
              }
            />

            {/* Rutas de Mascotas */}
            <Route
              path="mascotas"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA, VETERINARIO]}>
                  <MascotasList />
                </ProtectedRoute>
              }
            />
            <Route
              path="mascotas/nuevo"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA]}>
                  <MascotaForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="mascotas/editar/:id"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA]}>
                  <MascotaForm />
                </ProtectedRoute>
              }
            />

            {/* Rutas de Administración */}
            <Route
              path="admin/usuarios"
              element={
                <ProtectedRoute requiredRoles={[ADMIN]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Ruta de fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;