// src/pages/facturacion/FacturasList.tsx (nuevo)
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  EditCalendar as EditIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import facturacionApi, { Factura } from '../../api/facturacionApi';

const FacturasList: React.FC = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState<Date | null>(null);
  const [filterFechaHasta, setFilterFechaHasta] = useState<Date | null>(null);
  
  const fetchFacturas = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      
      if (filterEstado) {
        params.estado = filterEstado;
      }
      
      if (filterFechaDesde) {
        params.fecha_emision_gte = filterFechaDesde.toISOString().split('T')[0];
      }
      
      if (filterFechaHasta) {
        params.fecha_emision_lte = filterFechaHasta.toISOString().split('T')[0];
      }
      
      const response = await facturacionApi.getFacturas(params);
      setFacturas(response.results);
      setError(null);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      setError('Error al cargar la lista de facturas');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFacturas();
  }, [filterEstado, filterFechaDesde, filterFechaHasta]);
  
  const handleFilterEstadoChange = (event: SelectChangeEvent) => {
    setFilterEstado(event.target.value);
  };
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Obtener color según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return 'warning';
      case 'PAGADA':
        return 'success';
      case 'ANULADA':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Filtrar facturas por término de búsqueda
  const filteredFacturas = facturas.filter(factura => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (factura.cliente_nombre && factura.cliente_nombre.toLowerCase().includes(searchLower)) ||
      (String(factura.id).toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Facturación
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/facturacion/nueva"
        >
          Nueva Factura
        </Button>
      </Box>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1, bgcolor: 'white' }} 
            onClick={fetchFacturas}
          >
            Reintentar
          </Button>
        </Paper>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por cliente o número de factura"
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
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                label="Estado"
                onChange={handleFilterEstadoChange}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="PAGADA">Pagada</MenuItem>
                <MenuItem value="ANULADA">Anulada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Desde"
                value={filterFechaDesde}
                onChange={(date) => setFilterFechaDesde(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Hasta"
                value={filterFechaHasta}
                onChange={(date) => setFilterFechaHasta(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Factura #</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Fecha Emisión</TableCell>
                <TableCell>Fecha Pago</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredFacturas.length > 0 ? (
                filteredFacturas.map((factura) => (
                  <TableRow key={factura.id} hover>
                    <TableCell>#{factura.id}</TableCell>
                    <TableCell>{factura.cliente_nombre}</TableCell>
                    <TableCell>{formatDate(factura.fecha_emision)}</TableCell>
                    <TableCell>
                      {factura.fecha_pago ? formatDate(factura.fecha_pago) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      ${factura.total.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={factura.estado} 
                        color={getStatusColor(factura.estado)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          color="primary" 
                          size="small"
                          component={Link}
                          to={`/facturacion/${factura.id}`}
                          sx={{ mr: 1 }}
                          title="Ver factura"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {factura.estado === 'PENDIENTE' && (
                          <IconButton 
                            color="secondary" 
                            size="small"
                            component={Link}
                            to={`/facturacion/${factura.id}/editar`}
                            title="Editar factura"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm || filterEstado || filterFechaDesde || filterFechaHasta ? 
                      'No se encontraron facturas con los filtros seleccionados' : 
                      'No hay facturas registradas'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default FacturasList;