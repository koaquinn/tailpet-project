// src/pages/facturacion/FacturaDetalle.tsx (nuevo)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import facturacionApi, { Factura, DetalleFactura } from '../../api/facturacionApi';
import { getCliente } from '../../api/clienteApi';

const FacturaDetalle: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [factura, setFactura] = useState<Factura | null>(null);
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [clienteDetalle, setClienteDetalle] = useState<any>(null);
  
  // Estado para modal de cambio de estado
  const [cambioEstadoOpen, setCambioEstadoOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<string>('');
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('');
  
  useEffect(() => {
    const fetchFactura = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Obtener factura y sus detalles
        const [facturaData, detallesData] = await Promise.all([
          facturacionApi.getFactura(parseInt(id)),
          facturacionApi.getDetallesFactura(parseInt(id))
        ]);
        
        setFactura(facturaData);
        setDetalles(detallesData.results);
        
        // Obtener información detallada del cliente
        if (facturaData.cliente) {
          const clienteData = await getCliente(facturaData.cliente);
          setClienteDetalle(clienteData);
        }
        
      } catch (error) {
        console.error('Error al cargar factura:', error);
        setError('Error al cargar los datos de la factura');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFactura();
  }, [id]);
  
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
  
  // Obtener nombre del tipo de ítem
  const getItemTypeName = (type: string) => {
    switch (type) {
      case 'CONSULTA':
        return 'Consulta';
      case 'TRATAMIENTO':
        return 'Tratamiento';
      case 'MEDICAMENTO':
        return 'Medicamento';
      case 'SERVICIO':
        return 'Servicio';
      default:
        return type;
    }
  };
  
  // Abrir diálogo de cambio de estado
  const handleOpenCambioEstado = () => {
    setNuevoEstado(factura?.estado === 'PENDIENTE' ? 'PAGADA' : 'PENDIENTE');
    setMotivoAnulacion('');
    setCambioEstadoOpen(true);
  };
  
  // Cerrar diálogo de cambio de estado
  const handleCloseCambioEstado = () => {
    setCambioEstadoOpen(false);
  };
  
  // Manejar cambio en el select de estado
  const handleEstadoChange = (event: SelectChangeEvent) => {
    setNuevoEstado(event.target.value);
  };
  
  // Guardar cambio de estado
  const handleGuardarCambioEstado = async () => {
    if (!factura || !factura.id) return;
    
    try {
      setLoading(true);
      
      const updateData: Partial<Factura> = {
        estado: nuevoEstado as 'PENDIENTE' | 'PAGADA' | 'ANULADA'
      };
      
      // Si es PAGADA, registrar fecha de pago
      if (nuevoEstado === 'PAGADA') {
        updateData.fecha_pago = new Date().toISOString().split('T')[0];
      }
      
      // Si es ANULADA, guardar motivo en notas
      if (nuevoEstado === 'ANULADA') {
        updateData.notas = `ANULACIÓN: ${motivoAnulacion}\n${factura.notas || ''}`.trim();
      }
      
      const updatedFactura = await facturacionApi.updateFactura(factura.id, updateData);
      setFactura(updatedFactura);
      
      setCambioEstadoOpen(false);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setError('Error al actualizar el estado de la factura');
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar impresión
  const handlePrint = () => {
    window.print();
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
      <Container maxWidth="lg">
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
  
  if (!factura) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 2 }}>
          Factura no encontrada
          <Button 
            component={Link} 
            to="/facturacion" 
            color="inherit" 
            size="small" 
            sx={{ ml: 2 }}
          >
            Volver a facturación
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
          to="/facturacion"
        >
          Volver a facturación
        </Button>
      </Box>
      
      <Paper 
        sx={{ 
          p: 4, 
          mb: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Marca de agua si está anulada */}
        {factura.estado === 'ANULADA' && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              color: 'rgba(255, 0, 0, 0.1)',
              fontSize: '10rem',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            ANULADA
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Factura #{factura.id}
          </Typography>
          
          <Chip 
            label={factura.estado} 
            color={getStatusColor(factura.estado)} 
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Datos del cliente
            </Typography>
            <Typography>
              <strong>Cliente:</strong> {clienteDetalle?.nombre} {clienteDetalle?.apellido}
            </Typography>
            <Typography>
              <strong>RUT:</strong> {clienteDetalle?.rut}
            </Typography>
            <Typography>
              <strong>Email:</strong> {clienteDetalle?.email}
            </Typography>
            <Typography>
              <strong>Teléfono:</strong> {clienteDetalle?.telefono}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Datos de la factura
            </Typography>
            <Typography>
              <strong>Fecha de emisión:</strong> {formatDate(factura.fecha_emision)}
            </Typography>
            <Typography>
              <strong>Fecha de pago:</strong> {factura.fecha_pago ? formatDate(factura.fecha_pago) : 'Pendiente'}
            </Typography>
            <Typography>
              <strong>Método de pago:</strong> {factura.metodo_pago_nombre || 'No especificado'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Detalle de la factura
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Precio unitario</TableCell>
                <TableCell align="right">Descuento</TableCell>
                <TableCell align="right">Subtotal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalles.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell>
                    {/* Aquí iría el nombre del ítem, pero solo tenemos el ID */}
                    Item #{detalle.item_id}
                  </TableCell>
                  <TableCell>{getItemTypeName(detalle.tipo_item)}</TableCell>
                  <TableCell align="right">{detalle.cantidad}</TableCell>
                  <TableCell align="right">${detalle.precio_unitario.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {detalle.descuento_porcentaje ? `${detalle.descuento_porcentaje}%` : '-'}
                  </TableCell>
                  <TableCell align="right">${detalle.subtotal.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell align="right">
                  <Typography variant="subtitle1">Subtotal:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">${factura.subtotal.toFixed(2)}</Typography>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell align="right">
                  <Typography variant="subtitle1">Impuesto:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">${factura.impuesto.toFixed(2)}</Typography>
                </TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell align="right">
                  <Typography variant="h6">Total:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6">${factura.total.toFixed(2)}</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        {factura.notas && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">Notas:</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {factura.notas}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            {factura.estado !== 'ANULADA' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setNuevoEstado('ANULADA');
                  setCambioEstadoOpen(true);
                }}
                sx={{ mr: 2 }}
              >
                Anular
              </Button>
            )}
            
            {factura.estado === 'PENDIENTE' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleOpenCambioEstado}
              >
                Marcar como pagada
              </Button>
            )}
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              sx={{ mr: 2 }}
            >
              Enviar por email
            </Button>
            
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Imprimir
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Diálogo de cambio de estado */}
      <Dialog open={cambioEstadoOpen} onClose={handleCloseCambioEstado}>
        <DialogTitle>
          Cambiar estado de la factura
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={nuevoEstado}
                label="Estado"
                onChange={handleEstadoChange}
              >
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="PAGADA">Pagada</MenuItem>
                <MenuItem value="ANULADA">Anulada</MenuItem>
              </Select>
            </FormControl>
            
            {nuevoEstado === 'ANULADA' && (
              <TextField
                fullWidth
                label="Motivo de anulación"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                multiline
                rows={3}
                required
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCambioEstado}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarCambioEstado}
            variant="contained" 
            color="primary"
            disabled={(nuevoEstado === 'ANULADA' && !motivoAnulacion)}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FacturaDetalle;