// src/pages/citas/CitaForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  FormHelperText,
  Snackbar,
  Divider,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { format, setHours, setMinutes, isBefore, isAfter } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EventIcon from '@mui/icons-material/Event';
import PetsIcon from '@mui/icons-material/Pets';
import PersonIcon from '@mui/icons-material/Person';
import citasApi, { Consulta } from '../../api/citasApi';
import { getMascotas, Mascota } from '../../api/mascotaApi';
import authApi, { User } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

interface FormErrors {
  mascota?: string;
  veterinario?: string;
  fecha?: string;
  motivo?: string;
  tipo?: string;
  duracion_estimada?: string;
  [key: string]: string | undefined;
}

const TIPOS_CONSULTA = [
  { value: 'RUTINA', label: 'Rutina', color: 'info' },
  { value: 'EMERGENCIA', label: 'Emergencia', color: 'error' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento', color: 'warning' },
];

const ESTADOS_CONSULTA = [
  { value: 'PROGRAMADA', label: 'Programada', color: 'primary' },
  { value: 'COMPLETADA', label: 'Completada', color: 'success' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'error' },
];

// Horario laboral: 8 AM a 9 PM
const HORA_INICIO = 8; // 8:00 AM
const HORA_FIN = 21; // 9:00 PM (21:00 en formato 24h)

const CitaForm: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  // Obtener mascotaId desde la URL si está disponible
  const searchParams = new URLSearchParams(location.search);
  const mascotaIdParam = searchParams.get('mascotaId');

  const [formData, setFormData] = useState<Consulta>({
    mascota: mascotaIdParam ? parseInt(mascotaIdParam) : 0,
    veterinario: user?.rol === 'VETERINARIO' ? user.id : 0,
    fecha: new Date().toISOString(),
    motivo: '',
    diagnostico: '',
    observaciones: '',
    estado: 'PROGRAMADA',
    tipo: 'RUTINA',
    duracion_estimada: 30,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [veterinarios, setVeterinarios] = useState<User[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Función para mostrar notificaciones
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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Cargar veterinarios
        const usersResponse = await authApi.getUsers();
        const vets = usersResponse.results.filter(u => u.rol === 'VETERINARIO');
        setVeterinarios(vets);

        // Cargar mascotas
        const mascotasResponse = await getMascotas();
        setMascotas(mascotasResponse.results);

        // Si estamos editando, cargar datos de la consulta
        if (isEdit && id) {
          const consultaData = await citasApi.getConsulta(parseInt(id));
          setFormData({
            ...consultaData,
            mascota: consultaData.mascota?.id || 0,
            veterinario: consultaData.veterinario?.id || (user?.rol === 'VETERINARIO' ? user.id : 0)
          });
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showNotification('Error al cargar datos iniciales', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isEdit, id, user?.id, user?.rol, mascotaIdParam]);

  // Función para validar si una fecha está dentro del horario laboral
  const isWithinBusinessHours = (date: Date): boolean => {
    const hours = date.getHours();
    return hours >= HORA_INICIO && hours < HORA_FIN;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.mascota || formData.mascota === 0) {
      newErrors.mascota = 'Seleccione una mascota';
    }

    if (!formData.veterinario || formData.veterinario === 0) {
      newErrors.veterinario = 'Seleccione un veterinario';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'Seleccione una fecha y hora';
    } else {
      const fechaConsulta = new Date(formData.fecha);
      if (!isWithinBusinessHours(fechaConsulta)) {
        newErrors.fecha = `La hora debe estar entre ${HORA_INICIO}:00 AM y ${HORA_FIN - 12}:00 PM`;
      }
    }

    if (!formData.motivo.trim()) {
      newErrors.motivo = 'Ingrese el motivo de la consulta';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Seleccione un tipo de consulta';
    }

    if (!formData.duracion_estimada || formData.duracion_estimada <= 0) {
      newErrors.duracion_estimada = 'Ingrese una duración válida (mayor a 0)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duracion_estimada' ? parseInt(value) || 0 : value
    }));

    // Limpiar error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['mascota', 'veterinario'].includes(name) 
        ? parseInt(value) 
        : value
    }));

    // Limpiar error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Si la hora está fuera del horario laboral, ajustarla
      let adjustedDate = new Date(date);
      const hours = adjustedDate.getHours();
      
      if (hours < HORA_INICIO) {
        // Si es antes de las 8 AM, ajustar a 8 AM
        adjustedDate = setHours(adjustedDate, HORA_INICIO);
        adjustedDate = setMinutes(adjustedDate, 0);
      } else if (hours >= HORA_FIN) {
        // Si es después de las 9 PM, ajustar a 8:30 AM del día siguiente
        adjustedDate = setHours(adjustedDate, HORA_INICIO);
        adjustedDate = setMinutes(adjustedDate, 30);
        adjustedDate.setDate(adjustedDate.getDate() + 1);
      }
      
      setFormData(prev => ({
        ...prev,
        fecha: adjustedDate.toISOString()
      }));

      if (errors.fecha) {
        setErrors(prev => ({ ...prev, fecha: undefined }));
      }

      // Mostrar advertencia si la fecha fue ajustada
      if (
        hours < HORA_INICIO || 
        hours >= HORA_FIN
      ) {
        showNotification(
          `La hora ha sido ajustada para estar dentro del horario laboral (${HORA_INICIO}:00 AM - ${HORA_FIN - 12}:00 PM)`, 
          'info'
        );
      }
    }
  };

  // Para validar si una fecha está dentro del horario permitido
  const shouldDisableTime = (value: Date, view: string): boolean => {
    if (view === 'hours') {
      const hours = value.getHours();
      return hours < HORA_INICIO || hours >= HORA_FIN;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const fechaConsulta = new Date(formData.fecha);
      
      // Verificar una vez más que la fecha está dentro del horario laboral
      if (!isWithinBusinessHours(fechaConsulta)) {
        showNotification(`Las citas solo pueden agendarse entre ${HORA_INICIO}:00 AM y ${HORA_FIN - 12}:00 PM`, 'error');
        setSaving(false);
        return;
      }
      
      const formattedData = {
        ...formData,
        // Aseguramos que el estado sea 'PROGRAMADA' para nuevas citas
        estado: isEdit ? formData.estado : 'PROGRAMADA',
        // Verificamos que la fecha esté en formato ISO
        fecha: fechaConsulta.toISOString(),
      };

      if (isEdit && id) {
        await citasApi.updateConsulta(parseInt(id), formattedData);
        showNotification('Consulta actualizada correctamente', 'success');
      } else {
        await citasApi.createConsulta(formattedData);
        showNotification('Consulta creada correctamente', 'success');
      }

      // Retrasamos la navegación para que el usuario vea el mensaje
      setTimeout(() => {
        navigate('/citas');
      }, 1500);
    } catch (error) {
      console.error('Error al guardar consulta:', error);
      showNotification('Error al guardar la consulta', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando datos de la consulta...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Encontrar objetos de tipo y estado para el formulario
  const tipoConsulta = TIPOS_CONSULTA.find(t => t.value === formData.tipo);
  const estadoConsulta = ESTADOS_CONSULTA.find(e => e.value === formData.estado);

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="text"
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/citas')}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }
          }}
        >
          Volver a consultas
        </Button>
      </Box>
      
      <Paper 
        elevation={3}
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          boxShadow: `0 4px 20px 0 ${alpha(theme.palette.grey[500], 0.1)}, 
                     0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.1)}`
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: 2,
            mb: 2 
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flexGrow: 1
            }}
          >
            <EventIcon 
              sx={{ 
                mr: 1, 
                color: theme.palette.primary.main,
                fontSize: 28
              }} 
            />
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ fontWeight: 600 }}
            >
              {isEdit ? 'Editar Consulta' : 'Nueva Consulta'}
            </Typography>
          </Box>
          
          {isEdit && estadoConsulta && (
            <Chip 
              label={estadoConsulta.label} 
              color={estadoConsulta.color as any}
              sx={{ fontWeight: 500 }}
            />
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Alert 
          severity="info" 
          variant="outlined"
          icon={<EventIcon />}
          sx={{ 
            mb: 3,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            '& .MuiAlert-icon': {
              color: theme.palette.info.main
            }
          }}
        >
          Las consultas solo pueden programarse entre las {HORA_INICIO}:00 AM y las {HORA_FIN - 12}:00 PM.
        </Alert>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                error={!!errors.mascota}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                    }
                  },
                }}
              >
                <InputLabel>Mascota *</InputLabel>
                <Select
                  name="mascota"
                  value={formData.mascota.toString()}
                  label="Mascota *"
                  onChange={handleSelectChange}
                  disabled={saving}
                  startAdornment={
                    <PetsIcon sx={{ ml: 1, mr: 1, color: theme.palette.text.secondary }} />
                  }
                >
                  <MenuItem value="0">Seleccione una mascota</MenuItem>
                  {mascotas.map(mascota => (
                    <MenuItem key={mascota.id} value={mascota.id?.toString()}>
                      {mascota.nombre} ({mascota.cliente_nombre || 'Cliente'})
                    </MenuItem>
                  ))}
                </Select>
                {errors.mascota && (
                  <FormHelperText sx={{ color: theme.palette.error.main }}>
                    {errors.mascota}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                error={!!errors.veterinario}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                    }
                  },
                }}
              >
                <InputLabel>Veterinario *</InputLabel>
                <Select
                  name="veterinario"
                  value={formData.veterinario.toString()}
                  label="Veterinario *"
                  onChange={handleSelectChange}
                  disabled={saving || (user?.rol === 'VETERINARIO')}
                  startAdornment={
                    <PersonIcon sx={{ ml: 1, mr: 1, color: theme.palette.text.secondary }} />
                  }
                >
                  <MenuItem value="0">Seleccione un veterinario</MenuItem>
                  {veterinarios.map(vet => (
                    <MenuItem key={vet.id} value={vet.id.toString()}>
                      {vet.first_name} {vet.last_name} ({vet.username})
                    </MenuItem>
                  ))}
                </Select>
                {errors.veterinario && (
                  <FormHelperText sx={{ color: theme.palette.error.main }}>
                    {errors.veterinario}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y hora *"
                  value={new Date(formData.fecha)}
                  onChange={handleDateChange}
                  // Restricción para horas
                  shouldDisableTime={shouldDisableTime}
                  ampm={true}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.fecha,
                      helperText: errors.fecha || `Horario permitido: ${HORA_INICIO}:00 AM - ${HORA_FIN - 12}:00 PM`,
                      disabled: saving,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: theme.palette.background.paper,
                          transition: 'all 0.2s ease-in-out',
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                          }
                        },
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                error={!!errors.tipo}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                    }
                  },
                }}
              >
                <InputLabel>Tipo de consulta *</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  label="Tipo de consulta *"
                  onChange={handleSelectChange}
                  disabled={saving}
                  // Renderizamos un Chip en el Select
                  renderValue={(selected) => {
                    const tipo = TIPOS_CONSULTA.find(t => t.value === selected);
                    return tipo ? (
                      <Chip 
                        label={tipo.label} 
                        color={tipo.color as any}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    ) : selected;
                  }}
                >
                  {TIPOS_CONSULTA.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      <Chip 
                        label={tipo.label} 
                        color={tipo.color as any}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </MenuItem>
                  ))}
                </Select>
                {errors.tipo && (
                  <FormHelperText sx={{ color: theme.palette.error.main }}>
                    {errors.tipo}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duración estimada (minutos) *"
                name="duracion_estimada"
                type="number"
                value={formData.duracion_estimada}
                onChange={handleChange}
                error={!!errors.duracion_estimada}
                helperText={errors.duracion_estimada}
                disabled={saving}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                    }
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                    }
                  },
                }}
              >
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  label="Estado"
                  onChange={handleSelectChange}
                  disabled={saving || (!isEdit && formData.estado === 'PROGRAMADA')}
                  // Renderizamos un Chip en el Select
                  renderValue={(selected) => {
                    const estado = ESTADOS_CONSULTA.find(e => e.value === selected);
                    return estado ? (
                      <Chip 
                        label={estado.label} 
                        color={estado.color as any}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    ) : selected;
                  }}
                >
                  {ESTADOS_CONSULTA.map(estado => (
                    <MenuItem key={estado.value} value={estado.value}>
                      <Chip 
                        label={estado.label} 
                        color={estado.color as any}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo de la consulta *"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                error={!!errors.motivo}
                helperText={errors.motivo}
                disabled={saving}
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                    }
                  },
                }}
              />
            </Grid>
            
            {isEdit && (
              <>
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      mb: 2
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 2, 
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      }}
                    >
                      Información clínica
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Diagnóstico"
                      name="diagnostico"
                      value={formData.diagnostico || ''}
                      onChange={handleChange}
                      disabled={saving}
                      multiline
                      rows={3}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: theme.palette.background.paper,
                          borderRadius: 1.5,
                        },
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Observaciones"
                      name="observaciones"
                      value={formData.observaciones || ''}
                      onChange={handleChange}
                      disabled={saving}
                      multiline
                      rows={2}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: theme.palette.background.paper,
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 2, 
                  mt: { xs: 2, md: 3 } 
                }}
              >
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/citas')}
                  disabled={saving}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 1.5,
                    borderWidth: 1.5,
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={saving ? 
                    <CircularProgress size={20} sx={{ color: 'white' }} /> : 
                    <SaveIcon />}
                  disabled={saving}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 1.5,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }
                  }}
                >
                  {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: `0 4px 12px ${alpha(
              notification.severity === 'success' ? theme.palette.success.main :
              notification.severity === 'error' ? theme.palette.error.main :
              theme.palette.info.main, 0.3
            )}`,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CitaForm;