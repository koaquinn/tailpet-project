// src/pages/inventario/InventarioList.tsx (nuevo)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  AddBox as AddBoxIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import inventarioApi, { Medicamento, LoteMedicamento } from '../../api/inventarioApi';
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
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
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

const InventarioList: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [lotes, setLotes] = useState<LoteMedicamento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el modal de entrada de inventario
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState<Medicamento | null>(null);
  const [entradaData, setEntradaData] = useState({
    cantidad: 0,
    numero_lote: '',
    fecha_vencimiento: '',
    proveedor_id: 0,
    precio_compra: 0,
    motivo: 'Entrada de inventario'
  });
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [medicamentosData, lotesData] = await Promise.all([
        inventarioApi.getMedicamentos({ activo: true }),
        inventarioApi.getLotes()
      ]);
      
      setMedicamentos(medicamentosData.results);
      setLotes(lotesData.results);
      setError(null);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setError('Error al cargar los datos de inventario');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Filtrar medicamentos por término de búsqueda
  const filteredMedicamentos = medicamentos.filter(med => 
    med.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.presentacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.descripcion && med.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Filtrar lotes por término de búsqueda
  const filteredLotes = lotes.filter(lote => 
    String(lote.medicamento_nombre).toLowerCase().includes(searchTerm.toLowerCase()) ||
    lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Verificar si un medicamento tiene stock bajo
  const hasLowStock = (medicamentoId: number | undefined) => {
    if (!medicamentoId) return false;
    
    const medicamento = medicamentos.find(m => m.id === medicamentoId);
    if (!medicamento) return false;
    
    const medicamentoLotes = lotes.filter(l => l.medicamento === medicamentoId);
    const totalStock = medicamentoLotes.reduce((sum, lote) => sum + lote.cantidad, 0);
    
    return totalStock < medicamento.stock_minimo;
  };
  
  // Abrir diálogo de entrada de inventario
  const handleOpenEntradaDialog = (medicamento: Medicamento) => {
    setSelectedMedicamento(medicamento);
    setEntradaData({
      cantidad: 0,
      numero_lote: '',
      fecha_vencimiento: '',
      proveedor_id: medicamento.proveedor,
      precio_compra: medicamento.precio_compra,
      motivo: 'Entrada de inventario'
    });
    setEntradaDialogOpen(true);
  };
  
  // Cerrar diálogo de entrada de inventario
  const handleCloseEntradaDialog = () => {
    setEntradaDialogOpen(false);
    setSelectedMedicamento(null);
  };
  
  // Manejar cambios en el formulario de entrada
  const handleEntradaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEntradaData(prev => ({
      ...prev,
      [name]: name === 'cantidad' || name === 'precio_compra' ? parseFloat(value) : value
    }));
  };
  
  // Guardar entrada de inventario
  const handleSaveEntrada = async () => {
    if (!selectedMedicamento || !selectedMedicamento.id) return;
    
    try {
      setLoading(true);
      await inventarioApi.registrarEntrada(selectedMedicamento.id, entradaData);
      await fetchData();
      handleCloseEntradaDialog();
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      setError('Error al registrar la entrada de inventario');
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
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Inventario
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/inventario/nuevo-medicamento"
        >
          Nuevo Medicamento
        </Button>
      </Box>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1, bgcolor: 'white' }} 
            onClick={fetchData}
          >
            Reintentar
          </Button>
        </Paper>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar en inventario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Medicamentos" {...a11yProps(0)} />
          <Tab label="Lotes" {...a11yProps(1)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Presentación</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Precio Venta</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMedicamentos.length > 0 ? (
                  filteredMedicamentos.map((med) => (
                    <TableRow key={med.id} hover>
                      <TableCell>{med.nombre}</TableCell>
                      <TableCell>{med.presentacion}</TableCell>
                      <TableCell>{med.tipo}</TableCell>
                      <TableCell align="right">${med.precio_venta.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={med.activo ? 'Activo' : 'Inactivo'} 
                          color={med.activo ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="center">
                        {hasLowStock(med.id) ? (
                          <Chip 
                            icon={<WarningIcon />}
                            label="Stock Bajo" 
                            color="warning" 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            label="Disponible" 
                            color="success" 
                            size="small" 
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            color="primary" 
                            size="small"
                            component={Link}
                            to={`/inventario/medicamentos/${med.id}`}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="success" 
                            size="small"
                            onClick={() => handleOpenEntradaDialog(med)}
                          >
                            <AddBoxIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {searchTerm ? 'No se encontraron medicamentos con ese término de búsqueda' : 'No hay medicamentos registrados'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Medicamento</TableCell>
                  <TableCell>Lote</TableCell>
                  <TableCell>Vencimiento</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell align="right">Precio Compra</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLotes.length > 0 ? (
                  filteredLotes.map((lote) => (
                    <TableRow key={lote.id} hover>
                      <TableCell>{lote.medicamento_nombre}</TableCell>
                      <TableCell>{lote.numero_lote}</TableCell>
                      <TableCell>{formatDate(lote.fecha_vencimiento)}</TableCell>
                      <TableCell align="right">{lote.cantidad}</TableCell>
                      <TableCell>{lote.proveedor_nombre}</TableCell>
                      <TableCell align="right">${lote.precio_compra.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="primary" 
                          size="small"
                          component={Link}
                          to={`/inventario/lotes/${lote.id}`}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {searchTerm ? 'No se encontraron lotes con ese término de búsqueda' : 'No hay lotes registrados'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
      
      {/* Diálogo de entrada de inventario */}
      <Dialog open={entradaDialogOpen} onClose={handleCloseEntradaDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar entrada de inventario</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedMedicamento?.nombre} - {selectedMedicamento?.presentacion}
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="numero_lote"
                  label="Número de lote"
                  value={entradaData.numero_lote}
                  onChange={handleEntradaChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="fecha_vencimiento"
                  label="Fecha de vencimiento"
                  type="date"
                  value={entradaData.fecha_vencimiento}
                  onChange={handleEntradaChange}
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
                  value={entradaData.cantidad}
                  onChange={handleEntradaChange}
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
                  value={entradaData.precio_compra}
                  onChange={handleEntradaChange}
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
                  value={entradaData.motivo}
                  onChange={handleEntradaChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEntradaDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveEntrada} 
            variant="contained" 
            color="primary"
            disabled={!entradaData.numero_lote || !entradaData.fecha_vencimiento || entradaData.cantidad <= 0}
          >
            Guardar entrada
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InventarioList;