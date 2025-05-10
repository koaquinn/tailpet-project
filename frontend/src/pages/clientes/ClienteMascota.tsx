// src/pages/clientes/ClienteMascotas.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  IconButton,
  TablePagination,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Pets as PetsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  MedicalServices as HealthIcon,
  Vaccines as VaccineIcon,
  MonitorWeight as WeightIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getCliente, getMascotasByCliente } from '../../api/clienteApi';
import { getEspecie, getRaza } from '../../api/mascotaApi';
import { Mascota } from '../../types/mascota';
import { Cliente } from '../../types/cliente';
import { sexoToText, booleanToText, calculateAge } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface MascotaEnriquecida extends Mascota {
  especieNombre?: string;
  razaNombre?: string;
}

const ClienteMascotas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  // Permisos según roles
  const canEdit = hasRole('ADMIN') || hasRole('RECEPCIONISTA');
  const canViewMedical = hasRole('ADMIN') || hasRole('VETERINARIO');
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [mascotas, setMascotas] = useState<MascotaEnriquecida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Memoizar los manejadores de eventos para evitar recreaciones innecesarias
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos del cliente y sus mascotas en paralelo
      const [clienteData, mascotasData] = await Promise.all([
        getCliente(clienteId),
        getMascotasByCliente(clienteId)
      ]);

      // Optimización: extraer IDs únicos para evitar llamadas duplicadas
      const especiesIds = Array.from(new Set(mascotasData.results.map(m => m.especie)));
      const razasIds = Array.from(new Set(mascotasData.results.map(m => m.raza)));
      
      // Obtener todas las especies y razas necesarias en una sola vez
      const [especiesList, razasList] = await Promise.all([
        Promise.all(especiesIds.map(id => getEspecie(id))),
        Promise.all(razasIds.map(id => getRaza(id)))
      ]);
      
      // Crear mapas para acceso rápido
      const especiesMap = new Map(especiesList.map(e => [e.id, e.nombre]));
      const razasMap = new Map(razasList.map(r => [r.id, r.nombre]));
      
      // Enriquecer mascotas con nombres de especie y raza usando los mapas
      const mascotasEnriquecidas = mascotasData.results.map(mascota => ({
        ...mascota,
        especieNombre: especiesMap.get(mascota.especie) || 'Desconocido',
        razaNombre: razasMap.get(mascota.raza) || 'Desconocida'
      }));

      setCliente(clienteData);
      setMascotas(mascotasEnriquecidas);
    } catch (err) {
      console.error('Error al cargar los datos:', err);
      setError('Error al cargar los datos del cliente y sus mascotas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clienteId]);

  // Memoizar las mascotas paginadas para evitar recálculos innecesarios
  const mascotasPaginadas = useMemo(() => 
    mascotas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
  [mascotas, page, rowsPerPage]);

  // Renderizados condicionales
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert 
          severity="error" 
          sx={{ my: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchData}
              startIcon={<RefreshIcon />}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!cliente) {
    return <Alert severity="warning">Cliente no encontrado</Alert>;
  }

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs y título */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link to="/clientes" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Clientes</Typography>
          </Link>
          <Typography color="text.primary">
            {cliente.nombre} {cliente.apellido}
          </Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            <PetsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Mascotas de {cliente.nombre} {cliente.apellido}
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/clientes')}
              sx={{ mr: 2 }}
            >
              Volver
            </Button>
            
            {canEdit && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/mascotas/nuevo?clienteId=${clienteId}`)}
              >
                Nueva Mascota
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Información del cliente */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información del Cliente
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={4}>
          <Box>
            <Typography variant="subtitle1">
              <strong>Nombre:</strong> {cliente.nombre} {cliente.apellido}
            </Typography>
            <Typography variant="subtitle1">
              <strong>RUT:</strong> {cliente.rut}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">
              <strong>Teléfono:</strong> {cliente.telefono || 'No registrado'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Email:</strong> {cliente.email || 'No registrado'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              <strong>Estado:</strong>
              <Chip
                label={cliente.activo ? 'Activo' : 'Inactivo'}
                color={cliente.activo ? 'success' : 'error'}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Lista de mascotas */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Especie</TableCell>
                <TableCell>Raza</TableCell>
                <TableCell>Edad</TableCell>
                <TableCell>Sexo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mascotas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No se encontraron mascotas registradas para este cliente
                    </Typography>
                    {canEdit && (
                      <Button
                        variant="text"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/mascotas/nuevo?clienteId=${clienteId}`)}
                        sx={{ mt: 1 }}
                      >
                        Agregar primera mascota
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                mascotasPaginadas.map((mascota) => (
                  <TableRow key={mascota.id} hover>
                    <TableCell>{mascota.nombre}</TableCell>
                    <TableCell>{mascota.especieNombre}</TableCell>
                    <TableCell>{mascota.razaNombre}</TableCell>
                    <TableCell>
                      {calculateAge(mascota.fecha_nacimiento)} años
                    </TableCell>
                    <TableCell>
                      {sexoToText(mascota.sexo)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={mascota.activo ? 'Activo' : 'Inactivo'}
                        color={mascota.activo ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {canEdit && mascota.id && (
                          <Tooltip title="Editar mascota">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/mascotas/editar/${mascota.id}`)}
                              aria-label="Editar mascota"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canViewMedical && mascota.id && (
                          <Tooltip title="Historial médico">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => navigate(`/mascotas/${mascota.id}/historial`)}
                              aria-label="Historial médico"
                            >
                              <HealthIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canViewMedical && mascota.id && (
                          <Tooltip title="Vacunas">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/mascotas/${mascota.id}/vacunas`)}
                              aria-label="Vacunas"
                            >
                              <VaccineIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {mascota.id && (
                          <Tooltip title="Registro de peso">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => navigate(`/mascotas/${mascota.id}/peso`)}
                              aria-label="Registro de peso"
                            >
                              <WeightIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {mascotas.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={mascotas.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Mascotas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count}`
            }
          />
        )}
      </Paper>
    </Container>
  );
};

export default ClienteMascotas;