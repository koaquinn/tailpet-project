// src/App.tsx (actualizado)
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

// Clientes
import ClientesList from './pages/clientes/ClientesLIst';
import ClienteForm from './pages/clientes/ClienteForm';
import ClienteMascotas from './pages/clientes/ClienteMascota';

// Mascotas
import MascotasList from './pages/mascotas/MascotasList';
import MascotaForm from './pages/mascotas/MascotaForm';
import HistorialMascota from './pages/historial/HistorialMascota';

// Historial y Vacunas
import RegistrarVacuna from './pages/historial/RegistrarVacuna';
import VacunaDetalle from './pages/historial/VacunaDetalle';
import EditarVacuna from './pages/historial/EditarVacuna';

// Citas
import CitasList from './pages/citas/CitasList';
import CitaForm from './pages/citas/CitaForm';
import ConsultaPanel from './pages/citas/ConsultaPanel';

// Inventario
import InventarioList from './pages/inventario/InventarioList';
import AgregarInventario from './pages/inventario/AgregarInventario';

// Facturación
import FacturasList from './pages/facturacion/FacturasList';
import FacturaDetalle from './pages/facturacion/FacturaDetalle';

// Admin
import UsersPage from './pages/admin/UserPage';

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
            <Route
              path="mascotas/:id/historial"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA, VETERINARIO]}>
                  <HistorialMascota />
                </ProtectedRoute>
              }
            />

            {/* Rutas de Vacunas */}
            <Route
              path="mascotas/:mascotaId/vacunas/nuevo"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, VETERINARIO]}>
                  <RegistrarVacuna />
                </ProtectedRoute>
              }
            />
            <Route
              path="mascotas/:mascotaId/vacunas/:vacunaId"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA, VETERINARIO]}>
                  <VacunaDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="mascotas/:mascotaId/vacunas/editar/:vacunaId"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, VETERINARIO]}>
                  <EditarVacuna />
                </ProtectedRoute>
              }
            />

            {/* Rutas de Citas */}
            <Route
              path="citas"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA, VETERINARIO]}>
                  <CitasList />
                </ProtectedRoute>
              }
            />
            <Route
              path="citas/nueva"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA, VETERINARIO]}>
                  <CitaForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="citas/:id"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA, VETERINARIO]}>
                  <CitaForm />
                </ProtectedRoute>
              }
            />
            {/* Nueva ruta para el panel de consulta */}
            <Route
              path="citas/consulta/:id"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, VETERINARIO]}>
                  <ConsultaPanel />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas de Inventario */}
            <Route
              path="inventario"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, VETERINARIO]}>
                  <InventarioList />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventario/agregar"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, VETERINARIO]}>
                  <AgregarInventario />
                </ProtectedRoute>
              } 
            />

            {/* Rutas de Facturación */}
            <Route
              path="facturacion"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA]}>
                  <FacturasList />
                </ProtectedRoute>
              }
            />
            <Route
              path="facturacion/:id"
              element={
                <ProtectedRoute requiredRoles={[ADMIN, RECEPCIONISTA]}>
                  <FacturaDetalle />
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