// src/pages/historial/RegistrarVacuna.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  Alert, CircularProgress, Snackbar, Divider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, addDays } from 'date-fns';
import {
  ArrowBack as ArrowBackIcon,
  Vaccines as VaccineIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import { getMascota } from '../../api/mascotaApi';
import historialApi from '../../api/historialApi';
import inventarioApi from '../../api/inventarioApi';
import { useAuth } from '../../context/AuthContext';

interface FormErrors {
  vacuna?: string;
  fecha_aplicacion?: string;
  veterinario?: string;
  lote?: string;
  [key: string]: string | undefined;
}

const RegistrarVacuna: React.FC = () => {
  // Cambiar id por mascotaId para que coincida con el nombre del parámetro en la ruta
  const { mascotaId } = useParams<{ mascotaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Extraer parámetros de la URL
  const searchParams = new URLSearchParams(location.search);
  const revacunacionId = searchParams.get('revacunacion');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mascota, setMascota] = useState<any>(null);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    mascota: mascotaId ? parseInt(mascotaId) : 0,
    vacuna: revacunacionId ? parseInt(revacunacionId) : 0,
    fecha_aplicacion: format(new Date(), 'yyyy-MM-dd'),
    fecha_proxima: '',
    veterinario: user?.id || 0,
    lote: 0,
    observaciones: ''
  });
  
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Mostrar notificaciones
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

  useEffect(() => {
    const fetchData = async () => {
      if (!mascotaId) {
        setLoadError('ID de mascota no proporcionado');
        setLoading(false);
        return;
      }
      
      console.log("Iniciando carga de datos para mascota:", mascotaId);
      
      try {
        setLoading(true);
        setLoadError(null);
        
        // Paso 1: Obtener información de la mascota
        let mascotaData;
        try {
          mascotaData = await getMascota(parseInt(mascotaId));
          console.log("Mascota obtenida:", mascotaData);
          setMascota(mascotaData);
        } catch (error) {
          console.error('Error al cargar mascota:', error);
          setLoadError('No se pudo cargar la información de la mascota');
          setLoading(false);
          return;
        }
        
        // Paso 2: Cargar vacunas disponibles
        let vacunasDisponibles: any[] = [];
        try {
          let vacunasResponse;
          if (mascotaData && mascotaData.especie) {
            vacunasResponse = await historialApi.getVacunas({ especie: mascotaData.especie });
          } else {
            vacunasResponse = await historialApi.getVacunas();
          }
          vacunasDisponibles = vacunasResponse?.results || [];
          console.log("Vacunas obtenidas:", vacunasDisponibles);
          setVacunas(vacunasDisponibles);
        } catch (vacError) {
          console.error('Error al cargar vacunas:', vacError);
          setVacunas([]);
          showNotification('Error al cargar las vacunas disponibles', 'error');
        }
        
        // Paso 3: Cargar lotes de vacunas disponibles
        try {
          const lotesResponse = await inventarioApi.getLotesMedicamentoVacunas();
          console.log("Lotes obtenidos:", lotesResponse);
          setLotes(lotesResponse?.results || []);
        } catch (loteError) {
          console.error('Error al cargar lotes:', loteError);
          setLotes([]);
          showNotification('No se pudieron cargar los lotes de vacunas disponibles', 'error');
        }
        
        // Paso 4: Si es una revacunación, configurar datos preseleccionados
        if (revacunacionId && vacunasDisponibles.length > 0) {
          const revacunacionIdNum = parseInt(revacunacionId);
          const selectedVacuna = vacunasDisponibles.find(v => v.id === revacunacionIdNum);
          
          if (selectedVacuna && selectedVacuna.intervalo_revacunacion) {
            console.log("Preseleccionando vacuna:", selectedVacuna);
            const fechaProxima = addDays(new Date(), selectedVacuna.intervalo_revacunacion);
            
            setFormData(prev => ({
              ...prev,
              vacuna: revacunacionIdNum,
              fecha_proxima: format(fechaProxima, 'yyyy-MM-dd')
            }));
          }
        }
      } catch (error) {
        console.error('Error general al cargar datos:', error);
        setLoadError('Error al cargar los datos necesarios. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mascotaId, revacunacionId, user?.id]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al cambiar un campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
    
    // Si se seleccionó una vacuna, calcular la fecha de próxima dosis
    if (name === 'vacuna' && value !== '') {
      const selectedVacuna = vacunas.find(v => v.id === numValue);
      if (selectedVacuna && selectedVacuna.intervalo_revacunacion) {
        const fechaProxima = addDays(new Date(), selectedVacuna.intervalo_revacunacion);
        setFormData(prev => ({
          ...prev,
          fecha_proxima: format(fechaProxima, 'yyyy-MM-dd')
        }));
      }
    }
    
    // Limpiar errores al cambiar un campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleDateChange = (date: Date | null, fieldName: string) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: formattedDate
      }));
      
      // Si cambió la fecha de aplicación y hay una vacuna seleccionada,
      // recalcular la fecha de próxima dosis
      if (fieldName === 'fecha_aplicacion' && formData.vacuna) {
        const selectedVacuna = vacunas.find(v => v.id === formData.vacuna);
        if (selectedVacuna && selectedVacuna.intervalo_revacunacion) {
          const fechaProxima = addDays(date, selectedVacuna.intervalo_revacunacion);
          setFormData(prev => ({
            ...prev,
            fecha_proxima: format(fechaProxima, 'yyyy-MM-dd')
          }));
        }
      }
      
      // Limpiar errores al cambiar un campo
      if (errors[fieldName]) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: undefined
        }));
      }
    }
  };

  // Validar el formulario
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.vacuna) {
      newErrors.vacuna = 'Debe seleccionar una vacuna';
    }
    
    if (!formData.fecha_aplicacion) {
      newErrors.fecha_aplicacion = 'Debe ingresar la fecha de aplicación';
    }
    
    if (!formData.veterinario) {
      newErrors.veterinario = 'Debe seleccionar un veterinario';
    }
    
    if (!formData.lote) {
      newErrors.lote = 'Debe seleccionar un lote';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar la vacuna
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      // Registrar la vacunación en el historial
      const vacunacionData = {
        mascota: formData.mascota,
        vacuna: formData.vacuna,
        fecha_aplicacion: formData.fecha_aplicacion,
        fecha_proxima: formData.fecha_proxima,
        veterinario: formData.veterinario,
        lote: formData.lote,
        observaciones: formData.observaciones
      };
      
      console.log("Enviando datos:", vacunacionData);
      const respuesta = await historialApi.createVacunacion(vacunacionData);
      console.log("Respuesta:", respuesta);
      
      // El backend maneja el registro del movimiento de inventario mediante signals
      
      showNotification('Vacuna registrada correctamente', 'success');
      
      // Redirigir después de guardar
      setTimeout(() => {
        navigate(`/mascotas/${mascotaId}/historial`);
      }, 1500);
    } catch (error) {
      console.error('Error al guardar la vacuna:', error);
      showNotification('Error al registrar la vacuna. Por favor, inténtelo de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Cargando datos...
        </Typography>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 2 }}>
          {loadError}
          <Button 
            component={Link} 
            to={mascotaId ? `/mascotas/${mascotaId}/historial` : "/mascotas"}
            color="inherit" 
            size="small" 
            sx={{ ml: 2 }}
          >
            {mascotaId ? "Volver al historial" : "Volver a mascotas"}
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!mascota) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 2 }}>
          No se encontró la mascota especificada
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
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/mascotas/${mascotaId}/historial`)}
        >
          Volver al historial
        </Button>
      </Box>
      
      {/* Mensaje de advertencia si no hay lotes disponibles */}
      {lotes.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay lotes de vacunas disponibles en el inventario. Por favor, registre nuevos lotes antes de continuar.
        </Alert>
      )}
      
      {/* Mensaje de advertencia si no hay vacunas disponibles */}
      {vacunas.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay vacunas disponibles para la especie de esta mascota. Por favor, registre vacunas antes de continuar.
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <VaccineIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h1">
            {revacunacionId ? "Registrar Revacunación" : "Registrar Vacuna"} para {mascota.nombre}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.vacuna} required>
                <InputLabel
        id="vacuna-select-label"
        shrink={true}
        sx={{
          // Opcional: igual que en MascotasList para consistencia visual con el "corte" del borde
          // Si tu tema ya maneja bien el fondo del label encogido, esto podría no ser necesario.
          // backgroundColor: (theme) => theme.palette.background.paper,
          // px: 1,
        }}
      >
        Vacuna
      </InputLabel>
      <Select
        labelId="vacuna-select-label"
        id="vacuna-select"
        name="vacuna"
        value={formData.vacuna ? formData.vacuna.toString() : ''}
        label="Vacuna" // Sigue siendo crucial para el notch del outlined variant
        onChange={handleSelectChange}
        disabled={saving || !!revacunacionId || vacunas.length === 0}
        displayEmpty
        renderValue={(selectedValue) => {
          if (selectedValue === "" || selectedValue === "0") {
            return <Typography component="span" sx={{ color: 'text.secondary' }}>Seleccionar vacuna</Typography>;
          }
          const vacunaSeleccionada = vacunas.find(v => v.id.toString() === selectedValue);
          return vacunaSeleccionada ? vacunaSeleccionada.nombre : `ID: ${selectedValue}`;
        }}
        MenuProps={{ PaperProps: { sx: { maxHeight: 260, mt: 0.5 } } }}
        sx={{
          '& .MuiSelect-select': {
            minHeight: '1.4375em',
            py: '16.5px',
            px: '14px',
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {vacunas.map((vac) => (
          <MenuItem key={vac.id} value={vac.id.toString()}>
            {vac.nombre}
          </MenuItem>
        ))}
      </Select>
                {errors.vacuna && <FormHelperText>{errors.vacuna}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
               <FormControl fullWidth error={!!errors.lote} required variant="outlined">
      {/* MODIFICACIÓN CLAVE: Añadir shrink={true} y sx para el fondo */}
      <InputLabel
        id="lote-select-label"
        shrink={true}
        sx={{
          // Opcional: igual que en MascotasList
          // backgroundColor: (theme) => theme.palette.background.paper,
          // px: 1,
        }}
      >
        Lote de vacuna
      </InputLabel>
      <Select
        labelId="lote-select-label"
        id="lote-select"
        name="lote"
        value={formData.lote ? formData.lote.toString() : ''}
        label="Lote de vacuna" // Sigue siendo crucial
        onChange={handleSelectChange as any}
        disabled={saving || lotes.length === 0}
        displayEmpty
        renderValue={(selectedValue) => {
          if (!selectedValue || selectedValue === "0") {
            return <em style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccionar lote</em>;
          }
          const loteSeleccionado = lotes.find(l => l.id.toString() === selectedValue);
          const formatDateValue = (dateString: string, formatPattern: string) => {
            try {
                return format(new Date(dateString), formatPattern);
            } catch (e) {
                return 'Fecha Inválida';
            }
          };
          return loteSeleccionado ? `${loteSeleccionado.numero_lote} (Vence: ${formatDateValue(loteSeleccionado.fecha_vencimiento, 'dd/MM/yy')})` : `ID: ${selectedValue}`;
        }}
        MenuProps={{ PaperProps: { sx: { maxHeight: 300, mt: 0.5, minWidth: 250 } } }}
        sx={{ '& .MuiSelect-select': { minHeight: '1.4375em', py: '16.5px', overflow: 'hidden', textOverflow: 'ellipsis' } }}
      >
        <MenuItem value="" disabled><em>Seleccionar lote</em></MenuItem>
        {lotes.map((l) => (
          <MenuItem key={l.id} value={l.id.toString()}>
            {l.numero_lote} - Vence: {l.fecha_vencimiento ? format(new Date(l.fecha_vencimiento), 'dd/MM/yy') : 'N/A'}
          </MenuItem>
        ))}
      </Select>
                {errors.lote && <FormHelperText>{errors.lote}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de aplicación"
                  value={formData.fecha_aplicacion ? new Date(formData.fecha_aplicacion) : null}
                  onChange={(date) => handleDateChange(date, 'fecha_aplicacion')}
                  format="dd/MM/yyyy"
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.fecha_aplicacion,
                      helperText: errors.fecha_aplicacion,
                      disabled: saving
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Revacunación"
                  value={formData.fecha_proxima ? new Date(formData.fecha_proxima) : null}
                  onChange={(date) => handleDateChange(date, 'fecha_proxima')}
                  format="dd/MM/yyyy"
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      disabled: saving
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/mascotas/${mascotaId}/historial`)}
                  disabled={saving}
                  sx={{ mr: 2 }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving || vacunas.length === 0 || lotes.length === 0}
                >
                  {saving ? 'Guardando...' : 'Registrar Vacuna'}
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

export default RegistrarVacuna;