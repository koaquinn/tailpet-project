// src/pages/historial/HistorialMascota.tsx (nuevo)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  PetsOutlined as PetsIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  Healing as HealingIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMascota } from '../../api/mascotaApi';
import historialApi, { 
  HistorialMedico, 
  Consulta, 
  Tratamiento, 
  MascotaVacuna 
} from '../../api/historialApi';

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
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<HistorialMedico | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [vacunaciones, setVacunaciones] = useState<MascotaVacuna[]>([]);

  useEffect(() => {
    const fetchData = async () => {
  if (!id) return;
  
  try {
    setLoading(true);
    setError(null);
    
    // Obtener datos de la mascota
    const mascotaData = await getMascota(parseInt(id));
    setMascota(mascotaData);
    
    try {
      // Intentar obtener el historial médico existente
      const historialResponse = await historialApi.getHistorialByMascota(parseInt(id));
      console.log('Historial response:', historialResponse);
      console.log('id de mascota:', id);
      
      // Verificar si hay resultados y tomar el primero
      if (historialResponse.results && historialResponse.results.length > 0) {
        const historialData = historialResponse.results[0]; // Tomar el primer elemento del array
        setHistorial(historialData);
        
        // Verificar los nombres exactos de los métodos en historialApi
        // Asegúrate de que estos métodos existan y sean correctos
        if (historialData.id) {
          try {
            // Verifica si estas son las funciones correctas en tu API
            const consultasData = await historialApi.getConsultasHistorial(historialData.id);
            const tratamientosData = await historialApi.getTratamientosHistorial(historialData.id);
            
            setConsultas(consultasData.results || []);
            setTratamientos(tratamientosData.results || []);
          } catch (consultasError) {
            console.error('Error al obtener consultas o tratamientos:', consultasError);
            // Si falla al obtener consultas, al menos tenemos el historial básico
            setConsultas([]);
            setTratamientos([]);
          }
        }
      } else {
        // No hay historial médico
        setHistorial(null);
      }
    } catch (historialError) {
      console.error('Error al obtener historial médico:', historialError);
      setHistorial(null);
    }
    
    // Obtener vacunaciones independientemente del historial
    try {
      const vacunacionesData = await historialApi.getVacunacionesByMascota(parseInt(id));
      setVacunaciones(vacunacionesData.results || []);
    } catch (vacunasError) {
      console.error('Error al obtener vacunaciones:', vacunasError);
      setVacunaciones([]);
    }
    
  } catch (err) {
    console.error('Error al cargar historial médico:', err);
    setError('Error al cargar los datos de historial médico');
  } finally {
    setLoading(false);
  }
};
    
    fetchData();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
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
          to="/mascotas"
        >
          Volver a mascotas
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <PetsIcon />
          </Avatar>
          <Typography variant="h5" component="h1">
            Historial Médico: {mascota.nombre}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              <strong>Dueño:</strong> {mascota.cliente_nombre}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Especie:</strong> {mascota.especie_nombre}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Raza:</strong> {mascota.raza_nombre}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              <strong>Sexo:</strong> {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Fecha de nacimiento:</strong> {mascota.fecha_nacimiento ? formatDate(mascota.fecha_nacimiento) : 'No registrada'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Esterilizado:</strong> {mascota.esterilizado ? 'Sí' : 'No'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {!historial ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Esta mascota aún no tiene historial médico
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={createHistorialMedico}
          >
            Crear Historial Médico
          </Button>
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
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {consultas.length > 0 ? (
                <Grid container spacing={3}>
                  {consultas.map((consulta) => (
                    <Grid item xs={12} md={6} key={consulta.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {formatDate(consulta.fecha)}
                          </Typography>
                          <Typography color="textSecondary" gutterBottom>
                            Veterinario: {consulta.veterinario_nombre}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" gutterBottom>
                            <strong>Motivo:</strong> {consulta.motivo_consulta}
                          </Typography>
                          {consulta.diagnostico && (
                            <Typography variant="body2" gutterBottom>
                              <strong>Diagnóstico:</strong> {consulta.diagnostico}
                            </Typography>
                          )}
                          {consulta.observaciones && (
                            <Typography variant="body2" gutterBottom>
                              <strong>Observaciones:</strong> {consulta.observaciones}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    No hay consultas registradas
                  </Typography>
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
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {tratamientos.length > 0 ? (
                <Grid container spacing={3}>
                  {tratamientos.map((tratamiento) => (
                    <Grid item xs={12} md={6} key={tratamiento.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Tratamiento: {formatDate(tratamiento.inicio_tratamiento)}
                          </Typography>
                          <Typography color="textSecondary" gutterBottom>
                            Duración: {tratamiento.duracion}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" gutterBottom>
                            <strong>Descripción:</strong> {tratamiento.descripcion}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Instrucciones:</strong> {tratamiento.instrucciones}
                          </Typography>
                          {tratamiento.fin_tratamiento && (
                            <Typography variant="body2" gutterBottom>
                              <strong>Fin tratamiento:</strong> {formatDate(tratamiento.fin_tratamiento)}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button size="small" color="primary" startIcon={<MoreIcon />}>
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
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ mt: 1 }}
                  >
                    Registrar Tratamiento
                  </Button>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {vacunaciones.length > 0 ? (
                <List>
                  {vacunaciones.map((vac) => (
                    <ListItem key={vac.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1">{vac.vacuna_nombre}</Typography>
                            <Chip 
                              label={vac.fecha_proxima ? 'Próxima vacuna pendiente' : 'Al día'} 
                              color={vac.fecha_proxima ? 'warning' : 'success'} 
                              size="small" 
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Aplicada el {formatDate(vac.fecha_aplicacion)} por {vac.veterinario_nombre}
                            </Typography>
                            {vac.fecha_proxima && (
                              <Typography variant="body2" component="div" color="text.secondary">
                                Próxima aplicación: {formatDate(vac.fecha_proxima)}
                              </Typography>
                            )}
                            {vac.observaciones && (
                              <Typography variant="body2" component="div" color="text.secondary">
                                Observaciones: {vac.observaciones}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    No hay vacunas registradas
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ mt: 1 }}
                  >
                    Registrar Vacuna
                  </Button>
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