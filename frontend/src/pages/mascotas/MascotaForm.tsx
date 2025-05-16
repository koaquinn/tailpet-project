// src/pages/mascotas/MascotaForm.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  FormHelperText,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { format, parseISO, isAfter } from 'date-fns';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Pets as PetsIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import {
  getMascota,
  createMascota,
  updateMascota,
  getEspecies,
  getRazas,
  Mascota,
  Especie,
  Raza,
} from '../../api/mascotaApi';
import { getClientes, Cliente } from '../../api/clienteApi';
import { useAuth } from '../../context/AuthContext';

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
  const location = useLocation();
  const isEdit = Boolean(id);
  const { hasRole } = useAuth();
  
  const canEdit = hasRole('ADMIN') || hasRole('RECEPCIONISTA');
  
  const searchParams = new URLSearchParams(location.search);
  const preselectedClienteId = searchParams.get('clienteId');
  const fromClientView = searchParams.get('fromClientView') === 'true';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [razas, setRazas] = useState<Raza[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState<Mascota>({
    nombre: '',
    cliente: preselectedClienteId ? Number(preselectedClienteId) : 0,
    especie: 0,
    raza: 0,
    fecha_nacimiento: today,
    sexo: 'M',
    esterilizado: false,
    microchip: '',
    activo: true,
  });

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!canEdit) {
      navigate('/forbidden');
    }
  }, [canEdit, navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setDataLoading(true);
        
        const [clientesData, especiesData] = await Promise.all([
          getClientes(),
          getEspecies(),
        ]);

        setClientes(clientesData.results || []);
        setEspecies(especiesData.results || []);

        if (isEdit && id) {
          const mascotaData = await getMascota(Number(id));
          setFormData({
            ...mascotaData,
            nombre: mascotaData.nombre || '',
            cliente: mascotaData.cliente || 0,
            especie: mascotaData.especie || 0,
            raza: mascotaData.raza || 0,
            fecha_nacimiento: mascotaData.fecha_nacimiento || today,
            sexo: mascotaData.sexo || 'M',
            esterilizado: mascotaData.esterilizado || false,
            microchip: mascotaData.microchip || '',
            activo: mascotaData.activo !== undefined ? mascotaData.activo : true,
          });

          if (mascotaData.especie) {
            const razasData = await getRazas(mascotaData.especie);
            setRazas(razasData.results || []);
          }
        } else if (preselectedClienteId) {
          setFormData(prev => ({
            ...prev,
            cliente: Number(preselectedClienteId)
          }));
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
  }, [isEdit, id, preselectedClienteId]);

  useEffect(() => {
    const fetchRazas = async () => {
      if (formData.especie) {
        try {
          const razasData = await getRazas(formData.especie);
          setRazas(razasData.results || []);

          const razaActualValida = razasData.results?.some(
            (raza) => raza.id === formData.raza,
          );

          if (!razaActualValida) {
            setFormData((prev) => ({ ...prev, raza: 0 }));
            if (errors.raza) {
              setErrors((prev) => ({ ...prev, raza: undefined }));
            }
          }
        } catch (error) {
          console.error('Error al cargar razas:', error);
          showNotification('Error al cargar las razas', 'error');
        }
      } else {
        setRazas([]);
      }
    };

    fetchRazas();
  }, [formData.especie]);

  useEffect(() => {
    if (isEdit && !loading && !dataLoading) {
      setHasChanges(true);
    }
  }, [formData, isEdit, loading, dataLoading]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.cliente) newErrors.cliente = 'El cliente es requerido';
    if (!formData.especie) newErrors.especie = 'La especie es requerida';
    if (!formData.raza) newErrors.raza = 'La raza es requerida';
    if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!formData.sexo) newErrors.sexo = 'El sexo es requerido';

    if (formData.microchip) {
      if (formData.microchip.length < 8 || formData.microchip.length > 15) {
        newErrors.microchip = 'El microchip debe tener entre 8 y 15 caracteres';
      } else if (!/^[a-zA-Z0-9]+$/.test(formData.microchip)) {
        newErrors.microchip = 'El microchip solo debe contener letras y números';
      }
    }

    try {
      const fechaNacimiento = parseISO(formData.fecha_nacimiento);
      const hoy = new Date();
      if (isAfter(fechaNacimiento, hoy)) {
        newErrors.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura';
      }
    } catch (error) {
      newErrors.fecha_nacimiento = 'Fecha de nacimiento inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    setHasChanges(true);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const name = e.target.name as string;
    const value = e.target.value as string;

    setFormData((prev) => ({
      ...prev,
      [name]: ['cliente', 'especie', 'raza'].includes(name) ? Number(value) : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    setHasChanges(true);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setFormData((prev) => ({ ...prev, fecha_nacimiento: formattedDate }));

      if (errors.fecha_nacimiento) {
        setErrors((prev) => ({ ...prev, fecha_nacimiento: undefined }));
      }
      
      setHasChanges(true);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => setNotification((prev) => ({ ...prev, open: false }));
  
  const navigateBack = () => {
    if (fromClientView && preselectedClienteId) {
      navigate(`/clientes/${preselectedClienteId}/mascotas`);
    } else if (preselectedClienteId) {
      navigate(`/clientes/${preselectedClienteId}/mascotas`);
    } else {
      navigate('/mascotas');
    }
  };
  
  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('¿Estás seguro de cancelar? Todos los cambios se perderán.');
      if (confirmed) {
        navigateBack();
      }
    } else {
      navigateBack();
    }
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
      
      setTimeout(() => {
        navigateBack();
      }, 1500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar la mascota. Inténtalo de nuevo.';
      showNotification(errorMsg, 'error');
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
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={navigateBack}
        >
          {(fromClientView || preselectedClienteId) ? 'Volver a mascotas del cliente' : 'Volver a lista de mascotas'}
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

        <form onSubmit={handleSubmit} noValidate>
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
                disabled={saving}
                inputProps={{ maxLength: 100 }}
                required
              />
            </Grid>


{/* Selector de Cliente - Versión definitiva */}
<Grid item xs={12} md={6}>
  <FormControl fullWidth error={!!errors.cliente} required>
    <InputLabel 
      id="cliente-label"
      shrink={!!formData.cliente || undefined}
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
        '&.Mui-focused': {
          color: 'primary.main',
        },
      }}
    >
      Cliente (Dueño)
    </InputLabel>
    <Select
      labelId="cliente-label"
      name="cliente"
      value={formData.cliente ? formData.cliente.toString() : ''}
      onChange={handleSelectChange}
      disabled={saving || Boolean(preselectedClienteId)}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccionar cliente</span>;
        }
        const cliente = clientes.find(c => c.id?.toString() === selected);
        return cliente ? (
          <div>
            <div style={{ fontWeight: 500 }}>{cliente.nombre} {cliente.apellido}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
              {cliente.rut}
            </div>
          </div>
        ) : null;
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 400,
            minWidth: 300,
            mt: 1,
            boxShadow: '0px 5px 15px rgba(0,0,0,0.1)',
            '& .MuiMenuItem-root': {
              minHeight: 48,
              padding: '8px 16px',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
              },
            },
          },
        },
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
        disablePortal: true,
      }}
      sx={{
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          minHeight: '1.4375em',
          padding: '16.5px 14px',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: '1px !important',
          borderColor: 'primary.main !important',
        },
      }}
    >
      <MenuItem value="" disabled>
        <em>Seleccionar cliente</em>
      </MenuItem>
      {clientes.map((cliente) => (
        <MenuItem 
          key={cliente.id} 
          value={cliente.id?.toString() || ''}
          sx={{ py: 1.5 }}
        >
          <Box>
            <Typography fontWeight={500}>
              {cliente.nombre} {cliente.apellido}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cliente.rut}
            </Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
    {errors.cliente && <FormHelperText>{errors.cliente}</FormHelperText>}
  </FormControl>
</Grid>

{/* Selector de Especie - Versión definitiva */}
<Grid item xs={12} md={6}>
  <FormControl fullWidth error={!!errors.especie} required>
    <InputLabel 
      id="especie-label"
      shrink={!!formData.especie || undefined}
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
      }}
    >
      Especie
    </InputLabel>
    <Select
      labelId="especie-label"
      name="especie"
      value={formData.especie ? formData.especie.toString() : ''}
      onChange={handleSelectChange}
      disabled={saving}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccionar especie</span>;
        }
        const especie = especies.find(e => e.id.toString() === selected);
        return especie?.nombre || selected;
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300,
            minWidth: 250,
            mt: 1,
          },
        },
      }}
      sx={{
        '& .MuiSelect-select': {
          padding: '16.5px 14px',
        },
      }}
    >
      <MenuItem value="" disabled>
        <em>Seleccionar especie</em>
      </MenuItem>
      {especies.map((especie) => (
        <MenuItem key={especie.id} value={especie.id.toString()}>
          {especie.nombre}
        </MenuItem>
      ))}
    </Select>
    {errors.especie && <FormHelperText>{errors.especie}</FormHelperText>}
  </FormControl>
</Grid>

{/* Selector de Raza - Versión definitiva */}
<Grid item xs={12} md={6}>
  <FormControl fullWidth error={!!errors.raza} required>
    <InputLabel 
      id="raza-label"
      shrink={!!formData.raza || undefined}
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
      }}
    >
      Raza
    </InputLabel>
    <Select
      labelId="raza-label"
      name="raza"
      value={formData.raza ? formData.raza.toString() : ''}
      onChange={handleSelectChange}
      disabled={!formData.especie || saving}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return (
            <span style={{ color: formData.especie ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.38)' }}>
              {formData.especie ? 'Seleccionar raza' : 'Seleccione primero una especie'}
            </span>
          );
        }
        const raza = razas.find(r => r.id.toString() === selected);
        return raza?.nombre || selected;
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300,
            minWidth: 250,
            mt: 1,
          },
        },
      }}
      sx={{
        '& .MuiSelect-select': {
          padding: '16.5px 14px',
        },
      }}
    >
      {formData.especie ? (
        razas.map((raza) => (
          <MenuItem key={raza.id} value={raza.id.toString()}>
            {raza.nombre}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>
          <Typography variant="body2" color="text.disabled">
            Seleccione primero una especie
          </Typography>
        </MenuItem>
      )}
    </Select>
    {errors.raza && <FormHelperText>{errors.raza}</FormHelperText>}
  </FormControl>
</Grid>


            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de nacimiento"
                  value={formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento) : null}
                  onChange={handleDateChange}
                  format="dd/MM/yyyy"
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.fecha_nacimiento,
                      helperText: errors.fecha_nacimiento,
                      disabled: saving,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
  <FormControl fullWidth error={!!errors.sexo} required>
    <InputLabel 
      id="sexo-label"
      shrink={!!formData.sexo || undefined}
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
      }}
    >
      Sexo
    </InputLabel>
    <Select
      labelId="sexo-label"
      name="sexo"
      value={formData.sexo}
      onChange={handleSelectChange}
      disabled={saving}
      sx={{
        textAlign: 'left',
        '& .MuiSelect-select': {
          padding: '16.5px 14px',
        },
      }}
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
                  onClick={handleCancel} 
                  disabled={saving}
                  startIcon={<CancelIcon />}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
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
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MascotaForm;