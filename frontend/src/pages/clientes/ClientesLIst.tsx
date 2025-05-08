// src/pages/clientes/ClientesList.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box,
  TextField, InputAdornment, Chip, IconButton, Tooltip,
  TablePagination, CircularProgress, FormControlLabel, 
  Switch, Alert, Snackbar, Menu, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getClientes, Cliente, deleteCliente } from '../../api/clienteApi';
import { useNavigate } from 'react-router-dom';

const ClientesList = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Menu de opciones de filtro
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  // Notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  
  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientes();
      const clientesData = data.results || [];
      setClientes(clientesData);
      setFilteredClientes(clientesData);
    } catch (error) {
      console.error("Error:", error);
      setError('Error al cargar los clientes. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchClientes();
  }, []);
  
  useEffect(() => {
    let filtered = [...clientes];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(cliente => 
        cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.rut.includes(searchTerm) ||
        cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por estado activo
    if (showOnlyActive) {
      filtered = filtered.filter(cliente => cliente.activo);
    }
    
    setFilteredClientes(filtered);
    setPage(0); // Resetear a la primera página cuando cambia el filtro
  }, [searchTerm, clientes, showOnlyActive]);
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Calcular clientes paginados
  const paginatedClientes = filteredClientes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Clientes
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/clientes/nuevo"
          startIcon={<AddIcon />}
        >
          Nuevo Cliente
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            color="inherit" 
            size="small" 
            onClick={fetchClientes}
            sx={{ ml: 2 }}
          >
            Reintentar
          </Button>
        </Alert>
      )}
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre, RUT o email..."
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
          
          <IconButton 
            onClick={handleOpenFilterMenu}
            color={showOnlyActive ? "primary" : "default"}
            aria-label="opciones de filtro"
          >
            <FilterListIcon />
          </IconButton>
        </Box>
        
        {/* Menú de opciones de filtro */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleCloseFilterMenu}
        >
          <MenuItem>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                  name="showOnlyActive"
                  color="primary"
                />
              }
              label="Solo clientes activos"
            />
          </MenuItem>
        </Menu>
      </Paper>
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>RUT</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : paginatedClientes.length > 0 ? (
                paginatedClientes.map((cliente) => (
                  <TableRow 
                    key={cliente.id} 
                    hover
                    onClick={() => navigate(`/clientes/${cliente.id}/mascotas`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.apellido}</TableCell>
                    <TableCell>{cliente.rut}</TableCell>
                    <TableCell>{cliente.telefono}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.activo ? "Activo" : "Inactivo"} 
                        color={cliente.activo ? "success" : "error"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Editar cliente">
                          <IconButton 
                            component={Link} 
                            to={`/clientes/editar/${cliente.id}`}
                            color="primary"
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron clientes
                    {searchTerm && (
                      <Box component="span" sx={{ ml: 1 }}>
                        con los criterios de búsqueda
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredClientes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>
      
      <Snackbar 
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Aquí podría ir un diálogo de confirmación para eliminar clientes */}
    </Container>
  );
};

export default ClientesList;