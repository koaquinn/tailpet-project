// src/pages/historial/EditarVacuna.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  Alert, CircularProgress, Snackbar, Divider, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import {
  ArrowBack as ArrowBackIcon,
  Vaccines as VaccineIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import historialApi, { MascotaVacuna } from '../../api/historialApi';
import { getMascota } from '../../api/mascotaApi'; 
import inventarioApi from '../../api/inventarioApi';
import { useAuth } from '../../context/AuthContext';

interface FormErrors {
  vacuna?: string;
  fecha_aplicacion?: string;
  veterinario?: string;
  lote?: string;
  [key: string]: string | undefined;
}

const EditarVacuna: React.FC = () => {
  const { mascotaId, vacunaId } = useParams<{ mascotaId: string, vacunaId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const canEdit = hasRole('ADMIN') || hasRole('VETERINARIO');
  const canDelete = hasRole('ADMIN');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mascota, setMascota] = useState<any>(null);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [formData, setFormData] = useState<Partial<MascotaVacuna>>({
    mascota: mascotaId ? parseInt(mascotaId) : 0,
    vacuna: 0,
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

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      if (!mascotaId || !vacunaId || !canEdit) return;
      
      try {
        setLoading(true);
        
        // Obtener datos de la mascota
        const mascotaData = await getMascota(parseInt(mascotaId));
        setMascota(mascotaData);
        
        // Obtener datos de la vacunación específica
        const vacunacionData = await historialApi.getVacunacion(parseInt(vacunaId));
        
        // Obtener lotes de vacunas disponibles
        const lotesResponse = await inventarioApi.getLotesMedicamentoVacunas();
        setLotes(lotesResponse?.results || []);
        
        // Cargar vacunas disponibles para la especie de la mascota
        if (mascotaData && mascotaData.especie) {
          const vacunasResponse = await historialApi.getVacunas({ especie: mascotaData.especie });
          setVacunas(vacunasResponse?.results || []);
        } else {
          // Si no podemos determinar la especie, cargar todas las vacunas
          const vacunasResponse = await historialApi.getVacunas();
          setVacunas(vacunasResponse?.results || []);
        }
        
        // Formatear las fechas para el componente
        const fechaAplicacion = vacunacionData.fecha_aplicacion ? format(parseISO(vacunacionData.fecha_aplicacion), 'yyyy-MM-dd') : '';
        const fechaProxima = vacunacionData.fecha_proxima ? format(parseISO(vacunacionData.fecha_proxima), 'yyyy-MM-dd') : '';
        
        // Establecer los datos del formulario
        setFormData({
          mascota: parseInt(mascotaId),
          vacuna: vacunacionData.vacuna,
          fecha_aplicacion: fechaAplicacion,
          fecha_proxima: fechaProxima,
          veterinario: vacunacionData.veterinario,
          lote: vacunacionData.lote,
          observaciones: vacunacionData.observaciones || ''
        });
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification('Error al cargar los datos necesarios', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mascotaId, vacunaId, canEdit, user?.id]);

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
    
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : Number(value)
    }));
    
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

  // Actualizar la vacuna
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !vacunaId) return;
    
    setSaving(true);
    
    try {
      await historialApi.updateVacunacion(parseInt(vacunaId), formData);
      showNotification('Vacuna actualizada correctamente', 'success');
      
      // Redirigir después de guardar
      setTimeout(() => {
        navigate(`/mascotas/${mascotaId}/historial`);
      }, 1500);
    } catch (error) {
      console.error('Error al actualizar la vacuna:', error);
      showNotification('Error al actualizar la vacuna', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar la vacuna
  const handleDelete = async () => {
    if (!vacunaId) return;
    
    setDeleting(true);
    
    try {
      await historialApi.deleteVacunacion(parseInt(vacunaId));
      showNotification('Vacuna eliminada correctamente', 'success');
      
      // Redirigir después de eliminar
      setTimeout(() => {
        navigate(`/mascotas/${mascotaId}/historial`);
      }, 1500);
    } catch (error) {
      console.error('Error al eliminar la vacuna:', error);
      showNotification('Error al eliminar la vacuna', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!canEdit) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 2 }}>
          No tienes permisos para editar vacunas
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
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <VaccineIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h1">
            Editar Vacunación para {mascota?.nombre || ''}
          </Typography>
          
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ ml: 'auto' }}
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar
            </Button>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.vacuna} required>
                <InputLabel>Vacuna</InputLabel>
                <Select
                  name="vacuna"
                  value={formData.vacuna ? formData.vacuna.toString() : ''}
                  label="Vacuna"
                  onChange={handleSelectChange}
                  disabled={saving}
                >
                  <MenuItem value="">Seleccionar vacuna</MenuItem>
                  {vacunas.map((vacuna) => (
                    <MenuItem key={vacuna.id} value={vacuna.id.toString()}>
                      {vacuna.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.vacuna && <FormHelperText>{errors.vacuna}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.lote} required>
                <InputLabel>Lote de vacuna</InputLabel>
                <Select
                  name="lote"
                  value={formData.lote ? formData.lote.toString() : ''}
                  label="Lote de vacuna"
                  onChange={handleSelectChange}
                  disabled={saving}
                >
                  <MenuItem value="">Seleccionar lote</MenuItem>
                  {lotes.map((lote) => (
                    <MenuItem key={lote.id} value={lote.id.toString()}>
                      {lote.codigo} - {lote.medicamento_nombre} (Vence: {new Date(lote.fecha_vencimiento).toLocaleDateString()})
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
                  label="Fecha de próxima aplicación"
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
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Actualizar Vacuna'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar este registro de vacunación? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDelete(false)} 
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default EditarVacuna;