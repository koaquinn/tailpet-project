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
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import consultaApi from '../../api/consultaApi';
import citasApi from '../../api/citasApi';
import { getMascota } from '../../api/mascotaApi';
import inventarioApi from '../../api/inventarioApi';
import { useAuth } from '../../context/AuthContext';

// --- Definiciones de Tipos/Interfaces ---
interface MedicamentoDisponible {
  id: number;
  nombre: string;
}

interface MascotaDetalle {
  id: number;
  nombre: string;
  especie_nombre?: string;
  raza_nombre?: string;
  sexo: 'M' | 'H' | string;
  activo: boolean;
  fecha_nacimiento?: string | null;
}

// MODIFICADO: Asegúrate que esta interfaz coincida con la de tu consultaApi.ts o impórtala directamente.
// Asumimos que el backend y consultaApi.ts usan EN_CURSO (con guion bajo) internamente.
interface ConsultaEnCurso {
  id: number;
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | string; // MODIFICADO para usar EN_CURSO
  fecha: string;
  tipo?: string;
  motivo?: string;
  veterinario_nombre?: string;
  mascota: number; // ID de la mascota
  diagnostico?: string | null;
  observaciones?: string | null;
  peso_actual?: number | string | null;
  temperatura?: number | string | null;
  sintomas?: string | null;
  tratamiento?: string | null;
  // Si la API devuelve estos campos en la consulta principal:
  mascota_nombre?: string;
  cliente_nombre?: string;
  veterinario?: number; // ID del veterinario
  medicamentos?: Array<{ // Estructura según tu consultaApi.ts
    id: number;
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
  }>;
}


const CONSULTA_STEPS = ['Triage', 'Diagnóstico', 'Tratamiento', 'Finalización'];

// MODIFICADO: getEstadoColor ahora espera 'EN_CURSO' (con guion bajo)
const getEstadoColor = (estado: string): 'primary' | 'warning' | 'success' | 'error' | 'default' => {
  switch (estado) {
    case 'PROGRAMADA': return 'primary';
    case 'EN_CURSO': return 'warning'; // Coincide con el valor interno/API
    case 'COMPLETADA': return 'success';
    case 'CANCELADA': return 'error'; // Asumiendo que CANCELADA es un estado posible
    default: return 'default'; // O 'error' si prefieres
  }
};

// NUEVO: Función para formatear la etiqueta del estado para visualización
const formatEstadoDisplay = (estado: string): string => {
  if (estado === 'EN_CURSO') {
    return 'EN CURSO'; // Muestra con espacio
  }
  return estado.replace(/_/g, ' '); // Reemplazo genérico
};


const calculateAgeImproved = (fechaNacimiento: string | null | undefined): string => {
  if (!fechaNacimiento) return 'N/A';
  const birthDate = new Date(fechaNacimiento);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return 'Fecha inválida';
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  if (years > 0) {
    if (months > 0) {
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  } else {
    if (months > 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    const days = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Fecha futura';
    return `${days} ${days === 1 ? 'día' : 'días'}`;
  }
};


const ConsultaPanel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const [consulta, setConsulta] = useState<ConsultaEnCurso | null>(null);
  const [mascota, setMascota] = useState<MascotaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    diagnostico: '',
    observaciones: '',
    peso_actual: '',
    temperatura: '',
    sintomas: '',
    tratamiento: '',
  });

  const [medicamentos, setMedicamentos] = useState<Array<{
    id: number; // ID temporal para la UI, o el ID real si se carga
    medicamento: number; // ID del medicamento del inventario
    medicamento_nombre?: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    cantidad: number;
  }>>([]);

  const [medicamentoDialogOpen, setMedicamentoDialogOpen] = useState(false);
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState<MedicamentoDisponible[]>([]);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState<MedicamentoDisponible | null>(null);
  const [nuevoDatosMedicamento, setNuevoDatosMedicamento] = useState({
    dosis: '',
    frecuencia: '',
    duracion: '',
    cantidad: 1,
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('ID de consulta no válido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Usar consultaApi.getConsulta que ahora espera 'EN_CURSO' del backend
        let consultaData = await consultaApi.getConsulta(parseInt(id)); 

        if (consultaData.estado === 'PROGRAMADA') {
          const consultaIniciada = await consultaApi.iniciarConsulta(parseInt(id));
          consultaData = consultaIniciada; // Usar la data retornada por iniciarConsulta
          showNotification('Consulta iniciada.', 'info');
        }
        
        setConsulta(consultaData);

        if (consultaData.mascota) { // mascota es el ID
          const mascotaData = await getMascota(consultaData.mascota) as MascotaDetalle;
          setMascota(mascotaData);
        }

        setFormData({
          diagnostico: consultaData.diagnostico || '',
          observaciones: consultaData.observaciones || '',
          peso_actual: consultaData.peso_actual?.toString() || '',
          temperatura: consultaData.temperatura?.toString() || '',
          sintomas: consultaData.sintomas || '',
          tratamiento: consultaData.tratamiento || '',
        });
        
        // Cargar medicamentos si ya existen para esta consulta (ej. si se retoma una consulta guardada)
        if (consultaData.medicamentos && consultaData.medicamentos.length > 0) {
            setMedicamentos(consultaData.medicamentos.map(medAPI => ({
                id: medAPI.id, // Asumiendo que la API devuelve un ID para el medicamento en la receta
                medicamento: medAPI.id, // O si tienes un campo 'medicamento_id' en medAPI
                medicamento_nombre: medAPI.nombre,
                dosis: medAPI.dosis,
                frecuencia: medAPI.frecuencia,
                duracion: medAPI.duracion,
                cantidad: 1, // Ajustar si la API devuelve cantidad
            })));
        }


        const medicamentosResponse = await inventarioApi.getMedicamentos({ stock_minimo: 1 });
        setMedicamentosDisponibles(medicamentosResponse.results || []);

      } catch (err) {
        console.error('Error al cargar datos de la consulta:', err);
        const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
        setError(`Error al cargar datos: ${errorMessage}`);
        showNotification('Error al cargar datos. Intente de nuevo.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (activeStep === 1 && !formData.diagnostico.trim()) {
        showNotification('El diagnóstico es obligatorio para continuar.', 'warning');
        return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

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

  const handleMedicamentoDatosChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoDatosMedicamento(prev => ({
      ...prev,
      [name]: name === 'cantidad' ? parseInt(value) || 1 : value
    }));
  };

  const handleAddMedicamento = () => {
    if (!medicamentoSeleccionado ||
        !nuevoDatosMedicamento.dosis.trim() ||
        !nuevoDatosMedicamento.frecuencia.trim() ||
        !nuevoDatosMedicamento.duracion.trim() ||
        nuevoDatosMedicamento.cantidad <= 0
    ) {
      showNotification('Complete todos los campos del medicamento y seleccione uno.', 'warning');
      return;
    }

    const nuevoMedicamento = {
      id: Date.now(), // ID temporal para la UI
      medicamento: medicamentoSeleccionado.id, // ID del medicamento del inventario
      medicamento_nombre: medicamentoSeleccionado.nombre,
      ...nuevoDatosMedicamento,
    };

    setMedicamentos(prev => [...prev, nuevoMedicamento]);
    showNotification(`${medicamentoSeleccionado.nombre} agregado a la receta.`, 'success');
    handleCloseMedicamentoDialog();
  };

  const handleRemoveMedicamento = (idToRemove: number) => {
    const medToRemove = medicamentos.find(med => med.id === idToRemove);
    setMedicamentos(prev => prev.filter(med => med.id !== idToRemove));
    if (medToRemove?.medicamento_nombre) {
      showNotification(`${medToRemove.medicamento_nombre} eliminado de la receta.`, 'info');
    }
  };

  const handleSaveConsulta = async () => {
    if (!consulta || !id) return;

    setSaving(true);
    try {
      const consultaDataToSave = { // Solo los campos que actualiza citasApi.updateConsulta
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
        sintomas: formData.sintomas,
        tratamiento: formData.tratamiento,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        peso_actual: formData.peso_actual ? parseFloat(formData.peso_actual) : null,
        // El estado no se envía aquí, se maneja por iniciar/completar
      };
      // Asumiendo que updateConsulta no cambia el estado, solo guarda datos parciales.
      // Si tu API espera que 'citasApi.updateConsulta' también actualice el estado, debes pasarlo.
      await citasApi.updateConsulta(parseInt(id), consultaDataToSave); 
      
      // Sincronizar medicamentos si es necesario o si hay un endpoint específico para "guardar borrador de receta"
      // if (medicamentos.length > 0) {
      //   // Lógica para guardar borrador de medicamentos si existe tal endpoint
      // }

      showNotification('Progreso de la consulta guardado exitosamente.', 'success');
    } catch (err) {
      console.error('Error al guardar la consulta:', err);
      showNotification('Ocurrió un error al guardar el progreso.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompletarConsulta = async () => {
    if (!consulta || !id) return;

    if (!formData.diagnostico.trim()) {
      showNotification('Debe ingresar un diagnóstico antes de completar la consulta.', 'error');
      setActiveStep(1);
      return;
    }

    setSaving(true);
    try {
      const consultaCompletaData = {
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
        sintomas: formData.sintomas,
        tratamiento: formData.tratamiento,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        peso_actual: formData.peso_actual ? parseFloat(formData.peso_actual) : null,
        
      };

      await consultaApi.completarConsulta(parseInt(id), consultaCompletaData);

      if (medicamentos.length > 0) {
        const medicamentosDataApi = medicamentos.map(med => ({
          medicamento: med.medicamento, // ID del medicamento de inventario
          dosis: med.dosis,
          frecuencia: med.frecuencia,
          duracion: med.duracion,
          cantidad: med.cantidad,
        }));
        await consultaApi.registrarMedicamentos(parseInt(id), medicamentosDataApi);
      }

      showNotification('Consulta completada y registrada exitosamente.', 'success');
      setTimeout(() => {
        navigate('/citas');
      }, 2000);

    } catch (err) {
      console.error('Error al completar la consulta:', err);
      showNotification('Ocurrió un error al completar la consulta.', 'error');
    } finally {
      setSaving(false);
    }
  };


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
          sx={{ py: 2, borderRadius: 2, boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}` }}
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
          sx={{ py: 2, borderRadius: 2, boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}` }}
        >
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
            No se encontró la consulta o la mascota.
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

  return (
    <Container maxWidth="lg" >
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
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', color: theme.palette.text.primary }}
          >
            <HospitalIcon sx={{ mr: 1.5, color: theme.palette.secondary.main, fontSize: 32 }} />
            Panel de Consulta
            <Chip
              label={formatEstadoDisplay(consulta.estado)} // MODIFICADO: Usa la función de formateo
              color={getEstadoColor(consulta.estado)} // getEstadoColor usa el valor interno (ej. 'EN_CURSO')
              size="small"
              sx={{ ml: 2, fontWeight: 600, px: 1, borderRadius: 1.5 }}
            />
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/citas"
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500 }}
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

            <Grid container spacing={2} justifyContent={'center'}>
              {[
                { label: 'Nombre', value: mascota.nombre },
                { label: 'Especie', value: mascota.especie_nombre || 'No registrada' },
                { label: 'Raza', value: mascota.raza_nombre || 'No registrada' },
                { label: 'Edad', value: calculateAgeImproved(mascota.fecha_nacimiento)},
                { label: 'Sexo', value: mascota.sexo === 'M' ? 'Macho' : mascota.sexo === 'H' ? 'Hembra' : 'No registrado' },
                { label: 'Estado Mascota', value: <Chip
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
                  <Box sx={{ p: 1 }} textAlign={'center'}>
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

            <Grid container spacing={2} justifyContent={'center'}>
              <Grid item xs={6}>
                <Box sx={{ p: 1 }} textAlign={'center'}>
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
                <Box sx={{ p: 1 }} textAlign={'center'}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, mb: 0.5, fontWeight: 500 }}>
                    Tipo de Consulta
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.4 }}>
                    {consulta.tipo || 'No especificado'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1 }} >
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
                <Box sx={{ p: 1 }} textAlign={'center'}>
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

      <Paper
        elevation={3}
        sx={{ p: 3, mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: `0 6px 24px 0 ${alpha(theme.palette.grey[500], 0.1)}, 0 3px 12px 0 ${alpha(theme.palette.grey[500], 0.08)}` }}
      >
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-root .Mui-completed': { color: theme.palette.success.main }, '& .MuiStepLabel-root .Mui-active': { color: theme.palette.primary.main } }}>
          {CONSULTA_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Contenido de los Steps (sin cambios respecto a la lógica interna, solo asegúrate que el flujo de datos es correcto) */}
        <Box sx={{ mt: 2, minHeight: 320 }}>
          {activeStep === 0 && (
            <Fade in={activeStep === 0}>
              <Grid container spacing={3} justifyContent={'center'}>
                <Grid item xs={12} md={8} lg={6}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: '100%', boxShadow: '0px 2px 10px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
                    <Box textAlign="center" mb={3}>
                      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        <ThermostatIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                        Signos Vitales
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField fullWidth label="Temperatura (°C)" name="temperatura" type="number" value={formData.temperatura} onChange={handleInputChange} InputProps={{ inputProps: { min: 35, max: 43, step: 0.1 }, endAdornment: <InputAdornment position="end">°C</InputAdornment> }} variant="outlined" size="medium" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                      <TextField fullWidth label="Peso" name="peso_actual" type="number" value={formData.peso_actual} onChange={handleInputChange} InputProps={{ inputProps: { min: 0, step: 0.1 }, endAdornment: <InputAdornment position="end">kg</InputAdornment> }} variant="outlined" size="medium" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: '100%', boxShadow: '0px 2px 10px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
                    <Box textAlign="center" mb={3}>
                      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        <InfoIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                        Síntomas
                      </Typography>
                    </Box>
                    <TextField fullWidth multiline rows={8} placeholder="Describa detalladamente los síntomas que presenta la mascota..." name="sintomas" value={formData.sintomas} onChange={handleInputChange} variant="outlined" size="medium" sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, height: '100%', alignItems: 'flex-start' }, '& .MuiOutlinedInput-multiline': { padding: 2, height: '100%' } }} />
                  </Card>
                </Grid>
                  <Grid item xs={12} md={8} lg={6}>
                  <Alert severity="info" icon={<InfoIcon fontSize="large" />} sx={{ borderRadius: 2, alignItems: 'center', fontSize: '1rem', '& .MuiAlert-message': { py: 1.5 } }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Registre los valores básicos para iniciar la consulta. Puede continuar si no cuenta con todos.
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
                  <Grid item xs={12} md={8} lg={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', fontWeight: 600}}>
                        <MedicalServicesIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        Diagnóstico
                      </Typography>
                      <TextField fullWidth label="Diagnóstico del paciente *" name="diagnostico" multiline rows={6} required value={formData.diagnostico} onChange={handleInputChange} error={!formData.diagnostico.trim() && activeStep === 1} helperText={!formData.diagnostico.trim() && activeStep === 1 ? 'Campo obligatorio para finalizar la consulta' : ''} />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={8} lg={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', fontWeight: 600}}>
                        <InfoIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                        Observaciones Adicionales
                      </Typography>
                      <TextField fullWidth multiline rows={6} name="observaciones" label="Observaciones (opcional)" value={formData.observaciones} onChange={handleInputChange} />
                    </Card>
                  </Grid>
                </Grid>
                  <Box sx={{ width: '100%', mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Grid item xs={12} md={8} lg={6}>
                    <Alert severity="warning" sx={{ borderRadius: 2, width: '100%' }}>
                        El diagnóstico es obligatorio para poder completar la consulta.
                    </Alert>
                    </Grid>
                  </Box>
              </Box>
            </Fade>
          )}

          {activeStep === 2 && ( 
            <Fade in={activeStep === 2}>
              <Box sx={{ width: '100%' }}>
                <Grid container spacing={3} justifyContent="center">
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: '100%', boxShadow: '0px 2px 10px rgba(0,0,0,0.08)' }}>
                      <Box textAlign="center" mb={3}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          <HealingIcon color="primary" sx={{ mr: 1 }} />
                          Tratamiento Recomendado
                        </Typography>
                      </Box>
                      <TextField fullWidth name="tratamiento" multiline rows={6} value={formData.tratamiento} onChange={handleInputChange} placeholder="Describa detalladamente el tratamiento a seguir..." variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiOutlinedInput-multiline': { padding: 2 } }} />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 3, height: '100%', boxShadow: '0px 2px 10px rgba(0,0,0,0.08)' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                          <MedicationIcon color="primary" sx={{ mr: 1 }} />
                          Medicamentos Recetados
                        </Typography>
                        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenMedicamentoDialog} sx={{ borderRadius: 2, px: 2, py: 1, fontWeight: 500, textTransform: 'none' }}>
                          Agregar
                        </Button>
                      </Box>
                      <Divider sx={{ mb: 3 }} />
                      {medicamentos.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2, alignItems: 'center' }}>
                          <Typography variant="body2">No se han agregado medicamentos a la receta.</Typography>
                        </Alert>
                      ) : (
                        <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
                          {medicamentos.map((med) => (
                            <Card key={med.id} variant="outlined" sx={{ mb: 2, borderRadius: 2, '&:last-child': { mb: 0 } }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="subtitle1" fontWeight={600}>{med.medicamento_nombre}</Typography>
                                  <IconButton onClick={() => handleRemoveMedicamento(med.id)} size="small" color="error"><DeleteIcon /></IconButton>
                                </Box>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Dosis:</Typography><Typography>{med.dosis}</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Frecuencia:</Typography><Typography>{med.frecuencia}</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Duración:</Typography><Typography>{med.duracion}</Typography></Grid>
                                  <Grid item xs={6}><Typography variant="body2" color="text.secondary">Cantidad:</Typography><Chip label={`${med.cantidad} uds.`} size="small" variant="outlined" /></Grid>
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
                <Box sx={{ textAlign: 'center', mb: 4, p: 3, bgcolor: alpha(theme.palette.success.light, 0.1), borderRadius: 3, borderLeft: `4px solid ${theme.palette.success.main}` }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Resumen Final de la Consulta</Typography>
                  <Typography variant="body1">Revise cuidadosamente toda la información antes de completar.</Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 4, borderRadius: 2, borderLeft: `4px solid ${theme.palette.info.main}` }}>
                  <Typography variant="body1">Al confirmar, los datos quedarán registrados en el historial médico.</Typography>
                </Alert>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}><MedicalServicesIcon sx={{ mr: 1, color: theme.palette.primary.main }} />Diagnóstico</Typography>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}><Typography>{formData.diagnostico || 'No se registró diagnóstico.'}</Typography></Paper>
                </Box>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}><HealingIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />Tratamiento</Typography>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}><Typography>{formData.tratamiento || 'No se registró tratamiento.'}</Typography></Paper>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}><MedicationIcon sx={{ mr: 1, color: theme.palette.info.main }} />Medicamentos Recetados ({medicamentos.length})</Typography>
                  {medicamentos.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>No se prescribieron medicamentos.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {medicamentos.map((med) => (
                        <Grid item xs={12} sm={6} md={4} key={med.id}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>{med.medicamento_nombre}</Typography>
                              <Chip label={`${med.cantidad} uds.`} size="small" color="primary" />
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <Button variant="outlined" color="inherit" disabled={activeStep === 0 || saving} onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ borderRadius: 2, px: 2, py: 1, textTransform: 'none' }}>Anterior</Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button color="primary" variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveConsulta} disabled={saving} sx={{ borderRadius: 2, px: 2, py: 1, textTransform: 'none' }}>{saving ? 'Guardando...' : 'Guardar progreso'}</Button>
              {activeStep === CONSULTA_STEPS.length - 1 ? (
                <Button color="success" variant="contained" startIcon={<CheckCircleIcon />} onClick={handleCompletarConsulta} disabled={saving || !formData.diagnostico.trim()} sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 600, boxShadow: `0 4px 12px 0 ${alpha(theme.palette.success.main, 0.3)}`, '&:hover': { boxShadow: `0 6px 15px 0 ${alpha(theme.palette.success.main, 0.4)}` } }}>{saving ? 'Finalizando...' : 'Completar consulta'}</Button>
              ) : (
                <Button color="primary" variant="contained" onClick={handleNext} disabled={saving || (activeStep === 1 && !formData.diagnostico.trim())} endIcon={<ArrowForwardIcon />} sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 500, boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.2)}`, '&:hover': { boxShadow: `0 6px 15px 0 ${alpha(theme.palette.primary.main, 0.3)}` } }}>Siguiente</Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={medicamentoDialogOpen}
        onClose={handleCloseMedicamentoDialog}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, padding: {xs: 2, sm: 3}, minWidth: {xs: '90%', sm: '400px'} } }}
      >
        <DialogTitle sx={{ p: 0, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <MedicationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Agregar medicamento
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={medicamentosDisponibles}
                getOptionLabel={(option) => option.nombre || ''}
                value={medicamentoSeleccionado}
                onChange={(event, newValue) => {
                  setMedicamentoSeleccionado(newValue);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar medicamento *"
                    variant="outlined"
                    size="small"
                  />
                )}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Dosis (ej. 1 tableta, 5ml) *" name="dosis" value={nuevoDatosMedicamento.dosis} onChange={handleMedicamentoDatosChange} variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Frecuencia (ej. cada 8h) *" name="frecuencia" value={nuevoDatosMedicamento.frecuencia} onChange={handleMedicamentoDatosChange} variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Duración (ej. 7 días) *" name="duracion" value={nuevoDatosMedicamento.duracion} onChange={handleMedicamentoDatosChange} variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Cantidad a recetar *" name="cantidad" type="number" value={nuevoDatosMedicamento.cantidad} onChange={handleMedicamentoDatosChange} variant="outlined" size="small" InputProps={{ inputProps: { min: 1 } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 0, mt: 3, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseMedicamentoDialog} variant="outlined" sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}>Cancelar</Button>
          <Button onClick={handleAddMedicamento} variant="contained" color="primary" startIcon={<AddIcon />} sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}>Agregar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={5000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: '100%', borderRadius: 2, boxShadow: `0 4px 20px 0 ${alpha(notification.severity === 'success' ? theme.palette.success.main : notification.severity === 'error' ? theme.palette.error.main : notification.severity === 'warning' ? theme.palette.warning.main : theme.palette.info.main, 0.3)}` }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ConsultaPanel;
