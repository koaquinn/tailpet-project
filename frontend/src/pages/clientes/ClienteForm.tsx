// src/pages/clientes/ClienteForm.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Grid, Paper,
  Divider, Switch, FormControlLabel, Alert, CircularProgress,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { getCliente, createCliente, updateCliente } from '../../api/clienteApi';
import './ClienteForm.css';

// Tipos
interface FormErrors {
  [key: string]: string | undefined;
}

// Configuración de campos del formulario
const FORM_FIELDS = [
  {
    name: 'nombre',
    label: 'Nombre',
    required: true,
    maxLength: 100,
    gridProps: { xs: 12, md: 6 },
    validate: (value: string) => !value.trim() ? 'El nombre es requerido' : undefined
  },
  {
    name: 'apellido',
    label: 'Apellido',
    required: true,
    maxLength: 100,
    gridProps: { xs: 12, md: 6 },
    validate: (value: string) => !value.trim() ? 'El apellido es requerido' : undefined
  },
  {
    name: 'rut',
    label: 'RUT',
    required: true,
    maxLength: 12,
    gridProps: { xs: 12, md: 6 },
    helperText: 'Formato: 12345678-9',
    validate: (value: string) => {
      if (!value.trim()) return 'El RUT es requerido';
      if (!/^[0-9]{7,8}-[0-9kK]$/.test(value)) return 'Formato inválido. Ej: 12345678-9';
      return undefined;
    }
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    required: true,
    maxLength: 15,
    gridProps: { xs: 12, md: 6 },
    helperText: 'Ej: +56912345678',
    validate: (value: string) => {
      if (!value.trim()) return 'El teléfono es requerido';
      if (!/^[+]?[0-9]{9,12}$/.test(value)) return 'Formato inválido. Ej: +56912345678';
      return undefined;
    }
  },
  {
    name: 'email',
    label: 'Email',
    required: true,
    maxLength: 100,
    type: 'email',
    gridProps: { xs: 12 },
    validate: (value: string) => {
      if (!value.trim()) return 'El email es requerido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
      return undefined;
    }
  }
];

const DEFAULT_FORM_DATA: Cliente = {
  nombre: '',
  apellido: '',
  rut: '',
  telefono: '',
  email: '',
  activo: true
};

const ClienteForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Estados
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState<Cliente>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});

  // Cargar datos del cliente si estamos en modo edición
  useEffect(() => {
    const fetchCliente = async () => {
      if (!isEdit || !id) return;
      
      try {
        setLoading(true);
        const data = await getCliente(Number(id));
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          rut: data.rut || '',
          telefono: data.telefono || '',
          email: data.email || '',
          activo: data.activo !== undefined ? data.activo : true
        });
      } catch (error) {
        showNotification('Error al cargar los datos del cliente', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCliente();
  }, [isEdit, id]);
  
  // Validar todos los campos del formulario
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    FORM_FIELDS.forEach(field => {
      const fieldValue = formData[field.name as keyof Cliente] as string;
      const fieldError = field.validate?.(fieldValue);
      if (fieldError) {
        newErrors[field.name] = fieldError;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar cambios en los campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error al cambiar un campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
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
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      if (isEdit && id) {
        await updateCliente(Number(id), formData);
        showNotification('Cliente actualizado correctamente', 'success');
      } else {
        await createCliente(formData);
        showNotification('Cliente creado correctamente', 'success');
      }
      
      // Redirigir después de guardar
      setTimeout(() => {
        navigate('/clientes');
      }, 1500);
    } catch (error) {
      showNotification('Error al guardar el cliente. Inténtalo de nuevo.', 'error');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Mostrar spinner durante la carga
  if (loading && isEdit) {
    return (
      <Container className="cliente-form-container">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" className="cliente-form-container">
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/clientes')}
          className="cliente-form-button cliente-form-button-outline"
        >
          Volver a lista de clientes
        </Button>
      </Box>
      
      <Paper className="cliente-form-card">
        <Typography variant="h5" component="h1" className="cliente-form-title" gutterBottom>
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Renderizado dinámico de campos */}
            {FORM_FIELDS.map((field) => (
              <Grid item {...field.gridProps} key={field.name}>
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  type={field.type || 'text'}
                  value={formData[field.name as keyof Cliente]}
                  onChange={handleChange}
                  error={!!errors[field.name]}
                  helperText={errors[field.name] || field.helperText || ''}
                  required={field.required}
                  disabled={saving}
                  inputProps={{ maxLength: field.maxLength }}
                  className="cliente-form-field"
                />
              </Grid>
            ))}
            
            {/* Switch para activo/inactivo */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={handleChange}
                    name="activo"
                    color="primary"
                    disabled={saving}
                    className="cliente-form-switch"
                  />
                }
                label="Cliente Activo"
              />
            </Grid>
            
            {/* Botones de acción */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/clientes')}
                  disabled={saving}
                  className="cliente-form-button cliente-form-button-outline"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  startIcon={saving ? 
                    <CircularProgress size={20} className="cliente-form-spinner" /> : 
                    <SaveIcon />
                  }
                  disabled={saving}
                  className="cliente-form-button cliente-form-button-primary"
                >
                  {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Notificación */}
      <Snackbar 
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          className="cliente-form-notification"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClienteForm;