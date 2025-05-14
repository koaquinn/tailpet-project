// src/pages/citas/ConsultaPanel.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  LocalHospital as HospitalIcon,
  Pets as PetsIcon,
  EventAvailable as EventIcon,
  Cancel as CancelIcon,
  MedicationLiquid as MedicationIcon,
} from '@mui/icons-material';

import consultaApi, { ConsultaEnCurso } from '../../api/consultaApi';
import citasApi from '../../api/citasApi';
import { getMascota } from '../../api/mascotaApi';
import inventarioApi from '../../api/inventarioApi';
import historialApi from '../../api/historialApi';
import { useAuth } from '../../context/AuthContext';

// Definimos los pasos de la consulta
const CONSULTA_STEPS = ['Triage', 'Diagnóstico', 'Tratamiento', 'Finalización'];

const ConsultaPanel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados para los datos de la consulta
  const [consulta, setConsulta] = useState<ConsultaEnCurso | null>(null);
  const [mascota, setMascota] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el paso actual
  const [activeStep, setActiveStep] = useState(0);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    diagnostico: '',
    observaciones: '',
    peso_actual: '',
    temperatura: '',
    sintomas: '',
    tratamiento: '',
  });
  
  // Estado para los medicamentos
  const [medicamentos, setMedicamentos] = useState<Array<{
    id: number;
    medicamento: number;
    medicamento_nombre?: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    cantidad: number;
  }>>([]);
  
  // Estados para el diálogo de añadir medicamento
  const [medicamentoDialogOpen, setMedicamentoDialogOpen] = useState(false);
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState<any[]>([]);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState<any | null>(null);
  const [nuevoDatosMedicamento, setNuevoDatosMedicamento] = useState({
    dosis: '',
    frecuencia: '',
    duracion: '',
    cantidad: 1,
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Obtener datos de la consulta
        const consultaData = await citasApi.getConsulta(parseInt(id));
        setConsulta(consultaData as ConsultaEnCurso);
        
        // Si la consulta está en estado 'PROGRAMADA', cambiarla a 'EN_CURSO'
        if (consultaData.estado === 'PROGRAMADA') {
          await consultaApi.iniciarConsulta(parseInt(id));
        }
        
        // Obtener datos de la mascota
        if (consultaData.mascota) {
          const mascotaData = await getMascota(consultaData.mascota);
          setMascota(mascotaData);
        }
        
        // Inicializar formulario con datos de la consulta
        setFormData({
          diagnostico: consultaData.diagnostico || '',
          observaciones: consultaData.observaciones || '',
          peso_actual: '',
          temperatura: '',
          sintomas: '',
          tratamiento: '',
        });
        
        // Cargar medicamentos disponibles
        const medicamentosResponse = await inventarioApi.getMedicamentos({ stock_minimo: 1 });
        setMedicamentosDisponibles(medicamentosResponse.results || []);
      } catch (err) {
        console.error('Error al cargar datos de la consulta:', err);
        setError('Ocurrió un error al cargar los datos de la consulta');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Manejadores de cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Para propósitos de depuración
    console.log(`Campo actualizado: ${name} = ${value}`);
  };
  
  // Manejadores para el stepper
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Manejadores para medicamentos
  const handleOpenMedicamentoDialog = () => {
    setMedicamentoDialogOpen(true);
  };
  
  const handleCloseMedicamentoDialog = () => {
    setMedicamentoDialogOpen(false);
    setMedicamentoSeleccionado(null);
    setNuevoDatosMedicamento({
      dosis: '',
      frecuencia: '',
      duracion: '',
      cantidad: 1,
    });
  };
  
  const handleMedicamentoChange = (medicamento: any) => {
    setMedicamentoSeleccionado(medicamento);
  };
  
  const handleMedicamentoInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoDatosMedicamento(prev => ({
      ...prev,
      [name]: name === 'cantidad' ? parseInt(value) || 1 : value
    }));
  };
  
  const handleAddMedicamento = () => {
    if (!medicamentoSeleccionado) return;
    
    const nuevoMedicamento = {
      id: Date.now(), // ID temporal
      medicamento: medicamentoSeleccionado.id,
      medicamento_nombre: medicamentoSeleccionado.nombre,
      dosis: nuevoDatosMedicamento.dosis,
      frecuencia: nuevoDatosMedicamento.frecuencia,
      duracion: nuevoDatosMedicamento.duracion,
      cantidad: nuevoDatosMedicamento.cantidad,
    };
    
    setMedicamentos(prev => [...prev, nuevoMedicamento]);
    handleCloseMedicamentoDialog();
  };
  
  const handleRemoveMedicamento = (id: number) => {
    setMedicamentos(prev => prev.filter(med => med.id !== id));
  };
  
  // Manejador para guardar la consulta
  const handleSaveConsulta = async () => {
    if (!consulta || !id) return;
    
    setSaving(true);
    try {
      // Preparar datos para guardar
      const consultaData = {
        ...consulta,
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
      };
      
      // Guardar la consulta
      await citasApi.updateConsulta(parseInt(id), consultaData);
      
      // Mensaje de éxito
      alert('Consulta guardada exitosamente');
    } catch (err) {
      console.error('Error al guardar la consulta:', err);
      setError('Ocurrió un error al guardar la consulta');
    } finally {
      setSaving(false);
    }
  };
  
  // Manejador para completar la consulta
  const handleCompletarConsulta = async () => {
    if (!consulta || !id) return;
    
    if (!formData.diagnostico.trim()) {
      setError('Debe ingresar un diagnóstico antes de completar la consulta');
      return;
    }
    
    setSaving(true);
    try {
      // Preparar datos para completar la consulta
      const consultaCompletaData = {
        ...consulta,
        estado: 'COMPLETADA',
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        peso_actual: formData.peso_actual ? parseFloat(formData.peso_actual) : null,
        sintomas: formData.sintomas,
        tratamiento: formData.tratamiento
      };
      
      // Log para depurar
      console.log("Datos a enviar:", consultaCompletaData);
      
      // Completar la consulta
      const response = await consultaApi.completarConsulta(parseInt(id), consultaCompletaData);
      console.log("Respuesta del servidor:", response);
      
      // Si hay medicamentos, registrarlos
      if (medicamentos.length > 0) {
        const medicamentosData = medicamentos.map(med => ({
          medicamento: med.medicamento,
          dosis: med.dosis,
          frecuencia: med.frecuencia,
          duracion: med.duracion,
          cantidad: med.cantidad,
        }));
        
        await consultaApi.registrarMedicamentos(parseInt(id), medicamentosData);
      }
      
      // Redirigir a la lista de consultas con un mensaje de éxito
      alert('Consulta completada y registrada correctamente en el historial médico');
      navigate('/citas');
    } catch (err) {
      console.error('Error al completar la consulta:', err);
      setError('Ocurrió un error al completar la consulta');
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
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => window.location.reload()}
            sx={{ ml: 2 }}
          >
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!consulta || !mascota) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 2 }}>
          No se encontró la consulta o la mascota
          <Button 
            component={Link} 
            to="/citas" 
            color="inherit" 
            size="small" 
            sx={{ ml: 2 }}
          >
            Volver a consultas
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          component={Link} 
          to="/citas"
        >
          Volver a consultas
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h1">
            <HospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Consulta en curso
          </Typography>
          
          <Chip 
            label={consulta.estado} 
            color={
              consulta.estado === 'PROGRAMADA' ? 'primary' : 
              consulta.estado === 'EN_CURSO' ? 'warning' : 
              consulta.estado === 'COMPLETADA' ? 'success' : 'error'
            }
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PetsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Paciente
                </Typography>
                <Typography variant="body1">
                  <strong>Nombre:</strong> {mascota.nombre}
                </Typography>
                <Typography variant="body1">
                  <strong>Especie:</strong> {mascota.especie_nombre}
                </Typography>
                <Typography variant="body1">
                  <strong>Raza:</strong> {mascota.raza_nombre}
                </Typography>
                <Typography variant="body1">
                  <strong>Edad:</strong> {mascota.edad_anos ? `${mascota.edad_anos} años` : 'No registrada'}
                </Typography>
                <Typography variant="body1">
                  <strong>Sexo:</strong> {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Detalles de la Consulta
                </Typography>
                <Typography variant="body1">
                  <strong>Fecha:</strong> {new Date(consulta.fecha).toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Tipo:</strong> {consulta.tipo}
                </Typography>
                <Typography variant="body1">
                  <strong>Motivo:</strong> {consulta.motivo}
                </Typography>
                <Typography variant="body1">
                  <strong>Veterinario:</strong> {consulta.veterinario_nombre || user?.first_name + ' ' + user?.last_name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {CONSULTA_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 2 }}>
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Peso actual (kg)"
                  name="peso_actual"
                  type="number"
                  value={formData.peso_actual}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Temperatura (°C)"
                  name="temperatura"
                  type="number"
                  value={formData.temperatura}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 35, max: 43, step: 0.1 } }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Síntomas"
                  name="sintomas"
                  multiline
                  rows={4}
                  value={formData.sintomas}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          )}
          
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnóstico"
                  name="diagnostico"
                  multiline
                  rows={4}
                  required
                  value={formData.diagnostico}
                  onChange={handleInputChange}
                  error={!formData.diagnostico.trim()}
                  helperText={!formData.diagnostico.trim() ? 'El diagnóstico es obligatorio' : ''}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observaciones"
                  multiline
                  rows={3}
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          )}
          
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tratamiento recomendado"
                  name="tratamiento"
                  multiline
                  rows={4}
                  value={formData.tratamiento}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <MedicationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Medicamentos recetados
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleOpenMedicamentoDialog}
                  >
                    Agregar medicamento
                  </Button>
                </Box>
                
                {medicamentos.length === 0 ? (
                  <Alert severity="info">
                    No se han agregado medicamentos a la receta
                  </Alert>
                ) : (
                  <Box>
                    {medicamentos.map((med) => (
                      <Card key={med.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ pb: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">{med.medicamento_nombre}</Typography>
                            <IconButton color="error" onClick={() => handleRemoveMedicamento(med.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2">
                                <strong>Dosis:</strong> {med.dosis}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Frecuencia:</strong> {med.frecuencia}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2">
                                <strong>Duración:</strong> {med.duracion}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Cantidad:</strong> {med.cantidad}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
          
          {activeStep === 3 && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Resumen de la consulta
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Por favor, verifica que toda la información esté correcta antes de finalizar la consulta.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Diagnóstico:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {formData.diagnostico || 'No se ha registrado diagnóstico'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Tratamiento:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {formData.tratamiento || 'No se ha registrado tratamiento'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Medicamentos recetados ({medicamentos.length}):</strong>
                      </Typography>
                      
                      {medicamentos.length === 0 ? (
                        <Typography variant="body2">No se han recetado medicamentos</Typography>
                      ) : (
                        <Box>
                          {medicamentos.map((med) => (
                            <Box key={med.id} sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>{med.medicamento_nombre}:</strong> {med.dosis}, {med.frecuencia}, por {med.duracion} ({med.cantidad} unidades)
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0 || saving}
              onClick={handleBack}
            >
              Atrás
            </Button>
            
            <Box>
              <Button
                color="primary"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveConsulta}
                disabled={saving}
                sx={{ mr: 1 }}
              >
                Guardar
              </Button>
              
              {activeStep === CONSULTA_STEPS.length - 1 ? (
                <Button
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleCompletarConsulta}
                  disabled={saving || !formData.diagnostico.trim()}
                >
                  {saving ? 'Guardando...' : 'Completar consulta'}
                </Button>
              ) : (
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={handleNext}
                  disabled={saving || (activeStep === 1 && !formData.diagnostico.trim())}
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Diálogo para agregar medicamento */}
      <Dialog open={medicamentoDialogOpen} onClose={handleCloseMedicamentoDialog} maxWidth="md" fullWidth>
        <DialogTitle>Agregar medicamento a la receta</DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={medicamentosDisponibles}
                getOptionLabel={(option) => option.nombre || ''}
                renderInput={(params) => <TextField {...params} label="Seleccionar medicamento" fullWidth />}
                value={medicamentoSeleccionado}
                onChange={(_, value) => handleMedicamentoChange(value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dosis (ej. 1 tableta, 5ml)"
                name="dosis"
                value={nuevoDatosMedicamento.dosis}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Frecuencia (ej. cada 8 horas)"
                name="frecuencia"
                value={nuevoDatosMedicamento.frecuencia}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duración (ej. 7 días)"
                name="duracion"
                value={nuevoDatosMedicamento.duracion}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cantidad"
                name="cantidad"
                type="number"
                value={nuevoDatosMedicamento.cantidad}
                onChange={handleMedicamentoInputChange}
                disabled={!medicamentoSeleccionado}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseMedicamentoDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleAddMedicamento} 
            color="primary" 
            variant="contained"
            disabled={
              !medicamentoSeleccionado || 
              !nuevoDatosMedicamento.dosis || 
              !nuevoDatosMedicamento.frecuencia || 
              !nuevoDatosMedicamento.duracion || 
              nuevoDatosMedicamento.cantidad < 1
            }
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConsultaPanel;