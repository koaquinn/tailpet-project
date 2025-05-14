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
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Tooltip,
  IconButton,
  Popover,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  LocalPharmacy as PharmacyIcon
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isBefore, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import inventarioApi, { Medicamento, LoteMedicamento, Proveedor } from '../../api/inventarioApi';
import { useAuth } from '../../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventario-tabpanel-${index}`}
      aria-labelledby={`inventario-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inventario-tab-${index}`,
    'aria-controls': `inventario-tabpanel-${index}`,
  };
}

// Helper function to safely format currency
const formatCurrency = (value: any): string => {
  // Convert to number if it's not already one
  const numberValue = typeof value === 'number' ? value : Number(value);
  // Check if the result is a valid number
  return !isNaN(numberValue) ? numberValue.toFixed(2) : '0.00';
};

// Validates date format and future date
const validateDate = (dateString: string): string | null => {
  if (!dateString) return 'La fecha es requerida';
  
  // Check format
  const parsedDate = parse(dateString, 'dd-MM-yyyy', new Date());
  if (!isValid(parsedDate)) return 'Formato de fecha inválido';
  
  // Check if date is in the future
  if (isBefore(parsedDate, new Date())) {
    return 'La fecha debe ser en el futuro';
  }
  
  return null;
};

const InventarioAdd: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para medicamentos y lotes
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [selectedMedicamento, setSelectedMedicamento] = useState<Medicamento | null>(null);
  
  // Estados para formulario de nuevo medicamento
  const [nuevoMedicamento, setNuevoMedicamento] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'ORAL',
    presentacion: '',
    proveedor: 0,
    precio_compra: 0,
    precio_venta: 0,
    stock_minimo: 0,
    requiere_receta: false
  });

  // Estados para formulario de nuevo lote
  const [nuevoLote, setNuevoLote] = useState({
    medicamento_id: '',
    cantidad: 0,
    numero_lote: '',
    fecha_vencimiento: '',
    proveedor_id: 0,
    precio_compra: 0,
    motivo: 'Entrada de inventario'
  });

  const [dateInputError, setDateInputError] = useState<string | null>(null);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [medResponse, provResponse] = await Promise.all([
          inventarioApi.getMedicamentos({ activo: true }),
          inventarioApi.getProveedores()
        ]);
        setMedicamentos(medResponse.results);
        setProveedores(provResponse.results);
        setError(null);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Funciones para manejar cambios en los tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Funciones para manejar fechas (comunes a ambos formularios)
  const handleOpenCalendar = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
    const currentDate = tabValue === 0 ? 
      nuevoLote.fecha_vencimiento : 
      ''; // Puedes agregar fecha para medicamento si es necesario
    setTempDate(currentDate ? parse(currentDate, 'dd-MM-yyyy', new Date()) : new Date());
  };

  const handleCloseCalendar = () => {
    setCalendarAnchorEl(null);
  };

  const handleApplyDate = () => {
    const formattedDate = format(tempDate, 'dd-MM-yyyy');
    if (tabValue === 0) {
      setNuevoLote(prev => ({ ...prev, fecha_vencimiento: formattedDate }));
    }
    // Puedes agregar lógica para medicamentos si es necesario
    setDateInputError(validateDate(formattedDate));
    handleCloseCalendar();
  };

  // Funciones para manejar cambios en el formulario de lotes
  const handleLoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuevoLote(prev => ({
      ...prev,
      [name]: name === 'cantidad' || name === 'precio_compra' ? 
        parseFloat(value) : value
    }));
  };

  const handleMedicamentoSelect = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const medicamentoId = Number(e.target.value);
    const med = medicamentos.find(m => m.id === medicamentoId);
    setSelectedMedicamento(med || null);
    
    setNuevoLote(prev => ({
      ...prev,
      medicamento_id: medicamentoId.toString(),
      proveedor_id: med?.proveedor || 0,
      precio_compra: med?.precio_compra || 0
    }));
  };

  // Funciones para manejar cambios en el formulario de medicamentos
  const handleMedicamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuevoMedicamento(prev => ({
      ...prev,
      [name]: name === 'precio_compra' || name === 'precio_venta' || name === 'stock_minimo' ?
        parseFloat(value) : value
    }));
  };

  // Validación de formularios
  const validateLoteForm = () => {
    return (
      nuevoLote.medicamento_id &&
      nuevoLote.numero_lote &&
      nuevoLote.fecha_vencimiento &&
      !dateInputError &&
      nuevoLote.cantidad > 0 &&
      nuevoLote.precio_compra >= 0
    );
  };

  const validateMedicamentoForm = () => {
    return (
      nuevoMedicamento.nombre &&
      nuevoMedicamento.presentacion &&
      nuevoMedicamento.proveedor > 0 &&
      nuevoMedicamento.precio_compra > 0 &&
      nuevoMedicamento.precio_venta > 0 &&
      nuevoMedicamento.stock_minimo >= 0
    );
  };

  // Funciones para enviar los formularios
  const handleSubmitLote = async () => {
    try {
      setLoading(true);
      await inventarioApi.registrarEntrada(
        Number(nuevoLote.medicamento_id), 
        {
          cantidad: nuevoLote.cantidad,
          numero_lote: nuevoLote.numero_lote,
          fecha_vencimiento: format(
            parse(nuevoLote.fecha_vencimiento, 'dd-MM-yyyy', new Date()), 
            'yyyy-MM-dd'
          ),
          proveedor_id: nuevoLote.proveedor_id,
          precio_compra: nuevoLote.precio_compra,
          motivo: nuevoLote.motivo
        }
      );
      
      navigate('/inventario', { 
        state: { success: 'Lote registrado correctamente' } 
      });
    } catch (error) {
      console.error('Error al registrar lote:', error);
      setError('Error al registrar el lote');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMedicamento = async () => {
    try {
      setLoading(true);
      await inventarioApi.createMedicamento(nuevoMedicamento);
      
      navigate('/inventario', { 
        state: { success: 'Medicamento creado correctamente' } 
      });
    } catch (error) {
      console.error('Error al crear medicamento:', error);
      setError('Error al crear el medicamento');
    } finally {
      setLoading(false);
    }
  };

  if (loading && medicamentos.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="md">
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            {tabValue === 0 ? 'Registrar Nuevo Lote' : 'Registrar Nuevo Medicamento'}
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
              onClick={() => setError(null)}
            >
              Cerrar
            </Button>
          </Paper>
        )}
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Registrar Lote" icon={<PharmacyIcon />} {...a11yProps(0)} />
            <Tab label="Nuevo Medicamento" icon={<AddIcon />} {...a11yProps(1)} />
          </Tabs>

          {/* Formulario para registrar lotes */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="medicamento-label">Medicamento</InputLabel>
                  <Select
                    labelId="medicamento-label"
                    id="medicamento_id"
                    name="medicamento_id"
                    value={nuevoLote.medicamento_id}
                    onChange={handleMedicamentoSelect}
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
  <           Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1">Proveedor:</Typography>
                      <Typography>{selectedMedicamento.proveedor_nombre}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1">Stock mínimo:</Typography>
                      <Typography>{selectedMedicamento.stock_minimo}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1">Precio compra sugerido:</Typography>
                      <Typography>${formatCurrency(selectedMedicamento.precio_compra)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1">Precio venta actual:</Typography>
                      <Typography>${formatCurrency(selectedMedicamento.precio_venta)}</Typography>
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
                  value={nuevoLote.numero_lote}
                  onChange={handleLoteChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="fecha_vencimiento"
                  label="Fecha de vencimiento"
                  value={nuevoLote.fecha_vencimiento}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setNuevoLote({...nuevoLote, fecha_vencimiento: newDate});
                    setDateInputError(validateDate(newDate));
                  }}
                  error={!!dateInputError}
                  helperText={dateInputError || "Formato: DD-MM-AAAA"}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Abrir calendario">
                          <IconButton onClick={handleOpenCalendar}>
                            <CalendarIcon color="action" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="cantidad"
                  label="Cantidad"
                  type="number"
                  value={nuevoLote.cantidad}
                  onChange={handleLoteChange}
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
                  value={nuevoLote.precio_compra}
                  onChange={handleLoteChange}
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
                  value={nuevoLote.motivo}
                  onChange={handleLoteChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Formulario para nuevo medicamento */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="nombre"
                  label="Nombre del medicamento"
                  value={nuevoMedicamento.nombre}
                  onChange={handleMedicamentoChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="descripcion"
                  label="Descripción"
                  value={nuevoMedicamento.descripcion}
                  onChange={handleMedicamentoChange}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-label"
                    id="tipo"
                    name="tipo"
                    value={nuevoMedicamento.tipo}
                    onChange={(e) => setNuevoMedicamento({
                      ...nuevoMedicamento,
                      tipo: e.target.value as 'ORAL' | 'INYECTABLE' | 'TOPICO' | 'OTRO'
                    })}
                    label="Tipo"
                  >
                    <MenuItem value="ORAL">Oral</MenuItem>
                    <MenuItem value="INYECTABLE">Inyectable</MenuItem>
                    <MenuItem value="TOPICO">Tópico</MenuItem>
                    <MenuItem value="OTRO">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="presentacion"
                  label="Presentación"
                  value={nuevoMedicamento.presentacion}
                  onChange={handleMedicamentoChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="proveedor-label">Proveedor</InputLabel>
                  <Select
                    labelId="proveedor-label"
                    id="proveedor"
                    name="proveedor"
                    value={nuevoMedicamento.proveedor}
                    onChange={(e) => setNuevoMedicamento({
                      ...nuevoMedicamento,
                      proveedor: Number(e.target.value)
                    })}
                    label="Proveedor"
                  >
                    {proveedores.map((prov) => (
                      <MenuItem key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={nuevoMedicamento.requiere_receta}
                      onChange={(e) => setNuevoMedicamento({
                        ...nuevoMedicamento,
                        requiere_receta: e.target.checked
                      })}
                    />
                  }
                  label="Requiere receta médica"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="precio_compra"
                  label="Precio de compra"
                  type="number"
                  value={nuevoMedicamento.precio_compra}
                  onChange={handleMedicamentoChange}
                  InputProps={{ 
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="precio_venta"
                  label="Precio de venta"
                  type="number"
                  value={nuevoMedicamento.precio_venta}
                  onChange={handleMedicamentoChange}
                  InputProps={{ 
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="stock_minimo"
                  label="Stock mínimo"
                  type="number"
                  value={nuevoMedicamento.stock_minimo}
                  onChange={handleMedicamentoChange}
                  InputProps={{ inputProps: { min: 0 } }}
                  required
                />
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SaveIcon />}
            onClick={() => {
              if (tabValue === 0) {
                setConfirmDialogOpen(true);
              } else {
                handleSubmitMedicamento();
              }
            }}
            disabled={
              loading || 
              (tabValue === 0 ? !validateLoteForm() : !validateMedicamentoForm())
            }
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </Box>
        
        {/* Diálogo de confirmación para lotes */}
        <Dialog 
          open={confirmDialogOpen} 
          onClose={() => setConfirmDialogOpen(false)}
        >
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
                  <strong>Cantidad:</strong> {nuevoLote.cantidad}
                </Typography>
                <Typography>
                  <strong>Lote:</strong> {nuevoLote.numero_lote}
                </Typography>
                <Typography>
                  <strong>Vencimiento:</strong> {nuevoLote.fecha_vencimiento}
                </Typography>
                <Typography>
                  <strong>Precio compra:</strong> ${formatCurrency(nuevoLote.precio_compra)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleSubmitLote} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Popover del calendario (compartido) */}
        <Popover
          open={Boolean(calendarAnchorEl)}
          anchorEl={calendarAnchorEl}
          onClose={handleCloseCalendar}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          sx={{
            '& .MuiPaper-root': {
              p: 2,
              width: 320
            }
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Seleccionar fecha
            </Typography>
            
            <DateCalendar
              value={tempDate}
              onChange={(newDate) => setTempDate(newDate || new Date())}
              minDate={new Date()}
              sx={{ width: '100%' }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleCloseCalendar}>Cancelar</Button>
              <Button 
                variant="contained" 
                onClick={handleApplyDate}
                sx={{ ml: 2 }}
              >
                Aplicar
              </Button>
            </Box>
          </Box>
        </Popover>
      </Container>
    </LocalizationProvider>
  );
};

export default InventarioAdd;