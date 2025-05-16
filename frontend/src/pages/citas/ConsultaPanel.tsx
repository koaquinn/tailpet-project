// src/pages/citas/ConsultaPanel.tsx
import React, { useState, useEffect } from 'react';
import HealingIcon from '@mui/icons-material/Healing';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Alert, 
  Divider, 
  Stepper, 
  Step, 
  StepLabel, 
  Card, 
  CardContent, 
  IconButton, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Autocomplete,
  useTheme,
  alpha,
  Breadcrumbs,
  Tooltip,
  Fade,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon, 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon, 
  LocalHospital as HospitalIcon, 
  Pets as PetsIcon, 
  EventAvailable as EventIcon, 
  Cancel as CancelIcon, 
  MedicationLiquid as MedicationIcon,
  WarningAmber as WarningIcon,
  MonitorWeight as WeightIcon,
  Thermostat as ThermostatIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import consultaApi, { ConsultaEnCurso } from '../../api/consultaApi';
import citasApi from '../../api/citasApi';
import { getMascota } from '../../api/mascotaApi';
import inventarioApi from '../../api/inventarioApi';
import historialApi from '../../api/historialApi';
import { useAuth } from '../../context/AuthContext';

// Definimos los pasos de la consulta
const CONSULTA_STEPS = ['Triage', 'Diagnóstico', 'Tratamiento', 'Finalización'];

// Estado de consulta a clase CSS
const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'PROGRAMADA': return 'primary';
    case 'EN_CURSO': return 'warning';
    case 'COMPLETADA': return 'success';
    default: return 'error';
  }
};

const ConsultaPanel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  // Estados para los datos de la consulta
  const [consulta, setConsulta] = useState<ConsultaEnCurso | null>(null);
  const [mascota, setMascota] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Estado para el paso actual
  const [activeStep, setActiveStep] = useState(0);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    diagnostico: '',
    observaciones: '',
    peso_actual: '',
    temperatura: '',
    sintomas: '',
    tratamiento: '',
  });
  
  // Estado para los medicamentos
  const [medicamentos, setMedicamentos] = useState<Array<{
    id: number;
    medicamento: number;
    medicamento_nombre?: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    cantidad: number;
  }>>([]);
  
  // Estados para el diálogo de añadir medicamento
  const [medicamentoDialogOpen, setMedicamentoDialogOpen] = useState(false);
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState<any[]>([]);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState<any | null>(null);
  const [nuevoDatosMedicamento, setNuevoDatosMedicamento] = useState({
    dosis: '',
    frecuencia: '',
    duracion: '',
    cantidad: 1,
  });
  
  // Mostrar notificaciones
  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Obtener datos de la consulta
        const consultaData = await citasApi.getConsulta(parseInt(id));
        setConsulta(consultaData as ConsultaEnCurso);
        
        // Si la consulta está en estado 'PROGRAMADA', cambiarla a 'EN_CURSO'
        if (consultaData.estado === 'PROGRAMADA') {
          await consultaApi.iniciarConsulta(parseInt(id));
        }
        
        // Obtener datos de la mascota
        if (consultaData.mascota) {
          const mascotaData = await getMascota(consultaData.mascota);
          setMascota(mascotaData);
        }
        
        // Inicializar formulario con datos de la consulta
        setFormData({
          diagnostico: consultaData.diagnostico || '',
          observaciones: consultaData.observaciones || '',
          peso_actual: '',
          temperatura: '',
          sintomas: '',
          tratamiento: '',
        });
        
        // Cargar medicamentos disponibles
        const medicamentosResponse = await inventarioApi.getMedicamentos({ stock_minimo: 1 });
        setMedicamentosDisponibles(medicamentosResponse.results || []);
      } catch (err) {
        console.error('Error al cargar datos de la consulta:', err);
        setError('Ocurrió un error al cargar los datos de la consulta');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Manejadores de cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejadores para el stepper
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Manejadores para medicamentos
  const handleOpenMedicamentoDialog = () => {
    setMedicamentoDialogOpen(true);
  };
  
  const handleCloseMedicamentoDialog = () => {
    setMedicamentoDialogOpen(false);
    setMedicamentoSeleccionado(null);
    setNuevoDatosMedicamento({
      dosis: '',
      frecuencia: '',
      duracion: '',
      cantidad: 1,
    });
  };
  
  const handleMedicamentoChange = (medicamento: any) => {
    setMedicamentoSeleccionado(medicamento);
  };
  
  const handleMedicamentoInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoDatosMedicamento(prev => ({
      ...prev,
      [name]: name === 'cantidad' ? parseInt(value) || 1 : value
    }));
  };
  
  const handleAddMedicamento = () => {
    if (!medicamentoSeleccionado) return;
    
    const nuevoMedicamento = {
      id: Date.now(), // ID temporal
      medicamento: medicamentoSeleccionado.id,
      medicamento_nombre: medicamentoSeleccionado.nombre,
      dosis: nuevoDatosMedicamento.dosis,
      frecuencia: nuevoDatosMedicamento.frecuencia,
      duracion: nuevoDatosMedicamento.duracion,
      cantidad: nuevoDatosMedicamento.cantidad,
    };
    
    setMedicamentos(prev => [...prev, nuevoMedicamento]);
    showNotification(`${medicamentoSeleccionado.nombre} agregado a la receta`, 'success');
    handleCloseMedicamentoDialog();
  };
  
  const handleRemoveMedicamento = (id: number) => {
    const medToRemove = medicamentos.find(med => med.id === id);
    setMedicamentos(prev => prev.filter(med => med.id !== id));
    if (medToRemove?.medicamento_nombre) {
      showNotification(`${medToRemove.medicamento_nombre} eliminado de la receta`, 'info');
    }
  };
  
  // Manejador para guardar la consulta
  const handleSaveConsulta = async () => {
    if (!consulta || !id) return;
    
    setSaving(true);
    try {
      // Preparar datos para guardar
      const consultaData = {
        ...consulta,
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
      };
      
      // Guardar la consulta
      await citasApi.updateConsulta(parseInt(id), consultaData);
      
      // Mensaje de éxito
      showNotification('Consulta guardada exitosamente', 'success');
    } catch (err) {
      console.error('Error al guardar la consulta:', err);
      showNotification('Ocurrió un error al guardar la consulta', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  // Manejador para completar la consulta
  const handleCompletarConsulta = async () => {
    if (!consulta || !id) return;
    
    if (!formData.diagnostico.trim()) {
      showNotification('Debe ingresar un diagnóstico antes de completar la consulta', 'error');
      return;
    }
    
    setSaving(true);
    try {
      // Preparar datos para completar la consulta
      const consultaCompletaData = {
        ...consulta,
        estado: 'COMPLETADA',
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        peso_actual: formData.peso_actual ? parseFloat(formData.peso_actual) : null,
        sintomas: formData.sintomas,
        tratamiento: formData.tratamiento
      };
      
      // Completar la consulta
      const response = await consultaApi.completarConsulta(parseInt(id), consultaCompletaData);
      
      // Si hay medicamentos, registrarlos
      if (medicamentos.length > 0) {
        const medicamentosData = medicamentos.map(med => ({
          medicamento: med.medicamento,
          dosis: med.dosis,
          frecuencia: med.frecuencia,
          duracion: med.duracion,
          cantidad: med.cantidad,
        }));
        
        await consultaApi.registrarMedicamentos(parseInt(id), medicamentosData);
      }
      
      // Mostrar notificación de éxito
      showNotification('Consulta completada y registrada correctamente en el historial médico', 'success');
      
      // Redirigir a la lista de consultas después de 2 segundos
      setTimeout(() => {
        navigate('/citas');
      }, 2000);
    } catch (err) {
      console.error('Error al completar la consulta:', err);
      showNotification('Ocurrió un error al completar la consulta', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  // Renderizado condicional para estados de carga y error
  if (loading) {
    return (
      <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 3 }}>
          Cargando datos de la consulta...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          variant="outlined"
          icon={<WarningIcon />}
          sx={{ 
            py: 2, 
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
          }}
        >
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
            {error}
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              color="inherit" 
              variant="outlined"
              size="small" 
              onClick={() => window.location.reload()}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 1.5 }}
            >
              Reintentar
            </Button>
            
            <Button 
              component={Link} 
              to="/citas" 
              color="primary" 
              variant="contained"
              size="small" 
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 1.5 }}
            >
              Volver a consultas
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }
  
  if (!consulta || !mascota) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="warning" 
          variant="outlined"
          sx={{ 
            py: 2, 
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`
          }}
        >
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
            No se encontró la consulta o la mascota
          </Typography>
          
          <Button 
            component={Link} 
            to="/citas" 
            color="primary" 
            variant="contained"
            size="small" 
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 1, borderRadius: 1.5 }}
          >
            Volver a consultas
          </Button>
        </Alert>
      </Container>
    );
  }
  
  // Componente principal cuando los datos están cargados
  return (
    <Container maxWidth="lg" >
      {/* Barra de navegación y título */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link to="/citas" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
              Consultas
            </Typography>
          </Link>
          <Typography color="text.primary">
            Consulta #{id}
          </Typography>
        </Breadcrumbs>
      
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.text.primary
            }}
          >
            <HospitalIcon 
              sx={{ 
                mr: 1.5, 
                color: theme.palette.secondary.main,
                fontSize: 32
              }} 
            />
            Consulta en curso
            
            <Chip 
              label={consulta.estado} 
              color={getEstadoColor(consulta.estado)}
              size="small"
              sx={{ 
                ml: 2,
                fontWeight: 600,
                px: 1,
                borderRadius: 1.5
              }}
            />
          </Typography>
          
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />} 
            component={Link} 
            to="/citas"
            sx={{ 
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Volver a consultas
          </Button>
        </Box>
      </Box>
      


{/* --- INICIO: Información del paciente y la consulta --- */}
<Box sx={{width: '100%'}}>
  <Paper
    elevation={2}
    sx={{
      width: '100%',
      p: { xs: 2, md: 3 },
      mb: 3,
      borderRadius: 3,
      boxShadow: theme.shadows[2],
    }}
  >
    <Grid container spacing={3} sx={{ width: '100%', m: 0}}>
      {/* Card de Información del Paciente */}
      <Grid item xs={12} md={6} sx={{width: '100%'}}>
        <Card
          variant="outlined"
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: 2.5,
            borderColor: alpha(theme.palette.primary.main, 0.3),
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PetsIcon sx={{ mr: 1, fontSize: '1.8rem' }} />
                Información del Paciente
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5, borderColor: alpha(theme.palette.primary.main, 0.2) }} />

            <Grid container spacing={2}>
              {[
                { label: 'Nombre', value: mascota.nombre },
                { label: 'Especie', value: mascota.especie_nombre || 'No registrada' },
                { label: 'Raza', value: mascota.raza_nombre || 'No registrada' },
                { label: 'Edad', value: mascota.edad_anos ? `${mascota.edad_anos} año${mascota.edad_anos !== 1 ? 's' : ''}` : 'No registrada' },
                { label: 'Sexo', value: mascota.sexo === 'M' ? 'Macho' : mascota.sexo === 'H' ? 'Hembra' : 'No registrado' },
                { label: 'Estado', value: <Chip 
                  size="small" 
                  label={mascota.activo ? "Activo" : "Inactivo"} 
                  color={mascota.activo ? "success" : "error"} 
                  sx={{ 
                    borderRadius: '16px', 
                    fontWeight: 500, 
                    height: 'auto', 
                    '& .MuiChip-label': {py: 0.3, px: 1} 
                  }} 
                /> },
              ].map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Box sx={{ p: 1 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      display="block" 
                      sx={{ 
                        lineHeight: 1.2, 
                        mb: 0.5,
                        fontWeight: 500
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        lineHeight: 1.4,
                        minHeight: '24px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Card de Detalles de la Consulta */}
      <Grid item xs={12} md={6} sx={{width: '100%'}}>
        <Card
          variant="outlined"
          sx={{
            height: '100%',
            width: '100%',
            borderRadius: 2.5,
            borderColor: alpha(theme.palette.secondary.main, 0.3),
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: `0 8px 16px 0 ${alpha(theme.palette.secondary.main, 0.15)}`,
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <EventIcon sx={{ mr: 1, fontSize: '1.8rem' }} />
                Detalles de la Consulta
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5, borderColor: alpha(theme.palette.secondary.main, 0.2) }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.5, fontWeight: 500 }}>
                    Fecha y Hora
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.4 }}>
                    {new Date(consulta.fecha).toLocaleString('es-CL', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.5, fontWeight: 500 }}>
                    Tipo de Consulta
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.4 }}>
                    {consulta.tipo || 'No especificado'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.5, fontWeight: 500 }}>
                    Motivo de la Consulta
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.grey[500], 0.04), 
                      borderRadius: 1.5, 
                      borderColor: alpha(theme.palette.grey[500], 0.2) 
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {consulta.motivo || 'No especificado'}
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.5, fontWeight: 500 }}>
                    Veterinario Asignado
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.4 }}>
                    {consulta.veterinario_nombre || (user ? `${user.first_name} ${user.last_name}` : 'No asignado')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Paper>
</Box>
{/* --- FIN: Información del paciente y la consulta --- */}
      
      {/* Panel principal con pasos */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: `0 6px 24px 0 ${alpha(theme.palette.grey[500], 0.1)}, 
                     0 3px 12px 0 ${alpha(theme.palette.grey[500], 0.08)}`
        }}
      >
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          sx={{ 
            mb: 4,
            '& .MuiStepLabel-root .Mui-completed': {
              color: theme.palette.success.main,
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: theme.palette.primary.main,
            },
          }}
        >
          {CONSULTA_STEPS.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 2, minHeight: 320 }}>
          {activeStep === 0 && (
            <Fade in={activeStep === 0}>
              <Grid container spacing={3} justifyContent={'center'}>
                  <Grid item xs={12} md={8} lg={6}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: 3, 
                        p: 3,
                        height: '100%',
                        boxShadow: '0px 2px 10px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box textAlign="center" mb={3}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 600
                          }}
                        >
                          <ThermostatIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                          Signos Vitales
                        </Typography>
                      </Box>
      
                      <Box sx={{ flexGrow: 1,  display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                          fullWidth
                          label="Temperatura (°C)"
                          name="temperatura"
                          type="number"
                          value={formData.temperatura}
                          onChange={handleInputChange}
                          InputProps={{ 
                            inputProps: { min: 35, max: 43, step: 0.1 },
                            startAdornment: <InputAdornment position="start">°C</InputAdornment>,
                          }}
                          variant="outlined"
                          size="medium"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                             borderRadius: 2,
                            }
                          }}
                        />
        
                        <TextField
                          fullWidth
                          label="Peso"
                          name="peso_actual"
                          type="number"
                          value={formData.peso_actual}
                          onChange={handleInputChange}
                        InputProps={{ 
                            inputProps: { min: 0, step: 0.1 },
                            startAdornment: <InputAdornment position="start">kg</InputAdornment>,
                          }}
                          variant="outlined"
                          size="medium"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Box>
                    </Card>
                  </Grid>
                {/* Sección de Síntomas - Centrada */}
                  <Grid item xs={12} md={8}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: 3, 
                        p: 3,
                        height: '100%',
                        boxShadow: '0px 2px 10px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      >
                      <Box textAlign="center" mb={3}>
                        <Typography 
                          variant="h5"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 600
                          }}
                        >
                          <InfoIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                          Síntomas
                        </Typography>
                      </Box>
      
                      <TextField
                        fullWidth
                        multiline
                        rows={8}
                        placeholder="Describa detalladamente los síntomas que presenta la mascota..."
                        name="sintomas"
                        value={formData.sintomas}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="medium"
                        sx={{
                          flexGrow: 1,
                          '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          height: '100%',
                          alignItems: 'flex-start'
                          },
                          '& .MuiOutlinedInput-multiline': {
                            padding: 2,
                            height: '100%',
                          }
                        }}
                        />
                    </Card>
                </Grid>
                    {/* Nota Informativa */}
                  <Grid item xs={12} md={8} lg={6}>
                  <Alert 
                    severity="info" 
                    icon={<InfoIcon fontSize="large" />}
                    sx={{ 
                      borderRadius: 2,
                      alignItems: 'center',
                      fontSize: '1rem',
                      '& .MuiAlert-message': {
                        py: 1.5
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Registre los valores básicos para iniciar la consulta. Si no cuenta con todos los valores, puede continuar al siguiente paso.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Fade>
          )}
          
          {activeStep === 1 && (
  <Fade in={activeStep === 1}>
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3} justifyContent="center">
        {/* Sección de Diagnóstico */}
        <Grid item xs={12} md={8} lg={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Diagnóstico
            </Typography>
            <TextField
              fullWidth
              label="Diagnóstico del paciente *"
              name="diagnostico"
              multiline
              rows={6}
              required
              value={formData.diagnostico}
              onChange={handleInputChange}
              error={!formData.diagnostico.trim()}
              helperText={!formData.diagnostico.trim() ? 'Campo obligatorio para finalizar la consulta' : ''}
            />
          </Card>
        </Grid>

        {/* Sección de Observaciones */}
        <Grid item xs={12} md={8} lg={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Observaciones
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Mensaje fijo - Versión simplificada */}
      <Box sx={{ width: '100%', mt: 3, px: 2 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="body1">
            El diagnóstico es obligatorio para poder completar la consulta.
          </Typography>
        </Alert>
      </Box>
    </Box>
  </Fade>
)}
          
          {activeStep === 2 && (
  <Fade in={activeStep === 2}>
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3} justifyContent="center">
        {/* Sección de Tratamiento Recomendado */}
        <Grid item xs={12} md={6}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 3, 
              p: 3,
              height: '100%',
              boxShadow: '0px 2px 10px rgba(0,0,0,0.08)'
            }}
          >
            <Box textAlign="center" mb={3}>
              <Typography 
                variant="h6" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 600
                }}
              >
                <HealingIcon color="primary" sx={{ mr: 1 }} />
                Tratamiento Recomendado
              </Typography>
            </Box>
            
            <TextField
              fullWidth
              name="tratamiento"
              multiline
              rows={6}
              value={formData.tratamiento}
              onChange={handleInputChange}
              placeholder="Describa detalladamente el tratamiento a seguir..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiOutlinedInput-multiline': {
                  padding: 2
                }
              }}
            />
          </Card>
        </Grid>

        {/* Sección de Medicamentos */}
        <Grid item xs={12} md={6}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 3, 
              p: 3,
              height: '100%',
              boxShadow: '0px 2px 10px rgba(0,0,0,0.08)'
            }}
          >
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={3}
            >
              <Typography 
                variant="h6"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 600
                }}
              >
                <MedicationIcon color="primary" sx={{ mr: 1}} />
                Medicamentos Recetados
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenMedicamentoDialog}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  fontWeight: 500,
                  textTransform: 'none',
                }}
              >
                Agregar
              </Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {medicamentos.length === 0 ? (
              <Alert 
                severity="info"
                sx={{ 
                  borderRadius: 2,
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2">
                  No se han agregado medicamentos a la receta.
                </Typography>
              </Alert>
            ) : (
              <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
                {medicamentos.map((med) => (
                  <Card 
                    key={med.id} 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: 2,
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={600}>
                          {med.medicamento_nombre}
                        </Typography>
                        <IconButton 
                          onClick={() => handleRemoveMedicamento(med.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Dosis:
                          </Typography>
                          <Typography>{med.dosis}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Frecuencia:
                          </Typography>
                          <Typography>{med.frecuencia}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Duración:
                          </Typography>
                          <Typography>{med.duracion}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Cantidad:
                          </Typography>
                          <Chip 
                            label={`${med.cantidad} uds.`} 
                            size="small" 
                            variant="outlined"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  </Fade>
)}
          
          {activeStep === 3 && (
  <Fade in={activeStep === 3}>
    <Box sx={{ width: '100%' }}>
      {/* Encabezado */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4,
        p: 3,
        bgcolor: alpha(theme.palette.success.light, 0.1),
        borderRadius: 3,
        borderLeft: `4px solid ${theme.palette.success.main}`
      }}>
        <CheckCircleIcon sx={{ 
          fontSize: 40, 
          color: theme.palette.success.main,
          mb: 1 
        }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Resumen Final de la Consulta
        </Typography>
        <Typography variant="body1">
          Revise cuidadosamente toda la información antes de completar el proceso
        </Typography>
      </Box>

      {/* Alerta Informativa */}
      <Alert 
        severity="info"
        sx={{ 
          mb: 4,
          borderRadius: 2,
          borderLeft: `4px solid ${theme.palette.info.main}`
        }}
      >
        <Typography variant="body1">
          Al confirmar, todos los datos quedarán registrados permanentemente en el historial médico.
        </Typography>
      </Alert>

      {/* Sección de Diagnóstico */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          mb: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <MedicalServicesIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          Diagnóstico
        </Typography>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Typography>
            {formData.diagnostico || 'No se registró diagnóstico'}
          </Typography>
        </Paper>
      </Box>

      {/* Sección de Tratamiento */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          mb: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <HealingIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
          Tratamiento
        </Typography>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Typography>
            {formData.tratamiento || 'No se registró tratamiento'}
          </Typography>
        </Paper>
      </Box>

      {/* Sección de Medicamentos */}
      <Box>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          mb: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <MedicationIcon sx={{ mr: 1, color: theme.palette.info.main }} />
          Medicamentos Recetados ({medicamentos.length})
        </Typography>
        
        {medicamentos.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No se prescribieron medicamentos
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {medicamentos.map((med, index) => (
              <Grid item xs={12} key={index}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {med.medicamento_nombre}
                    </Typography>
                    <Chip 
                      label={`${med.cantidad} unidades`} 
                      size="small" 
                      color="primary"
                    />
                  </Box>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2"><strong>• Dosis:</strong> {med.dosis}</Typography>
                    <Typography variant="body2"><strong>• Frecuencia:</strong> {med.frecuencia}</Typography>
                    <Typography variant="body2"><strong>• Duración:</strong> {med.duracion}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  </Fade>
)}
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              disabled={activeStep === 0 || saving}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ 
                borderRadius: 2,
                px: 2,
                py: 1,
                textTransform: 'none',
              }}
            >
              Paso anterior
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                color="primary"
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveConsulta}
                disabled={saving}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar progreso'}
              </Button>
              
              {activeStep === CONSULTA_STEPS.length - 1 ? (
                <Button
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleCompletarConsulta}
                  disabled={saving || !formData.diagnostico.trim()}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: `0 4px 12px 0 ${alpha(theme.palette.success.main, 0.3)}`,
                    '&:hover': {
                      boxShadow: `0 6px 15px 0 ${alpha(theme.palette.success.main, 0.4)}`,
                    }
                  }}
                >
                  {saving ? 'Finalizando...' : 'Completar consulta'}
                </Button>
              ) : (
                <Button
                  color="primary"
                  variant="contained"
                  onClick={handleNext}
                  disabled={saving || (activeStep === 1 && !formData.diagnostico.trim())}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 500,
                    boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      boxShadow: `0 6px 15px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                    }
                  }}
                >
                  Siguiente paso
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Diálogo para agregar medicamento */}
      <Dialog 
  open={medicamentoDialogOpen} 
  onClose={handleCloseMedicamentoDialog}
  maxWidth="sm"
  fullWidth
  sx={{
    '& .MuiDialog-paper': {
      borderRadius: 3,
      padding: 3,
      minWidth: '400px',
    }
  }}
>
  <DialogTitle sx={{ p: 0, mb: 3 }}>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      <MedicationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
      Agregar medicamento a la receta
    </Typography>
  </DialogTitle>

  <DialogContent sx={{ p: 0 }}>
    <Grid container spacing={3}>
      <Grid item xs={12}>
  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
    <InputLabel id="medicamento-label" shrink={true}>Seleccionar medicamento</InputLabel>
    <Select
      labelId="medicamento-label"
      label="Seleccionar medicamento"
      variant="outlined"
      displayEmpty
      value={medicamentoSeleccionado || ''}
      onChange={(e) => setMedicamentoSeleccionado(e.target.value)}
      sx={{
        '& .MuiSelect-select': {
          color: theme => !medicamentoSeleccionado ? theme.palette.text.disabled : theme.palette.text.primary,
          padding: '10px 14px',
        },
        backgroundColor: '#fff',
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300
          }
        }
      }}
    >
      <MenuItem disabled value="">
        <span style={{ color: theme => theme.palette.text.disabled }}>
          Seleccione un medicamento
        </span>
      </MenuItem>
      {medicamentosDisponibles.map((medicamento) => (
        <MenuItem 
          key={medicamento.id || medicamento.nombre} 
          value={medicamento}
          sx={{ py: 1 }}
        >
          {medicamento.nombre}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Dosis (ej. 1 tableta, 5ml)"
          name="dosis"
          value={nuevoDatosMedicamento.dosis}
          onChange={handleMedicamentoInputChange}
          variant="outlined"
          size="small"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Frecuencia (ej. cada 8 horas)"
          name="frecuencia"
          value={nuevoDatosMedicamento.frecuencia}
          onChange={handleMedicamentoInputChange}
          variant="outlined"
          size="small"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Duración (ej. 7 días)"
          name="duracion"
          value={nuevoDatosMedicamento.duracion}
          onChange={handleMedicamentoInputChange}
          variant="outlined"
          size="small"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Cantidad"
          name="cantidad"
          type="number"
          value={nuevoDatosMedicamento.cantidad}
          onChange={handleMedicamentoInputChange}
          variant="outlined"
          size="small"
          InputProps={{ inputProps: { min: 1 } }}
        />
      </Grid>
    </Grid>
  </DialogContent>

  <DialogActions sx={{ 
    p: 0,
    mt: 3,
    justifyContent: 'space-between'
  }}>
    <Button 
      onClick={handleCloseMedicamentoDialog}
      variant="outlined"
      sx={{ 
        borderRadius: 2,
        px: 3,
        textTransform: 'none'
      }}
    >
      Cancelar
    </Button>
    <Button 
      onClick={handleAddMedicamento}
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      sx={{ 
        borderRadius: 2,
        px: 3,
        textTransform: 'none'
      }}
    >
      Agregar medicamento
    </Button>
  </DialogActions>
</Dialog>

      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: `0 4px 20px 0 ${alpha(
              notification.severity === 'success' ? theme.palette.success.main : 
              notification.severity === 'error' ? theme.palette.error.main :
              notification.severity === 'warning' ? theme.palette.warning.main :
              theme.palette.info.main, 
              0.3
            )}`,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Importación adicional para los iconos faltantes
import { ArrowForward as ArrowForwardIcon, Refresh as RefreshIcon } from '@mui/icons-material';

export default ConsultaPanel;