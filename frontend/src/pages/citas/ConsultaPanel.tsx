// src/pages/citas/ConsultaPanel.tsx
import React, { useState, useEffect } from 'react';
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
    <Container maxWidth="lg">
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
<Paper
  elevation={2} // Sombra sutil y estándar
  sx={{
    p: { xs: 2, md: 3 }, // Padding responsive
    mb: 3,
    borderRadius: 3, // Bordes más suaves para el contenedor principal
    boxShadow: theme.shadows[2], // Usar sombras del tema para consistencia
  }}
>
  <Grid container spacing={3}> {/* Espaciado consistente entre las tarjetas */}
    {/* Card de Información del Paciente */}
    <Grid item xs={12} md={6}>
      <Card
        variant="outlined"
        sx={{
          height: '100%', // Para que ambas tarjetas tengan la misma altura si el contenido varía
          borderRadius: 2.5, // Bordes suaves para la tarjeta
          borderColor: alpha(theme.palette.primary.main, 0.3), // Borde sutil con color primario
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-3px)', // Efecto hover sutil
            boxShadow: `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}> {/* Padding interno responsive */}
          <Typography
            variant="h6" // Título de la tarjeta
            gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.primary.main, // Color primario para el título
              fontWeight: 600, // Fuente en negrita
              mb: 2, // Margen inferior
            }}
          >
            <PetsIcon sx={{ mr: 1, fontSize: '1.8rem' }} /> {/* Icono y su margen */}
            Información del Paciente
          </Typography>
          <Divider sx={{ mb: 2.5, borderColor: alpha(theme.palette.primary.main, 0.2) }} /> {/* Divisor sutil */}

          <Grid container spacing={2}> {/* Grid para los campos de datos */}
            {[
              { label: 'Nombre', value: mascota.nombre },
              { label: 'Especie', value: mascota.especie_nombre || 'No registrada' },
              { label: 'Raza', value: mascota.raza_nombre || 'No registrada' },
              { label: 'Edad', value: mascota.edad_anos ? `${mascota.edad_anos} año${mascota.edad_anos !== 1 ? 's' : ''}` : 'No registrada' },
              { label: 'Sexo', value: mascota.sexo === 'M' ? 'Macho' : mascota.sexo === 'H' ? 'Hembra' : 'No registrado' },
              { label: 'Estado', value: <Chip size="small" label={mascota.activo ? "Activo" : "Inactivo"} color={mascota.activo ? "success" : "error"} sx={{ borderRadius: '16px', fontWeight: 500, height: 'auto', '& .MuiChip-label': {py: 0.3, px: 1} }} /> },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} key={index}> {/* Cada campo en dos columnas en pantallas pequeñas/medianas */}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.2 }}>
                  {item.label}
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ lineHeight: 1.4 }}>
                  {item.value}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    {/* Card de Detalles de la Consulta */}
    <Grid item xs={12} md={6}>
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          borderRadius: 2.5,
          borderColor: alpha(theme.palette.secondary.main, 0.3), // Borde sutil con color secundario
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 16px 0 ${alpha(theme.palette.secondary.main, 0.15)}`,
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.secondary.main, // Color secundario para el título
              fontWeight: 600,
              mb: 2,
            }}
          >
            <EventIcon sx={{ mr: 1, fontSize: '1.8rem' }} /> {/* Cambiado a EventIcon para consulta */}
            Detalles de la Consulta
          </Typography>
          <Divider sx={{ mb: 2.5, borderColor: alpha(theme.palette.secondary.main, 0.2) }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.2 }}>
                Fecha y Hora
              </Typography>
              <Typography variant="body1" fontWeight={500} sx={{ lineHeight: 1.4 }}>
                {new Date(consulta.fecha).toLocaleString('es-CL', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.2 }}>
                Tipo de Consulta
              </Typography>
              <Typography variant="body1" fontWeight={500} sx={{ lineHeight: 1.4 }}>
                {consulta.tipo || 'No especificado'}
              </Typography>
            </Grid>
            <Grid item xs={12}> {/* Motivo ocupa todo el ancho */}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.2 }}>
                Motivo de la Consulta
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: alpha(theme.palette.grey[500], 0.04), borderRadius: 1.5, borderColor: alpha(theme.palette.grey[500], 0.2) }}>
                <Typography variant="body1" fontWeight={500} sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}> {/* pre-wrap para respetar saltos de línea */}
                  {consulta.motivo || 'No especificado'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.2 }}>
                Veterinario Asignado
              </Typography>
              <Typography variant="body1" fontWeight={500} sx={{ lineHeight: 1.4 }}>
                {consulta.veterinario_nombre || (user ? `${user.first_name} ${user.last_name}` : 'No asignado')}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</Paper>
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Peso actual (kg)"
                    name="peso_actual"
                    type="number"
                    value={formData.peso_actual}
                    onChange={handleInputChange}
                    InputProps={{ 
                      inputProps: { min: 0, step: 0.1 },
                      startAdornment: (
                        <WeightIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                      ),
                    }}
                    variant="outlined"
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Temperatura (°C)"
                    name="temperatura"
                    type="number"
                    value={formData.temperatura}
                    onChange={handleInputChange}
                    InputProps={{ 
                      inputProps: { min: 35, max: 43, step: 0.1 },
                      startAdornment: (
                        <ThermostatIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                      ),
                    }}
                    variant="outlined"
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Síntomas"
                    name="sintomas"
                    multiline
                    rows={4}
                    value={formData.sintomas}
                    onChange={handleInputChange}
                    placeholder="Describa los síntomas que presenta la mascota..."
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    variant="outlined"
                    icon={<InfoIcon />}
                    sx={{ 
                      mt: 2, 
                      borderRadius: 2,
                      boxShadow: `0 2px 8px 0 ${alpha(theme.palette.info.main, 0.1)}`
                    }}
                  >
                    <Typography variant="body2">
                      Registre los valores básicos para iniciar la consulta. Si no cuenta con todos los valores, puede continuar al siguiente paso.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Fade>
          )}
          
          {activeStep === 1 && (
            <Fade in={activeStep === 1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Diagnóstico"
                    name="diagnostico"
                    multiline
                    rows={4}
                    required
                    value={formData.diagnostico}
                    onChange={handleInputChange}
                    error={!formData.diagnostico.trim()}
                    helperText={!formData.diagnostico.trim() ? 'El diagnóstico es obligatorio para finalizar la consulta' : ''}
                    placeholder="Ingrese el diagnóstico detallado del paciente..."
                    variant="outlined"
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                      '& .Mui-error': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.error.main,
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    name="observaciones"
                    multiline rows={3}
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    placeholder="Observaciones adicionales sobre el paciente..."
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert 
                    severity="warning" 
                    variant="outlined"
                    sx={{ 
                      mt: 2, 
                      borderRadius: 2,
                      boxShadow: `0 2px 8px 0 ${alpha(theme.palette.warning.main, 0.1)}`
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      El diagnóstico es obligatorio para poder completar la consulta.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Fade>
          )}
          
          {activeStep === 2 && (
            <Fade in={activeStep === 2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tratamiento recomendado"
                    name="tratamiento"
                    multiline
                    rows={4}
                    value={formData.tratamiento}
                    onChange={handleInputChange}
                    placeholder="Describa el tratamiento a seguir..."
                    variant="outlined"
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 2,
                      overflow: 'visible',
                      boxShadow: `0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.08)}`
                    }}
                  >
                    <CardContent sx={{ pb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography 
                          variant="h6"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            fontWeight: 600,
                            color: theme.palette.text.primary
                          }}
                        >
                          <MedicationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                          Medicamentos recetados
                        </Typography>
                        
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleOpenMedicamentoDialog}
                          sx={{ 
                            borderRadius: 2,
                            boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
                            px: 2,
                            py: 1,
                            fontWeight: 500,
                            textTransform: 'none',
                            '&:hover': {
                              boxShadow: `0 6px 15px 0 ${alpha(theme.palette.primary.main, 0.35)}`,
                            }
                          }}
                        >
                          Agregar medicamento
                        </Button>
                      </Box>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      {medicamentos.length === 0 ? (
                        <Alert 
                          severity="info" 
                          variant="outlined"
                          sx={{ 
                            borderRadius: 2,
                            boxShadow: 'none'
                          }}
                        >
                          <Typography variant="body2">
                            No se han agregado medicamentos a la receta. Si es necesario, agregue los medicamentos que el paciente debe tomar.
                          </Typography>
                        </Alert>
                      ) : (
                        <Box>
                          {medicamentos.map((med) => (
                            <Card 
                              key={med.id} 
                              variant="outlined" 
                              sx={{ 
                                mb: 2, 
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                '&:last-child': {
                                  mb: 0
                                }
                              }}
                            >
                              <CardContent sx={{ pb: 1 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: theme.palette.primary.main
                                    }}
                                  >
                                    {med.medicamento_nombre}
                                  </Typography>
                                  
                                  <Tooltip title="Eliminar medicamento">
                                    <IconButton 
                                      color="error" 
                                      onClick={() => handleRemoveMedicamento(med.id)}
                                      size="small"
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.error.main, 0.2),
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                                
                                <Divider sx={{ mb: 1.5 }} />
                                
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      Dosis:
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
                                      {med.dosis}
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                      Frecuencia:
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500}>
                                      {med.frecuencia}
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      Duración:
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
                                      {med.duracion}
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                      Cantidad:
                                    </Typography>
                                    <Chip 
                                      label={`${med.cantidad} unidades`} 
                                      color="primary" 
                                      size="small"
                                      variant="outlined"
                                      sx={{ borderRadius: 1 }}
                                    />
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}
          
          {activeStep === 3 && (
            <Fade in={activeStep === 3}>
              <Box>
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    mb: 3,
                    p: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderRadius: 2
                  }}
                >
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1
                    }}
                  >
                    <CheckCircleIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                    Resumen de la consulta
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary">
                    Por favor, verifica que toda la información esté correcta antes de finalizar la consulta.
                  </Typography>
                </Box>
                
                <Alert 
                  severity="info" 
                  variant="outlined"
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    boxShadow: `0 2px 8px 0 ${alpha(theme.palette.info.main, 0.1)}`
                  }}
                >
                  <Typography variant="body2">
                    Al completar la consulta, todos los datos registrados serán guardados en el historial médico del paciente y no se podrán modificar posteriormente.
                  </Typography>
                </Alert>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        height: '100%',
                        borderRadius: 2,
                        boxShadow: `0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.08)}`
                      }}
                    >
                      <CardContent>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            mb: 2
                          }}
                        >
                          Diagnóstico:
                        </Typography>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Box 
                          sx={{ 
                            p: 2, 
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: 1.5,
                            minHeight: 100,
                            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                          }}
                        >
                          <Typography variant="body1">
                            {formData.diagnostico || 'No se ha registrado diagnóstico'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        height: '100%',
                        borderRadius: 2,
                        boxShadow: `0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.08)}`
                      }}
                    >
                      <CardContent>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 600,
                            color: theme.palette.secondary.main,
                            mb: 2
                          }}
                        >
                          Tratamiento:
                        </Typography>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Box 
                          sx={{ 
                            p: 2, 
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: 1.5,
                            minHeight: 100,
                            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                          }}
                        >
                          <Typography variant="body1">
                            {formData.tratamiento || 'No se ha registrado tratamiento'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: 2,
                        boxShadow: `0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.08)}`
                      }}
                    >
                      <CardContent>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <MedicationIcon sx={{ mr: 1 }} />
                          Medicamentos recetados ({medicamentos.length}):
                        </Typography>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        {medicamentos.length === 0 ? (
                          <Alert 
                            severity="info" 
                            variant="outlined"
                            sx={{ 
                              borderRadius: 2,
                              boxShadow: 'none'
                            }}
                          >
                            <Typography variant="body2">
                              No se han recetado medicamentos para esta consulta.
                            </Typography>
                          </Alert>
                        ) : (
                          <Box>
                            {medicamentos.map((med) => (
                              <Box 
                                key={med.id} 
                                sx={{ 
                                  p: 2, 
                                  mb: 2, 
                                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                                  borderRadius: 1.5,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                  '&:last-child': {
                                    mb: 0
                                  }
                                }}
                              >
                                <Typography 
                                  variant="subtitle2"
                                  sx={{ 
                                    fontWeight: 600,
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  {med.medicamento_nombre}:
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Dosis:</strong> {med.dosis}, <strong>Frecuencia:</strong> {med.frecuencia}, <strong>Duración:</strong> {med.duracion} - <Chip 
                                    label={`${med.cantidad} uds.`} 
                                    size="small" 
                                    variant="outlined"
                                    color="primary"
                                    sx={{ 
                                      height: 20, 
                                      fontSize: '0.7rem',
                                      borderRadius: 1
                                    }}
                                  />
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
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
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            boxShadow: `0 10px 40px 0 ${alpha(theme.palette.grey[900], 0.2)}`,
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.03)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MedicationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="span" fontWeight={600}>
              Agregar medicamento a la receta
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={medicamentosDisponibles}
                getOptionLabel={(option) => option.nombre || ''}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Seleccionar medicamento" 
                    placeholder="Buscar por nombre de medicamento..."
                    fullWidth 
                    InputProps={{
                      ...params.InputProps,
                      sx: {
                        borderRadius: 2,
                      }
                    }}
                  />
                )}
                value={medicamentoSeleccionado}
                onChange={(_, value) => handleMedicamentoChange(value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dosis (ej. 1 tableta, 5ml)"
                name="dosis"
                value={nuevoDatosMedicamento.dosis}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                placeholder="Especifique la dosis..."
                InputProps={{
                  sx: {
                    borderRadius: 2,
                  }
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Frecuencia (ej. cada 8 horas)"
                name="frecuencia"
                value={nuevoDatosMedicamento.frecuencia}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                placeholder="Especifique la frecuencia..."
                InputProps={{
                  sx: {
                    borderRadius: 2,
                  }
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duración (ej. 7 días)"
                name="duracion"
                value={nuevoDatosMedicamento.duracion}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                placeholder="Especifique la duración..."
                InputProps={{
                  sx: {
                    borderRadius: 2,
                  }
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cantidad"
                name="cantidad"
                type="number"
                value={nuevoDatosMedicamento.cantidad}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                InputProps={{ 
                  inputProps: { min: 1 },
                  sx: {
                    borderRadius: 2,
                  }
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          
          {medicamentoSeleccionado && (
            <Alert 
              severity="info" 
              variant="outlined"
              sx={{ 
                mt: 1, 
                borderRadius: 2,
                boxShadow: 'none'
              }}
            >
              <Typography variant="body2">
                <strong>Stock disponible:</strong> {medicamentoSeleccionado.stock_actual || 'No disponible'} unidades
              </Typography>
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            px: 3, 
            py: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            bgcolor: alpha(theme.palette.background.default, 0.5)
          }}
        >
          <Button 
            onClick={handleCloseMedicamentoDialog} 
            color="inherit"
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddMedicamento} 
            color="primary" 
            variant="contained"
            startIcon={<AddIcon />}
            disabled={
              !medicamentoSeleccionado || 
              !nuevoDatosMedicamento.dosis || 
              !nuevoDatosMedicamento.frecuencia || 
              !nuevoDatosMedicamento.duracion || 
              nuevoDatosMedicamento.cantidad < 1
            }
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              fontWeight: 500,
              boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
              '&:hover': {
                boxShadow: `0 6px 15px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              }
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