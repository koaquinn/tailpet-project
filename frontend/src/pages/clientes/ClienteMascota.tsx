// src/pages/clientes/ClienteMascotas.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Box, Chip, CircularProgress,
  Alert, Breadcrumbs, IconButton, TablePagination, Tooltip, Divider,
  Card, CardContent, Grid, useMediaQuery, useTheme, Menu, MenuItem,
  ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Pets as PetsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  MedicalServices as HealthIcon,
  Vaccines as VaccineIcon,
  MonitorWeight as WeightIcon,
  Event as EventIcon,
  MoreVert as MoreIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { getCliente, getMascotasByCliente } from '../../api/clienteApi';
import { getEspecie, getRaza } from '../../api/mascotaApi';
import { Mascota } from '../../types/mascota';
import { Cliente } from '../../types/cliente';
import { sexoToText, booleanToText, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

// Función mejorada para calcular la edad correctamente con años y meses
const calculateAgeImproved = (fechaNacimiento: string | null | undefined): string => {
  if (!fechaNacimiento) return 'N/A';
  
  const birthDate = new Date(fechaNacimiento);
  const today = new Date();
  
  // Validar fecha
  if (isNaN(birthDate.getTime())) return 'Fecha inválida';
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  // Ajustar si no hemos llegado aún al mes de cumpleaños
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  // Formatear la respuesta según corresponda
  if (years > 0) {
    if (months > 0) {
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  } else {
    if (months > 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    // Si es menor a un mes
    const days = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} ${days === 1 ? 'día' : 'días'}`;
  }
};

interface MascotaEnriquecida extends Mascota {
  especieNombre?: string;
  razaNombre?: string;
  edad?: string;
}

const ClienteMascotas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const clienteId = id ? Number(id) : 0; // Manejo seguro de id
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, hasRole } = useAuth();

  // Permisos según roles
  const canEdit = hasRole('ADMIN') || hasRole('RECEPCIONISTA');
  const canViewMedical = hasRole('ADMIN') || hasRole('VETERINARIO');
  const canDelete = hasRole('ADMIN');

  // Estados para datos
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [mascotas, setMascotas] = useState<MascotaEnriquecida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la UI
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMascotaId, setSelectedMascotaId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [exportOptionOpen, setExportOptionOpen] = useState(false);
  const [exportEmail, setExportEmail] = useState('');

  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Manejadores para UI
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, mascotaId: number) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedMascotaId(mascotaId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setConfirmDeleteOpen(true);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    // Aquí iría la lógica para eliminar la mascota
    showNotification(`Esta función no está implementada aún.`, 'info');
  };

  const handleExportClick = () => {
    handleMenuClose();
    setExportOptionOpen(true);
  };

  const handleExportCancel = () => {
    setExportOptionOpen(false);
  };

  const handleExportSubmit = () => {
    setExportOptionOpen(false);
    showNotification(`Historial enviado a ${exportEmail}`, 'success');
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Navegación
  const goToMascotaDetail = (mascotaId: number) => {
    navigate(`/mascotas/editar/${mascotaId}?fromClientView=true&clienteId=${clienteId}`);
  };

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Función para refrescar datos
  const fetchData = async (showRefreshIndicator = true) => {
    if (!clienteId) {
      setError('ID de cliente no válido');
      setLoading(false);
      return;
    }

    try {
      if (showRefreshIndicator) setRefreshing(true);
      setError(null);

      // Obtener datos del cliente y sus mascotas en paralelo
      const [clienteData, mascotasData] = await Promise.all([
        getCliente(clienteId),
        getMascotasByCliente(clienteId)
      ]);

      if (!mascotasData.results) {
        throw new Error('No se recibieron datos de mascotas válidos');
      }

      // Optimización: extraer IDs únicos para evitar llamadas duplicadas
      const especiesIds = Array.from(
        new Set(mascotasData.results.map(m => m.especie).filter(Boolean))
      );
      const razasIds = Array.from(
        new Set(mascotasData.results.map(m => m.raza).filter(Boolean))
      );

      // Obtener todas las especies y razas necesarias en una sola vez
      const especiesList = especiesIds.length > 0 
        ? await Promise.all(especiesIds.map(id => getEspecie(id)))
        : [];
      
      const razasList = razasIds.length > 0
        ? await Promise.all(razasIds.map(id => getRaza(id)))
        : [];

      // Crear mapas para acceso rápido
      const especiesMap = new Map(especiesList.map(e => [e.id, e.nombre]));
      const razasMap = new Map(razasList.map(r => [r.id, r.nombre]));

      // Enriquecer mascotas con nombres de especie y raza usando los mapas
      const mascotasEnriquecidas = mascotasData.results.map(mascota => ({
        ...mascota,
        especieNombre: mascota.especie ? especiesMap.get(mascota.especie) || 'Desconocido' : 'Desconocido',
        razaNombre: mascota.raza ? razasMap.get(mascota.raza) || 'Desconocida' : 'Desconocida',
        edad: calculateAgeImproved(mascota.fecha_nacimiento)
      }));

      setCliente(clienteData);
      setMascotas(mascotasEnriquecidas);
    } catch (err) {
      console.error('Error al cargar los datos:', err);
      setError('Error al cargar los datos del cliente y sus mascotas');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (clienteId) {
      fetchData(false);
    }
  }, [clienteId]);

  // Memoizar las mascotas paginadas para evitar recálculos innecesarios
  const mascotasPaginadas = useMemo(() =>
    mascotas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [mascotas, page, rowsPerPage]);

  // Renderizados condicionales
  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Barra de navegación superior */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link to="/clientes" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Clientes</Typography>
          </Link>
          <Typography color="text.primary">
            {cliente?.nombre} {cliente?.apellido}
          </Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
            <PetsIcon sx={{ fontSize: 32, mr: 1 }} />
            Mascotas de {cliente?.nombre} {cliente?.apellido}
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

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => fetchData()}
              startIcon={<RefreshIcon />}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Información del cliente */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom color="primary">
            Información del Cliente
          </Typography>

          {canEdit && (
            <Tooltip title="Editar cliente">
              <IconButton
                size="small"
                color="primary"
                onClick={() => navigate(`/clientes/editar/${clienteId}`)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Datos Personales
              </Typography>
              <Typography variant="body1">
                <strong>Nombre:</strong> {cliente?.nombre} {cliente?.apellido}
              </Typography>
              <Typography variant="body1">
                <strong>RUT:</strong> {cliente?.rut || 'No registrado'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Contacto
              </Typography>
              <Typography variant="body1">
                <strong>Teléfono:</strong> {cliente?.telefono || 'No registrado'}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {cliente?.email || 'No registrado'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Estado y Detalles
              </Typography>
              <Box display="flex" alignItems="center">
                <Typography variant="body1" mr={1}>
                  <strong>Estado:</strong>
                </Typography>
                <Chip
                  label={cliente?.activo ? 'Activo' : 'Inactivo'}
                  color={cliente?.activo ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Typography variant="body1">
                <strong>Total Mascotas:</strong> {mascotas.length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de mascotas */}
      <Paper elevation={3}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" color="primary">
            Mascotas Registradas
          </Typography>

          <Box>
            <Tooltip title="Actualizar">
              <IconButton
                onClick={() => fetchData()}
                disabled={refreshing}
                color="primary"
                size="small"
                sx={{ mr: 1 }}
              >
                {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>

            {canEdit && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/mascotas/nuevo?clienteId=${clienteId}`)}
              >
                Agregar
              </Button>
            )}
          </Box>
        </Box>

        {isMobile ? (
          // Vista móvil con tarjetas
          <Box p={2}>
            {mascotas.length === 0 ? (
              <Card variant="outlined" sx={{ textAlign: 'center', py: 4 }}>
                <CardContent>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
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
                </CardContent>
              </Card>
            ) : (
              <>
                {mascotasPaginadas.map((mascota) => (
                  <Card
                    key={mascota.id}
                    variant="outlined"
                    sx={{ mb: 2, cursor: 'pointer' }}
                    onClick={() => mascota.id && navigate(`/mascotas/editar/${mascota.id}`)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">{mascota.nombre}</Typography>
                        <Chip
                          label={mascota.activo ? 'Activo' : 'Inactivo'}
                          color={mascota.activo ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Especie:</strong> {mascota.especieNombre}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Raza:</strong> {mascota.razaNombre}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Edad:</strong> {mascota.edad}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Sexo:</strong> {sexoToText(mascota.sexo)}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box display="flex" justifyContent="center" mt={2} gap={1}>
                        {canEdit && mascota.id && (
                          <Tooltip title="Editar mascota">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/mascotas/editar/${mascota.id}?fromClientView=true&clienteId=${clienteId}`);
                              }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/mascotas/${mascota.id}/historial`);
                              }}
                            >
                              <HealthIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (mascota.id) handleMenuOpen(e, mascota.id);
                            }}
                          >
                            <MoreIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={mascotas.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            )}
          </Box>
        ) : (
          // Vista desktop con tabla
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Especie</TableCell>
                  <TableCell>Raza</TableCell>
                  <TableCell>Edad</TableCell>
                  <TableCell>Sexo</TableCell>
                  <TableCell>Esterilizado</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mascotas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
                    <TableRow
                      key={mascota.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => mascota.id && goToMascotaDetail(mascota.id)}
                    >
                      <TableCell>{mascota.nombre}</TableCell>
                      <TableCell>{mascota.especieNombre}</TableCell>
                      <TableCell>{mascota.razaNombre}</TableCell>
                      <TableCell>{mascota.edad}</TableCell>
                      <TableCell>{sexoToText(mascota.sexo)}</TableCell>
                      <TableCell>
                        <Chip
                          label={booleanToText(mascota.esterilizado)}
                          color={mascota.esterilizado ? 'success' : 'default'}
                          size="small"
                        />
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/mascotas/editar/${mascota.id}?fromClientView=true&clienteId=${clienteId}`);
                                }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/mascotas/${mascota.id}/historial`);
                                }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/mascotas/${mascota.id}/vacunas`);
                                }}
                                aria-label="Vacunas"
                              >
                                <VaccineIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {mascota.id && (
                            <Tooltip title="Nueva consulta">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/citas/nueva?mascotaId=${mascota.id}`);
                                }}
                                aria-label="Nueva consulta"
                              >
                                <EventIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Más opciones">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (mascota.id) handleMenuOpen(e, mascota.id);
                              }}
                              aria-label="Más opciones"
                            >
                              <MoreIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

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
          </TableContainer>
        )}
      </Paper>

      {/* Menú de opciones adicionales */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedMascotaId) navigate(`/mascotas/${selectedMascotaId}/historial`);
        }}>
          <ListItemIcon>
            <HealthIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver historial médico</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedMascotaId) navigate(`/citas/nueva?mascotaId=${selectedMascotaId}`);
        }}>
          <ListItemIcon>
            <EventIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Agendar consulta</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleExportClick}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Enviar historial por email</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          handleMenuClose();
          showNotification('Función de impresión no implementada', 'info');
        }}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Imprimir ficha</ListItemText>
        </MenuItem>

        {canDelete && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Eliminar mascota</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete}>
        <DialogTitle sx={{ color: 'error.main' }}>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar esta mascota? Esta acción no se puede deshacer.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Se eliminarán todos los registros asociados, incluyendo el historial médico, vacunaciones y citas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para exportar historial */}
      <Dialog open={exportOptionOpen} onClose={handleExportCancel}>
        <DialogTitle>
          Enviar historial por email
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Ingrese el email al que desea enviar el historial médico
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={exportEmail}
            onChange={(e) => setExportEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExportCancel} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={handleExportSubmit}
            color="primary"
            variant="contained"
            disabled={!exportEmail || !exportEmail.includes('@')}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificación */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClienteMascotas;