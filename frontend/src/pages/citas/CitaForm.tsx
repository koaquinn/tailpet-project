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
  Snackbar
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { format, setHours, setMinutes, isBefore, isAfter } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
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
  { value: 'RUTINA', label: 'Rutina' },
  { value: 'EMERGENCIA', label: 'Emergencia' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
];

const ESTADOS_CONSULTA = [
  { value: 'PROGRAMADA', label: 'Programada' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

// Horario laboral: 8 AM a 9 PM
const HORA_INICIO = 8; // 8:00 AM
const HORA_FIN = 21; // 9:00 PM (21:00 en formato 24h)

const CitaForm: React.FC = () => {
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
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Función para mostrar notificaciones
  const showNotification = (message: string, severity: 'success' | 'error') => {
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
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/citas')}
        >
          Volver a consultas
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEdit ? 'Editar Consulta' : 'Nueva Consulta'}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Las consultas solo pueden programarse entre las {HORA_INICIO}:00 AM y las {HORA_FIN - 12}:00 PM.
        </Alert>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.mascota}>
                <InputLabel>Mascota *</InputLabel>
                <Select
                  name="mascota"
                  value={formData.mascota.toString()}
                  label="Mascota *"
                  onChange={handleSelectChange}
                  disabled={saving}
                >
                  <MenuItem value="0">Seleccione una mascota</MenuItem>
                  {mascotas.map(mascota => (
                    <MenuItem key={mascota.id} value={mascota.id?.toString()}>
                      {mascota.nombre} ({mascota.cliente_nombre || 'Cliente'})
                    </MenuItem>
                  ))}
                </Select>
                {errors.mascota && <FormHelperText>{errors.mascota}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.veterinario}>
                <InputLabel>Veterinario *</InputLabel>
                <Select
                  name="veterinario"
                  value={formData.veterinario.toString()}
                  label="Veterinario *"
                  onChange={handleSelectChange}
                  disabled={saving || (user?.rol === 'VETERINARIO')}
                >
                  <MenuItem value="0">Seleccione un veterinario</MenuItem>
                  {veterinarios.map(vet => (
                    <MenuItem key={vet.id} value={vet.id.toString()}>
                      {vet.first_name} {vet.last_name} ({vet.username})
                    </MenuItem>
                  ))}
                </Select>
                {errors.veterinario && <FormHelperText>{errors.veterinario}</FormHelperText>}
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
                      disabled: saving
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.tipo}>
                <InputLabel>Tipo de consulta *</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  label="Tipo de consulta *"
                  onChange={handleSelectChange}
                  disabled={saving}
                >
                  {TIPOS_CONSULTA.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.tipo && <FormHelperText>{errors.tipo}</FormHelperText>}
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
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  label="Estado"
                  onChange={handleSelectChange}
                  disabled={saving || (!isEdit && formData.estado === 'PROGRAMADA')}
                >
                  {ESTADOS_CONSULTA.map(estado => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
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
              />
            </Grid>
            
            {isEdit && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Diagnóstico"
                    name="diagnostico"
                    value={formData.diagnostico || ''}
                    onChange={handleChange}
                    disabled={saving}
                    multiline
                    rows={3}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    name="observaciones"
                    value={formData.observaciones || ''}
                    onChange={handleChange}
                    disabled={saving}
                    multiline
                    rows={2}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/citas')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
                  disabled={saving}
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
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CitaForm;