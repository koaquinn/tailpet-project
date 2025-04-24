// src/pages/mascotas/MascotaForm.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Grid, Paper,
  Divider, Switch, FormControlLabel, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Snackbar,
  FormHelperText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PetsIcon from '@mui/icons-material/Pets';
import { 
  getMascota, createMascota, updateMascota, getEspecies, getRazas,
  Mascota, Especie, Raza 
} from '../../api/mascotaApi';
import { getClientes, Cliente } from '../../api/clienteApi';

interface FormErrors {
  nombre?: string;
  cliente?: string;
  especie?: string;
  raza?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  microchip?: string;
  [key: string]: string | undefined;
}

const MascotaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [razas, setRazas] = useState<Raza[]>([]);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState<Mascota>({
    nombre: '',
    cliente: 0,
    especie: 0,
    raza: 0,
    fecha_nacimiento: currentDate,
    sexo: 'M',
    esterilizado: false,
    microchip: '',
    activo: true
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clientesData, especiesData] = await Promise.all([
          getClientes(),
          getEspecies()
        ]);
        
        setClientes(clientesData.results || []);
        setEspecies(especiesData.results || []);
        
        if (isEdit && id) {
          const mascotaData = await getMascota(Number(id));
          setFormData({
            nombre: mascotaData.nombre,
            cliente: mascotaData.cliente,
            especie: mascotaData.especie,
            raza: mascotaData.raza,
            fecha_nacimiento: mascotaData.fecha_nacimiento,
            sexo: mascotaData.sexo,
            esterilizado: mascotaData.esterilizado,
            microchip: mascotaData.microchip || '',
            activo: mascotaData.activo
          });
          
          // Cargar razas de la especie seleccionada
          if (mascotaData.especie) {
            const razasData = await getRazas(mascotaData.especie);
            setRazas(razasData.results || []);
          }
        }
      } catch (error) {
        showNotification('Error al cargar datos iniciales', 'error');
        console.error(error);
      } finally {
        setDataLoading(false);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [isEdit, id, currentDate]);
  
  // Cargar razas cuando cambia la especie
  useEffect(() => {
    const fetchRazas = async () => {
      if (formData.especie) {
        try {
          const razasData = await getRazas(formData.especie);
          setRazas(razasData.results || []);
          
          // Si la raza actual no pertenece a la especie seleccionada, resetear
          const razaActualValida = razasData.results?.some(
            raza => raza.id === formData.raza
          );
          
          if (!razaActualValida) {
            setFormData(prev => ({
              ...prev,
              raza: 0
            }));
            
            // Limpiar error de raza si existe
            if (errors.raza) {
              setErrors(prev => ({
                ...prev,
                raza: undefined
              }));
            }
          }
        } catch (error) {
          console.error("Error al cargar razas:", error);
          showNotification('Error al cargar las razas', 'error');
        }
      } else {
        setRazas([]);
      }
    };
    
    fetchRazas();
  }, [formData.especie]);
  
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.cliente) newErrors.cliente = 'El cliente es requerido';
    if (!formData.especie) newErrors.especie = 'La especie es requerida';
    if (!formData.raza) newErrors.raza = 'La raza es requerida';
    if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!formData.sexo) newErrors.sexo = 'El sexo es requerido';
    
    // Validación de microchip (opcional pero con formato específico si se proporciona)
    if (formData.microchip && formData.microchip.length > 0) {
      if (formData.microchip.length < 8 || formData.microchip.length > 15) {
        newErrors.microchip = 'El microchip debe tener entre 8 y 15 caracteres';
      } else if (!/^[a-zA-Z0-9]+$/.test(formData.microchip)) {
        newErrors.microchip = 'El microchip solo debe contener letras y números';
      }
    }
    
    // Validación de fecha (no futura)
    const fechaNacimiento = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    if (fechaNacimiento > hoy) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error cuando el usuario comienza a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setFormData(prev => ({
      ...prev,
      [name]: ['cliente', 'especie', 'raza'].includes(name)
        ? Number(value)
        : value
    }));
    
    // Limpiar error cuando el usuario selecciona una opción
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        fecha_nacimiento: formattedDate
      }));
      
      // Limpiar error de fecha
      if (errors.fecha_nacimiento) {
        setErrors(prev => ({
          ...prev,
          fecha_nacimiento: undefined
        }));
      }
    }
  };
  
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      if (isEdit && id) {
        await updateMascota(Number(id), formData);
        showNotification('Mascota actualizada correctamente', 'success');
      } else {
        await createMascota(formData);
        showNotification('Mascota creada correctamente', 'success');
      }
      
      // Redireccionar después de un breve retraso
      setTimeout(() => {
        navigate('/mascotas');
      }, 1500);
    } catch (error) {
      showNotification('Error al guardar la mascota. Inténtalo de nuevo.', 'error');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  if (dataLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/mascotas')}
        >
          Volver a lista de mascotas
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PetsIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h1">
            {isEdit ? 'Editar Mascota' : 'Nueva Mascota'}
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
                disabled={saving}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.cliente} required disabled={saving}>
                <InputLabel>Cliente (Dueño)</InputLabel>
                <Select
                  name="cliente"
                  value={formData.cliente ? formData.cliente.toString() : ''}
                  label="Cliente (Dueño)"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">Seleccionar cliente</MenuItem>
                  {clientes.map(cliente => (
                    <MenuItem key={cliente.id} value={cliente.id?.toString()}>
                      {cliente.nombre} {cliente.apellido} - {cliente.rut}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cliente && <FormHelperText>{errors.cliente}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.especie} required disabled={saving}>
                <InputLabel>Especie</InputLabel>
                <Select
                  name="especie"
                  value={formData.especie ? formData.especie.toString() : ''}
                  label="Especie"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">Seleccionar especie</MenuItem>
                  {especies.map(especie => (
                    <MenuItem key={especie.id} value={especie.id.toString()}>
                      {especie.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.especie && <FormHelperText>{errors.especie}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.raza} required disabled={saving || !formData.especie}>
                <InputLabel>Raza</InputLabel>
                <Select
                  name="raza"
                  value={formData.raza ? formData.raza.toString() : ''}
                  label="Raza"
                  onChange={handleSelectChange}
                  disabled={!formData.especie || saving}
                >
                  <MenuItem value="">Seleccionar raza</MenuItem>
                  {razas.map(raza => (
                    <MenuItem key={raza.id} value={raza.id.toString()}>
                      {raza.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.raza && <FormHelperText>{errors.raza}</FormHelperText>}
                {!formData.especie && <FormHelperText>Seleccione primero una especie</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de nacimiento"
                  value={formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento) : null}
                  onChange={handleDateChange}
                  format="dd/MM/yyyy"
                  maxDate={new Date()} // No permitir fechas futuras
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.fecha_nacimiento,
                      helperText: errors.fecha_nacimiento,
                      disabled: saving
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.sexo} required disabled={saving}>
                <InputLabel>Sexo</InputLabel>
                <Select
                  name="sexo"
                  value={formData.sexo}
                  label="Sexo"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="M">Macho</MenuItem>
                  <MenuItem value="H">Hembra</MenuItem>
                </Select>
                {errors.sexo && <FormHelperText>{errors.sexo}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Microchip (opcional)"
                name="microchip"
                value={formData.microchip}
                onChange={handleChange}
                error={!!errors.microchip}
                helperText={errors.microchip || 'Formato alfanumérico, 8-15 caracteres'}
                disabled={saving}
                inputProps={{ maxLength: 15 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.esterilizado}
                    onChange={handleChange}
                    name="esterilizado"
                    color="primary"
                    disabled={saving}
                  />
                }
                label="Esterilizado"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={handleChange}
                    name="activo"
                    color="primary"
                    disabled={saving}
                  />
                }
                label="Mascota Activa"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/mascotas')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
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

export default MascotaForm;