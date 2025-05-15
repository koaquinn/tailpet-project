// src/pages/historial/HistorialMascota.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Tabs, Tab, Button, Divider, Grid,
  Card, CardContent, CardActions, Chip, List, ListItem, ListItemText,
  Avatar, CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import {
  PetsOutlined as PetsIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  Healing as HealingIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Print as PrintIcon,
  EventNote as EventNoteIcon,
  MonitorWeight as WeightIcon
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMascota } from '../../api/mascotaApi';
import historialApi from '../../api/historialApi';
import { useAuth } from '../../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`historial-tabpanel-${index}`}
      aria-labelledby={`historial-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `historial-tab-${index}`,
    'aria-controls': `historial-tabpanel-${index}`,
  };
}

const HistorialMascota: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN') || hasRole('VETERINARIO');

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<any>(null);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [tratamientos, setTratamientos] = useState<any[]>([]);
  const [vacunaciones, setVacunaciones] = useState<any[]>([]);

  // Función segura para formatear fechas
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No registrada';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Fecha inválida';
      return format(date, 'PPP', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para formatear valores numéricos con unidades
  const formatNumber = (value: number | string | null | undefined, unit: string, decimals: number = 1) => {
    if (value === null || value === undefined || value === '') return 'No registrado';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(decimals)} ${unit}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Obtener datos de la mascota
        const mascotaData = await getMascota(parseInt(id));
        setMascota(mascotaData);

        // Intentar obtener el historial médico
        try {
          const historialResponse = await historialApi.getHistorialByMascota(parseInt(id));

          if (historialResponse && Array.isArray(historialResponse.results) && historialResponse.results.length > 0) {
            const historialData = historialResponse.results[0];
            setHistorial(historialData);

            // Intentar obtener consultas y tratamientos
            if (historialData.id) {
              try {
                const [consultasResponse, tratamientosResponse, vacunacionesResponse] = await Promise.all([
                  historialApi.getConsultasHistorial(historialData.id),
                  historialApi.getTratamientosHistorial(historialData.id),
                  historialApi.getVacunacionesByMascota(parseInt(id))
                ]);

                setConsultas(consultasResponse?.results || []);
                setTratamientos(tratamientosResponse?.results || []);
                setVacunaciones(vacunacionesResponse?.results || []);
              } catch (error) {
                console.error('Error al obtener registros médicos:', error);
                // Establecer arrays vacíos en caso de error pero permitir continuar
                setConsultas([]);
                setTratamientos([]);
                setVacunaciones([]);
              }
            }
          } else {
            setHistorial(null);
            // Intentar obtener solo vacunaciones
            const vacunacionesResponse = await historialApi.getVacunacionesByMascota(parseInt(id));
            setVacunaciones(vacunacionesResponse?.results || []);
          }
        } catch (error) {
          console.error('Error al obtener historial médico:', error);
          setHistorial(null);

          // Intentar obtener solo vacunaciones
          try {
            const vacunacionesResponse = await historialApi.getVacunacionesByMascota(parseInt(id));
            setVacunaciones(vacunacionesResponse?.results || []);
          } catch (vacError) {
            console.error('Error al obtener vacunaciones:', vacError);
            setVacunaciones([]);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos de la mascota y su historial médico');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const createHistorialMedico = async () => {
    if (!mascota || !mascota.id) return;

    try {
      setLoading(true);
      const newHistorial = await historialApi.createHistorial({
        mascota: mascota.id,
        fecha: new Date().toISOString(),
        observaciones: 'Historial médico inicial'
      });

      setHistorial(newHistorial);
      // Recargar la página para mostrar el nuevo historial
      window.location.reload();
    } catch (err) {
      console.error('Error al crear historial médico:', err);
      setError('Error al crear el historial médico');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button
            color="inherit"
            size="small"
            onClick={() => window.location.reload()}
            sx={{ ml: 2 }}
          >
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!mascota) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 2 }}>
          No se encontró la mascota
          <Button
            component={Link}
            to="/mascotas"
            color="inherit"
            size="small"
            sx={{ ml: 2 }}
          >
            Volver a mascotas
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to={`/clientes/${mascota.cliente}/mascotas`}
        >
          Volver a mascotas del cliente
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PetsIcon />
            </Avatar>
            <Typography variant="h5" component="h1">
              Historial Médico: {mascota.nombre}
            </Typography>
          </Box>

          <Box>
            {canEdit && historial && (
              <Tooltip title="Imprimir historial">
                <IconButton color="primary">
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              <strong>Dueño:</strong> {mascota.cliente_nombre || 'No registrado'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Especie:</strong> {mascota.especie_nombre || 'No registrada'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Raza:</strong> {mascota.raza_nombre || 'No registrada'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Microchip:</strong> {mascota.microchip || 'No registrado'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              <strong>Sexo:</strong> {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Fecha de nacimiento:</strong> {formatDate(mascota.fecha_nacimiento)}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Esterilizado:</strong> {mascota.esterilizado ? 'Sí' : 'No'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Estado:</strong>{' '}
              <Chip
                label={mascota.activo ? 'Activo' : 'Inactivo'}
                color={mascota.activo ? 'success' : 'error'}
                size="small"
              />
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {!historial ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Esta mascota aún no tiene historial médico
          </Typography>
          {canEdit && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={createHistorialMedico}
            >
              Crear Historial Médico
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab
                label="Consultas"
                icon={<MedicalIcon />}
                iconPosition="start"
                {...a11yProps(0)}
              />
              <Tab
                label="Tratamientos"
                icon={<HealingIcon />}
                iconPosition="start"
                {...a11yProps(1)}
              />
              <Tab
                label="Vacunas"
                icon={<AssignmentIcon />}
                iconPosition="start"
                {...a11yProps(2)}
              />
              <Tab
                label="Registro de Peso"
                icon={<WeightIcon />}
                iconPosition="start"
                {...a11yProps(3)}
              />
            </Tabs>

            {/* Pestaña de Consultas */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Historial de Consultas
                </Typography>

                {canEdit && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    component={Link}
                    to={`/citas/nueva?mascotaId=${mascota.id}`}
                  >
                    Nueva Consulta
                  </Button>
                )}
              </Box>

              {consultas.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Veterinario</TableCell>
                        <TableCell>Motivo</TableCell>
                        <TableCell>Diagnóstico</TableCell>
                        <TableCell>Signos Vitales</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consultas.map((consulta) => (
                        <TableRow key={consulta.id} hover>
                          <TableCell>{formatDate(consulta.fecha)}</TableCell>
                          <TableCell>{consulta.veterinario_nombre || 'No registrado'}</TableCell>
                          <TableCell>{consulta.motivo_consulta || 'No registrado'}</TableCell>
                          <TableCell>{consulta.diagnostico || 'No registrado'}</TableCell>
                          <TableCell>
                            {consulta.peso && <div>Peso: {formatNumber(consulta.peso, 'kg')}</div>}
                            {consulta.temperatura && <div>Temperatura: {formatNumber(consulta.temperatura, '°C')}</div>}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalles">
                              <IconButton size="small" color="primary">
                                <EventNoteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    No hay consultas registradas
                  </Typography>
                  {canEdit && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      component={Link}
                      to={`/citas/nueva?mascotaId=${mascota.id}`}
                      sx={{ mt: 1 }}
                    >
                      Registrar Consulta
                    </Button>
                  )}
                </Box>
              )}
            </TabPanel>

            {/* Pestaña de Tratamientos */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Historial de Tratamientos
                </Typography>

                {canEdit && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Nuevo Tratamiento
                  </Button>
                )}
              </Box>

              {tratamientos.length > 0 ? (
                <Grid container spacing={3}>
                  {tratamientos.map((tratamiento) => (
                    <Grid item xs={12} md={6} key={tratamiento.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Tratamiento del {formatDate(tratamiento.inicio_tratamiento)}
                          </Typography>
                          <Typography color="textSecondary" gutterBottom>
                            Duración: {tratamiento.duracion || 'No especificada'}
                          </Typography>

                          <Divider sx={{ my: 1 }} />

                          <Typography variant="body2" gutterBottom>
                            <strong>Descripción:</strong> {tratamiento.descripcion || 'No especificada'}
                          </Typography>

                          <Typography variant="body2" gutterBottom>
                            <strong>Instrucciones:</strong> {tratamiento.instrucciones || 'No especificadas'}
                          </Typography>

                          {tratamiento.fin_tratamiento && (
                            <Typography variant="body2" gutterBottom>
                              <strong>Finalizado:</strong> {formatDate(tratamiento.fin_tratamiento)}
                            </Typography>
                          )}
                        </CardContent>

                        <CardActions>
                          <Button
                            size="small"
                            color="primary"
                            startIcon={<EventNoteIcon />}
                          >
                            Ver detalles
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    No hay tratamientos registrados
                  </Typography>
                  {canEdit && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      sx={{ mt: 1 }}
                    >
                      Registrar Tratamiento
                    </Button>
                  )}
                </Box>
              )}
            </TabPanel>

            {/* Pestaña de Vacunas */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Registro de Vacunaciones
                </Typography>

                {canEdit && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    component={Link}
                    to={`/mascotas/${mascota.id}/vacunas/nuevo`}
                  >
                    Registrar Vacuna
                  </Button>
                )}
              </Box>

              {vacunaciones.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Vacuna</TableCell>
                        <TableCell>Fecha Aplicación</TableCell>
                        <TableCell>Próxima Dosis</TableCell>
                        <TableCell>Veterinario</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vacunaciones.map((vacuna) => {
                        const fechaProxima = vacuna.fecha_proxima ? new Date(vacuna.fecha_proxima) : null;
                        const hoy = new Date();
                        const estaAlDia = !fechaProxima || fechaProxima > hoy;
                        const proximaFechaCercana = fechaProxima &&
                          ((fechaProxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) <= 30;

                        return (
                          <TableRow key={vacuna.id} hover>
                            <TableCell>{vacuna.vacuna_nombre || 'No especificada'}</TableCell>
                            <TableCell>{formatDate(vacuna.fecha_aplicacion)}</TableCell>
                            <TableCell>{formatDate(vacuna.fecha_proxima)}</TableCell>
                            <TableCell>{vacuna.veterinario_nombre || 'No registrado'}</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  !fechaProxima
                                    ? 'Sin revacunación'
                                    : (estaAlDia
                                      ? (proximaFechaCercana
                                        ? 'Próxima dosis cercana'
                                        : 'Al día')
                                      : 'Revacunación pendiente')
                                }
                                color={
                                  !fechaProxima
                                    ? 'default'
                                    : (estaAlDia
                                      ? (proximaFechaCercana ? 'warning' : 'success')
                                      : 'error')
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Tooltip title="Ver detalles">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/mascotas/${mascota.id}/vacunas/${vacuna.id}`);
                                    }}
                                  >
                                    <EventNoteIcon />
                                  </IconButton>
                                </Tooltip>

                                {canEdit && (
                                  <Tooltip title="Editar vacuna">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/mascotas/${mascota.id}/vacunas/editar/${vacuna.id}`);
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {fechaProxima && new Date() > fechaProxima && canEdit && (
                                  <Tooltip title="Registrar revacunación">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/mascotas/${mascota.id}/vacunas/nuevo?revacunacion=${vacuna.vacuna}`);
                                      }}
                                    >
                                      <VaccineIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    No hay vacunas registradas
                  </Typography>
                  {canEdit && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      component={Link}
                      to={`/mascotas/${mascota.id}/vacunas/nuevo`}
                      sx={{ mt: 1 }}
                    >
                      Registrar Vacuna
                    </Button>
                  )}
                </Box>
              )}
            </TabPanel>

            {/* Pestaña de Registro de Peso */}
            <TabPanel value={tabValue} index={3}>

              {consultas.some(c => c.peso) ? (
                <Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Peso</TableCell>
                          <TableCell>Contexto</TableCell>
                          <TableCell>Veterinario</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {consultas
                          .filter(c => c.peso)
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((consulta) => (
                            <TableRow key={consulta.id} hover>
                              <TableCell>{formatDate(consulta.fecha)}</TableCell>
                              <TableCell>{formatNumber(consulta.peso, 'kg')}</TableCell>
                              <TableCell>Durante consulta: {consulta.motivo_consulta || 'Rutina'}</TableCell>
                              <TableCell>{consulta.veterinario_nombre || 'No registrado'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Aquí se podría agregar una gráfica de evolución del peso */}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    No hay registros de peso
                  </Typography>
                  {canEdit && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      sx={{ mt: 1 }}
                    >
                      Registrar Peso
                    </Button>
                  )}
                </Box>
              )}
            </TabPanel>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default HistorialMascota;