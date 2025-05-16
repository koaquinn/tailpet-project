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
  Tab,
  useTheme,
  alpha,
  Divider,
  Card,
  CardContent,
  Fade,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  LocalPharmacy as PharmacyIcon,
  Inventory as InventoryIcon,
  Home as HomeIcon,
  Event as EventIcon,
  Info as InfoIcon,
  Done as DoneIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isBefore, parse, isValid, addYears } from 'date-fns';
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
      {value === index && (
        <Fade in={value === index}>
          <Box sx={{ py: 3 }}>{children}</Box>
        </Fade>
      )}
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
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    setTempDate(currentDate ? parse(currentDate, 'dd-MM-yyyy', new Date()) : addYears(new Date(), 1));
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
      // Validación adicional en el frontend
      if (nuevoLote.cantidad <= 0) {
        setError('La cantidad debe ser un número positivo');
        return;
      }

      setSubmitting(true);
      setError(null);

      // Asegúrate de convertir los tipos correctamente
      const entradaData = {
        cantidad: Number(nuevoLote.cantidad),
        numero_lote: nuevoLote.numero_lote,
        fecha_vencimiento: format(
          parse(nuevoLote.fecha_vencimiento, 'dd-MM-yyyy', new Date()),
          'yyyy-MM-dd'
        ),
        proveedor_id: Number(nuevoLote.proveedor_id),
        precio_compra: Number(nuevoLote.precio_compra),
        motivo: nuevoLote.motivo || 'Entrada de inventario'
      };

      const response = await inventarioApi.registrarEntrada(
        Number(nuevoLote.medicamento_id),
        entradaData
      );

      navigate('/inventario', { 
        state: { success: 'Lote registrado correctamente' } 
      });
    } catch (error: any) {
      console.error('Error al registrar lote:', error);
      setError(error.response?.data?.error || 'Error al registrar el lote');
      setConfirmDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMedicamento = async () => {
    try {
      setSubmitting(true);
      await inventarioApi.createMedicamento(nuevoMedicamento);
      
      navigate('/inventario', { 
        state: { success: 'Medicamento creado correctamente' } 
      });
    } catch (error) {
      console.error('Error al crear medicamento:', error);
      setError('Error al crear el medicamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && medicamentos.length === 0) {
    return (
      <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 3 }}>
          Cargando datos de inventario...
        </Typography>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="md">
        {/* Encabezado y navegación */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link 
              underline="hover" 
              color="inherit" 
              href="/" 
              sx={{ display: 'flex', alignItems: 'center' }}
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Inicio
            </Link>
            <Link
              underline="hover"
              color="inherit"
              href="/inventario"
              sx={{ display: 'flex', alignItems: 'center' }}
              onClick={(e) => {
                e.preventDefault();
                navigate('/inventario');
              }}
            >
              <InventoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Inventario
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              {tabValue === 0 ? (
                <>
                  <PharmacyIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Registrar Lote
                </>
              ) : (
                <>
                  <AddIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                  Nuevo Medicamento
                </>
              )}
            </Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              {tabValue === 0 ? (
                <>
                  <PharmacyIcon 
                    sx={{ 
                      mr: 1.5, 
                      color: theme.palette.secondary.main,
                      fontSize: 32 
                    }} 
                  />
                  Registrar Nuevo Lote
                </>
              ) : (
                <>
                  <AddIcon 
                    sx={{ 
                      mr: 1.5, 
                      color: theme.palette.primary.main,
                      fontSize: 32 
                    }} 
                  />
                  Registrar Nuevo Medicamento
                </>
              )}
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/inventario')}
              sx={{ 
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Volver al Inventario
            </Button>
          </Box>
        </Box>
        
        {/* Mensaje de error */}
        {error && (
          <Alert 
            severity="error" 
            variant="outlined"
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.15)}`,
              display: 'flex',
              alignItems: 'center'
            }}
            icon={<ErrorIcon />}
            action={
              <Button 
                color="error" 
                size="small" 
                onClick={() => setError(null)}
                sx={{ fontWeight: 500 }}
              >
                Cerrar
              </Button>
            }
          >
            <Typography variant="body1" fontWeight={500}>
              {error}
            </Typography>
          </Alert>
        )}
        
        {/* Panel principal con tabs */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: `0 4px 20px 0 ${alpha(theme.palette.grey[500], 0.08)}, 
                        0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.06)}`
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ 
              mb: 2,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none',
                minHeight: 56,
                borderRadius: '8px 8px 0 0',
              },
              '& .Mui-selected': {
                fontWeight: 600,
                transition: 'all 0.2s',
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab 
              label="Registrar Lote" 
              icon={<PharmacyIcon />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label="Nuevo Medicamento" 
              icon={<AddIcon />} 
              iconPosition="start"
              {...a11yProps(1)} 
            />
          </Tabs>

          {/* Formulario para registrar lotes */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                >
                  <InputLabel id="medicamento-label">Medicamento</InputLabel>
                  <Select
                    labelId="medicamento-label"
                    id="medicamento_id"
                    name="medicamento_id"
                    value={nuevoLote.medicamento_id}
                    onChange={handleMedicamentoSelect}
                    label="Medicamento"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 1.5,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }
                      },
                      container: document.body,
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      }
                    }}
                  >
                    {medicamentos.map((med) => (
                      <MenuItem key={med.id} value={med.id}>
                        {med.nombre} - {med.presentacion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Información del medicamento seleccionado */}
              {selectedMedicamento && (
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 2,
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      bgcolor: alpha(theme.palette.primary.main, 0.03)
                    }}
                  >
                    <CardContent>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        color: theme.palette.primary.main
                      }}>
                        <InfoIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Información del medicamento
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Proveedor
                          </Typography>
                          <Typography variant="body1" fontWeight={500} sx={{ mb: 1.5 }}>
                            {selectedMedicamento.proveedor_nombre || 'No especificado'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Stock mínimo
                          </Typography>
                          <Chip 
                            label={`${selectedMedicamento.stock_minimo} unidades`} 
                            color="primary" 
                            variant="outlined"
                            size="small"
                            sx={{ 
                              fontWeight: 500,
                              mt: 0.5,
                              borderRadius: 1
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Precio de compra sugerido
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight={600} 
                            color="primary"
                            sx={{ mb: 1 }}
                          >
                            ${formatCurrency(selectedMedicamento.precio_compra)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Precio de venta actual
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight={600}
                            color="secondary"
                            sx={{ mb: 1 }}
                          >
                            ${formatCurrency(selectedMedicamento.precio_venta)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
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
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                    }
                  }}
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
                            <CalendarIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 1.5,
                    }
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
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value) || 0); // Asegura que nunca sea menor a 1
                    setNuevoLote({ ...nuevoLote, cantidad: value });
                  }}
                  InputProps={{ 
                    inputProps: { min: 1 },
                    sx: {
                      borderRadius: 1.5,
                    }
                  }}
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
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    sx: {
                      borderRadius: 1.5,
                    }
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
                  placeholder="Especifique el motivo de esta entrada de inventario..."
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                    }
                  }}
                />
              </Grid>
              
              {/* Mensaje informativo */}
              <Grid item xs={12}>
                <Alert 
                  severity="info" 
                  variant="outlined"
                  icon={<InfoIcon />}
                  sx={{ 
                    borderRadius: 1.5,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  <Typography variant="body2">
                    Complete todos los campos requeridos para poder registrar este lote en el inventario.
                    El medicamento seleccionado tendrá su stock actualizado inmediatamente.
                  </Typography>
                </Alert>
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
                  placeholder="Ingrese el nombre comercial del medicamento"
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                    }
                  }}
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
                  placeholder="Describa brevemente el medicamento, sus usos o características..."
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                >
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
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 1.5,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }
                      },
                      container: document.body,
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      }
                    }}
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
                  placeholder="Ej: Tabletas 500mg, Jarabe 120ml, etc."
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                >
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
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 1.5,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }
                      },
                      container: document.body,
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      }
                    }}
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
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight={500}>
                      Requiere receta médica
                    </Typography>
                  }
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    p: 1.5,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: nuevoMedicamento.requiere_receta ? 
                      alpha(theme.palette.primary.main, 0.05) : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip 
                    label="Información de precios" 
                    color="primary"
                    sx={{ px: 1 }}
                  />
                </Divider>
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
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    sx: {
                      borderRadius: 1.5,
                    }
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
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    sx: {
                      borderRadius: 1.5,
                    }
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
                  InputProps={{ 
                    inputProps: { min: 0 },
                    sx: {
                      borderRadius: 1.5,
                    }
                  }}
                  required
                />
              </Grid>
              
              {/* Mensaje informativo */}
              <Grid item xs={12}>
                <Alert 
                  severity="info" 
                  variant="outlined"
                  icon={<InfoIcon />}
                  sx={{ 
                    borderRadius: 1.5,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  <Typography variant="body2">
                    El stock mínimo se utilizará para alertar cuando las existencias estén por debajo de este valor.
                    Después de crear el medicamento, podrá registrar lotes para aumentar su inventario.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
        
        {/* Botón de acción */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            mb: 4
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={submitting ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
            onClick={() => {
              if (tabValue === 0) {
                setConfirmDialogOpen(true);
              } else {
                handleSubmitMedicamento();
              }
            }}
            disabled={
              submitting || 
              (tabValue === 0 ? !validateLoteForm() : !validateMedicamentoForm())
            }
            sx={{ 
              borderRadius: 1.5,
              py: 1.5,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 15px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
        
        {/* Diálogo de confirmación para lotes */}
        <Dialog 
          open={confirmDialogOpen} 
          onClose={() => !submitting && setConfirmDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              p: 1
            }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle 
            sx={{ 
              p: 3,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              fontSize: '1.25rem',
              borderBottom: 1,
              borderColor: 'divider',
              color: theme.palette.primary.main
            }}
          >
            <DoneIcon sx={{ mr: 1 }} />
            Confirmar entrada de inventario
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Alert 
              severity="warning" 
              variant="outlined"
              sx={{ 
                mb: 3, 
                mt: 1,
                borderRadius: 1.5
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                Por favor verifique que la información sea correcta antes de continuar.
                Esta acción actualizará el stock del medicamento seleccionado.
              </Typography>
            </Alert>
            
            {selectedMedicamento && (
              <Card 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.5)
                }}
              >
                <CardContent>
                  <Typography 
                    variant="subtitle1" 
                    gutterBottom
                    fontWeight={600}
                    color="primary"
                  >
                    Detalles del lote a registrar:
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Medicamento
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ mb: 1.5 }}>
                        {selectedMedicamento.nombre} - {selectedMedicamento.presentacion}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Cantidad
                      </Typography>
                      <Chip 
                        label={`${nuevoLote.cantidad} unidades`} 
                        color="primary"
                        sx={{ 
                          fontWeight: 500, 
                          mt: 0.5,
                          borderRadius: 1
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Número de lote
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {nuevoLote.numero_lote}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de vencimiento
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {nuevoLote.fecha_vencimiento}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Precio de compra
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="primary">
                        ${formatCurrency(nuevoLote.precio_compra)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={submitting}
              variant="outlined"
              color="inherit"
              sx={{ 
                borderRadius: 1.5,
                textTransform: 'none'
              }}
            >
              Cancelar
            </Button>
            
            <Button 
              onClick={handleSubmitLote} 
              variant="contained" 
              color="primary"
              disabled={submitting}
              sx={{ 
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 15px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                }
              }}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <DoneIcon />}
            >
              {submitting ? 'Procesando...' : 'Confirmar entrada'}
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
              width: 320,
              borderRadius: 2,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }
          }}
        >
          <Box>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            >
              <EventIcon sx={{ mr: 1 }} />
              Seleccionar fecha
            </Typography>
            
            <DateCalendar
              value={tempDate}
              onChange={(newDate) => setTempDate(newDate || new Date())}
              minDate={new Date()}
              sx={{ 
                width: '100%',
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
                '& .MuiPickersDay-root.Mui-selected': {
                  bgcolor: theme.palette.primary.main,
                  fontWeight: 'bold',
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  fontWeight: 'bold',
                  color: theme.palette.primary.main
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
              <Button 
                onClick={handleCloseCalendar}
                variant="outlined"
                color="inherit"
                sx={{ 
                  borderRadius: 1.5,
                  textTransform: 'none'
                }}
              >
                Cancelar
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleApplyDate}
                sx={{ 
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600
                }}
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