// src/pages/citas/CitaForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FormHelperText
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
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

const CitaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<Consulta>({
    mascota: 0,
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
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isEdit, id, user?.id, user?.rol]);

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
      setFormData(prev => ({
        ...prev,
        fecha: date.toISOString()
      }));

      if (errors.fecha) {
        setErrors(prev => ({ ...prev, fecha: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
  if (!validateForm()) {
    return;
  }

  setSaving(true);
  try {
    const formattedData = {
      ...formData,
      // Aseguramos que el estado sea 'PROGRAMADA' para nuevas citas
      estado: isEdit ? formData.estado : 'PROGRAMADA',
      // Verificamos que la fecha esté en formato ISO
      fecha: new Date(formData.fecha).toISOString(),
    };

    if (isEdit && id) {
      await citasApi.updateConsulta(parseInt(id), formattedData);
    } else {
      await citasApi.createConsulta(formattedData);
    }

    // Mensaje de éxito
    // Podrías usar un Snackbar de Material UI aquí
    navigate('/citas');
  } catch (error) {
    console.error('Error al guardar consulta:', error);
    // Notificar al usuario del error
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
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.fecha,
                      helperText: errors.fecha,
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
    </Container>
  );
};

export default CitaForm;