// src/pages/inventario/AgregarInventario.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import inventarioApi, { Medicamento, LoteMedicamento } from '../../api/inventarioApi';
import { useAuth } from '../../context/AuthContext';

const InventarioAdd: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [selectedMedicamento, setSelectedMedicamento] = useState<Medicamento | null>(null);
  
  const [formData, setFormData] = useState({
    medicamento_id: '',
    cantidad: 0,
    numero_lote: '',
    fecha_vencimiento: '',
    proveedor_id: 0,
    precio_compra: 0,
    motivo: 'Entrada de inventario'
  });
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const fetchMedicamentos = async () => {
    setLoading(true);
    try {
      const response = await inventarioApi.getMedicamentos({ activo: true });
      setMedicamentos(response.results);
      setError(null);
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
      setError('Error al cargar los medicamentos');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMedicamentos();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (name === 'medicamento_id') {
      const med = medicamentos.find(m => m.id === Number(value));
      setSelectedMedicamento(med || null);
      
      setFormData(prev => ({
        ...prev,
        [name as string]: value,
        proveedor_id: med?.proveedor || 0,
        precio_compra: med?.precio_compra || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name as string]: name === 'cantidad' || name === 'precio_compra' ? parseFloat(value as string) : value
      }));
    }
  };
  
  const handleSubmit = async () => {
    if (!formData.medicamento_id || !selectedMedicamento) return;
    
    try {
      setLoading(true);
      await inventarioApi.registrarEntrada(
        Number(formData.medicamento_id), 
        {
          cantidad: formData.cantidad,
          numero_lote: formData.numero_lote,
          fecha_vencimiento: formData.fecha_vencimiento,
          proveedor_id: formData.proveedor_id,
          precio_compra: formData.precio_compra,
          motivo: formData.motivo
        }
      );
      
      navigate('/inventario', { state: { success: 'Entrada de inventario registrada correctamente' } });
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      setError('Error al registrar la entrada de inventario');
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = () => {
    return (
      formData.medicamento_id &&
      formData.numero_lote &&
      formData.fecha_vencimiento &&
      formData.cantidad > 0 &&
      formData.precio_compra >= 0
    );
  };

  if (loading && medicamentos.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Registrar Entrada de Inventario
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inventario')}
        >
          Volver al Inventario
        </Button>
      </Box>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1, bgcolor: 'white' }} 
            onClick={fetchMedicamentos}
          >
            Reintentar
          </Button>
        </Paper>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel id="medicamento-label">Medicamento</InputLabel>
              <Select
                labelId="medicamento-label"
                id="medicamento_id"
                name="medicamento_id"
                value={formData.medicamento_id}
                onChange={handleChange}
                label="Medicamento"
              >
                {medicamentos.map((med) => (
                  <MenuItem key={med.id} value={med.id}>
                    {med.nombre} - {med.presentacion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {selectedMedicamento && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">Proveedor:</Typography>
                    <Typography>{selectedMedicamento.proveedor_nombre}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">Stock mínimo:</Typography>
                    <Typography>
                      {selectedMedicamento.stock_minimo}
                      {selectedMedicamento.stock_minimo > 0 && (
                        <Chip 
                          icon={<WarningIcon />}
                          label="Stock bajo" 
                          color="warning" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">Precio compra sugerido:</Typography>
                    <Typography>${selectedMedicamento.precio_compra.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">Precio venta actual:</Typography>
                    <Typography>${selectedMedicamento.precio_venta.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="numero_lote"
              label="Número de lote"
              value={formData.numero_lote}
              onChange={handleChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="fecha_vencimiento"
              label="Fecha de vencimiento"
              type="date"
              value={formData.fecha_vencimiento}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="cantidad"
              label="Cantidad"
              type="number"
              value={formData.cantidad}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1 } }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="precio_compra"
              label="Precio de compra"
              type="number"
              value={formData.precio_compra}
              onChange={handleChange}
              InputProps={{ 
                inputProps: { min: 0, step: 0.01 },
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="motivo"
              label="Motivo"
              value={formData.motivo}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!validateForm() || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Registrar Entrada'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar entrada de inventario</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea registrar esta entrada de inventario?
          </Typography>
          {selectedMedicamento && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Detalles:
              </Typography>
              <Typography>
                <strong>Medicamento:</strong> {selectedMedicamento.nombre} - {selectedMedicamento.presentacion}
              </Typography>
              <Typography>
                <strong>Cantidad:</strong> {formData.cantidad}
              </Typography>
              <Typography>
                <strong>Lote:</strong> {formData.numero_lote}
              </Typography>
              <Typography>
                <strong>Vencimiento:</strong> {formData.fecha_vencimiento}
              </Typography>
              <Typography>
                <strong>Precio compra:</strong> ${formData.precio_compra.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InventarioAdd;