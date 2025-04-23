// src/pages/mascotas/MascotaForm.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Grid, Paper,
  Divider, Switch, FormControlLabel, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
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
  [key: string]: string | undefined;
}

const MascotaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [razas, setRazas] = useState<Raza[]>([]);
  
  const [formData, setFormData] = useState<Mascota>({
    nombre: '',
    cliente: 0,
    especie: 0,
    raza: 0,
    fecha_nacimiento: '',
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
          const razasData = await getRazas(mascotaData.especie);
          setRazas(razasData.results || []);
        }
      } catch (error) {
        setError('Error al cargar datos iniciales');
        console.error(error);
      } finally {
        setDataLoading(false);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [isEdit, id]);
  
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
          }
        } catch (error) {
          console.error("Error al cargar razas:", error);
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
  
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setFormData(prev => ({
      ...prev,
      [name]: ['cliente', 'especie', 'raza'].includes(name)
        ? Number(value)
        : value
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
        await updateMascota(Number(id), formData);
      } else {
        await createMascota(formData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/mascotas');
      }, 1500);
    } catch (error) {
      setError('Error al guardar la mascota. Inténtalo de nuevo.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Mascota {isEdit ? 'actualizada' : 'creada'} correctamente.
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEdit ? 'Editar Mascota' : 'Nueva Mascota'}
        </Typography>
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
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.cliente} required>
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
                      {cliente.nombre} {cliente.apellido}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cliente && (
                  <Typography color="error" variant="caption">
                    {errors.cliente}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.especie} required>
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
                {errors.especie && (
                  <Typography color="error" variant="caption">
                    {errors.especie}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.raza} required>
                <InputLabel>Raza</InputLabel>
                <Select
                  name="raza"
                  value={formData.raza ? formData.raza.toString() : ''}
                  label="Raza"
                  onChange={handleSelectChange}
                  disabled={!formData.especie}
                >
                  <MenuItem value="">Seleccionar raza</MenuItem>
                  {razas.map(raza => (
                    <MenuItem key={raza.id} value={raza.id.toString()}>
                      {raza.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.raza && (
                  <Typography color="error" variant="caption">
                    {errors.raza}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Nacimiento"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                error={!!errors.fecha_nacimiento}
                helperText={errors.fecha_nacimiento}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.sexo} required>
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
                {errors.sexo && (
                  <Typography color="error" variant="caption">
                    {errors.sexo}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Microchip (opcional)"
                name="microchip"
                value={formData.microchip}
                onChange={handleChange}
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
                  />
                }
                label="Mascota Activa"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/mascotas')}
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

export default MascotaForm;