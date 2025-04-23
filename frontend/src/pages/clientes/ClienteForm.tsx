// src/pages/clientes/ClienteForm.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Grid, Paper,
  Divider, Switch, FormControlLabel, Alert, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { getCliente, createCliente, updateCliente, Cliente } from '../../api/clienteApi';

interface FormErrors {
  nombre?: string;
  apellido?: string;
  rut?: string;
  telefono?: string;
  email?: string;
  [key: string]: string | undefined;
}

const ClienteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<Cliente>({
    nombre: '',
    apellido: '',
    rut: '',
    telefono: '',
    email: '',
    activo: true
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  
  useEffect(() => {
    const fetchCliente = async () => {
      if (isEdit && id) {
        try {
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
          setError('Error al cargar los datos del cliente');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchCliente();
  }, [isEdit, id]);
  
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.rut.trim()) newErrors.rut = 'El RUT es requerido';
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      if (isEdit && id) {
        await updateCliente(Number(id), formData);
      } else {
        await createCliente(formData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/clientes');
      }, 1500);
    } catch (error) {
      setError('Error al guardar el cliente. Inténtalo de nuevo.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEdit) {
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
          onClick={() => navigate('/clientes')}
        >
          Volver a lista de clientes
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Cliente {isEdit ? 'actualizado' : 'creado'} correctamente.
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                error={!!errors.apellido}
                helperText={errors.apellido}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RUT"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                error={!!errors.rut}
                helperText={errors.rut}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                error={!!errors.telefono}
                helperText={errors.telefono}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={handleChange}
                    name="activo"
                    color="primary"
                  />
                }
                label="Cliente Activo"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/clientes')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ClienteForm;