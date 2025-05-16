// src/pages/clientes/ClientesList.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Box,
  TextField, 
  InputAdornment, 
  Chip, 
  IconButton,
  TablePagination, 
  CircularProgress, 
  FormControlLabel, 
  Switch, 
  Alert, 
  Snackbar, 
  Menu, 
  MenuItem,
  useTheme,
  alpha,
  Badge,
  Tooltip,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Pets as PetsIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { getClientes, Cliente } from '../../api/clienteApi';
import { useAuth } from '../../context/AuthContext';

const ClientesList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN') || hasRole('RECEPCIONISTA');
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  
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
  
  const fetchClientes = useCallback(async (showRefreshIndicator = true) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
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
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
    }
  }, []);
  
  useEffect(() => {
    fetchClientes(false);
  }, [fetchClientes]);
  
  useEffect(() => {
    let filtered = [...clientes];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cliente => 
        cliente.nombre.toLowerCase().includes(term) ||
        cliente.apellido.toLowerCase().includes(term) ||
        cliente.rut.includes(term) ||
        (cliente.email && cliente.email.toLowerCase().includes(term)) ||
        (cliente.telefono && cliente.telefono.includes(term))
      );
    }
    
    // Filtrar por estado activo
    if (showOnlyActive) {
      filtered = filtered.filter(cliente => cliente.activo);
    }
    
    setFilteredClientes(filtered);
    setPage(0); // Resetear a la primera página cuando cambia el filtro
    
    // Actualiza si hay filtros aplicados
    setFiltersApplied(!!searchTerm || !showOnlyActive);
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
  
  const clearAllFilters = () => {
    setSearchTerm('');
    setShowOnlyActive(true);
    handleCloseFilterMenu();
  };
  
  // Calcular clientes paginados
  const paginatedClientes = filteredClientes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  const handleViewMascotas = (clienteId: number) => {
    navigate(`/clientes/${clienteId}/mascotas`);
  };
  
  // Función auxiliar para copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({
      open: true,
      message: 'Copiado al portapapeles',
      severity: 'success'
    });
  };
  
  return (
    <Container maxWidth="lg">
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          <PersonIcon 
            sx={{ 
              mr: 1.5, 
              color: theme.palette.primary.main,
              fontSize: 32
            }}
          />
          Clientes
          <Badge 
            badgeContent={filteredClientes.length} 
            color="primary"
            showZero
            sx={{ 
              ml: 2,
              '& .MuiBadge-badge': {
                fontSize: '0.8rem',
                fontWeight: 600,
                height: 22,
                minWidth: 22,
              }
            }}
          />
        </Typography>
        
        {canEdit && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/clientes/nuevo')}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 1.5,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              px: { xs: 2, sm: 3 },
              py: 1.2,
              fontWeight: 500,
              '&:hover': {
                boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Nuevo Cliente
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          variant="outlined"
          sx={{ 
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
            bgcolor: alpha(theme.palette.error.main, 0.05)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {error}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            size="small" 
            color="error"
            onClick={() => fetchClientes()}
            startIcon={refreshing ? <CircularProgress size={16} color="error" /> : <RefreshIcon />}
            sx={{ 
              mt: 1,
              borderRadius: 1.5,
              textTransform: 'none'
            }}
            disabled={refreshing}
          >
            {refreshing ? 'Cargando...' : 'Reintentar'}
          </Button>
        </Alert>
      )}
      
      <Paper 
        elevation={2}
        sx={{ 
          mb: 3, 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          boxShadow: `0 2px 12px 0 ${alpha(theme.palette.grey[500], 0.08)}`
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre, RUT, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 1.5,
                bgcolor: theme.palette.background.paper,
                '&.MuiOutlinedInput-root': {
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                  }
                }
              }
            }}
          />
          
          <Tooltip title="Opciones de filtro">
            <IconButton 
              onClick={handleOpenFilterMenu}
              color={!showOnlyActive ? "primary" : "default"}
              aria-label="opciones de filtro"
              sx={{ 
                bgcolor: !showOnlyActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                width: 40,
                height: 40,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: !showOnlyActive ? 
                    alpha(theme.palette.primary.main, 0.2) : 
                    alpha(theme.palette.action.hover, 0.8)
                },
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refrescar lista">
            <IconButton 
              onClick={() => fetchClientes()}
              disabled={refreshing}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                width: 40,
                height: 40,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2)
                },
              }}
            >
              {refreshing ? (
                <CircularProgress size={20} color="primary" />
              ) : (
                <RefreshIcon color="primary" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
        
        {filtersApplied && (
          <Box 
            sx={{ 
              mt: 2, 
              pt: 2, 
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Filtros aplicados:
            </Typography>
            
            {searchTerm && (
              <Chip 
                label={`Búsqueda: ${searchTerm}`} 
                onDelete={() => setSearchTerm('')}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
            )}
            
            {!showOnlyActive && (
              <Chip 
                label="Incluyendo inactivos" 
                onDelete={() => setShowOnlyActive(true)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
            )}
            
            <Button 
              variant="text" 
              size="small" 
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              sx={{ ml: 'auto' }}
            >
              Limpiar todos
            </Button>
          </Box>
        )}
        
        {/* Menú de opciones de filtro */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleCloseFilterMenu}
          elevation={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 220,
              boxShadow: `0 4px 20px 0 ${alpha(theme.palette.grey[500], 0.1)}, 
                          0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.1)}`,
              borderRadius: 2
            }
          }}
        >
          <MenuItem disableRipple>
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
          <Divider />
          <MenuItem onClick={clearAllFilters}>
            <ListItemIcon>
              <ClearIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Limpiar filtros</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>
      
      <Paper 
        elevation={3}
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: `0 4px 20px 0 ${alpha(theme.palette.grey[500], 0.1)}, 
                     0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.1)}`
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Apellido</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>RUT</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={60} />
                  </TableCell>
                </TableRow>
              ) : paginatedClientes.length > 0 ? (
                paginatedClientes.map((cliente) => (
                  <TableRow 
                    key={cliente.id} 
                    hover
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                    onClick={() => cliente.id && handleViewMascotas(cliente.id)}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.apellido}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {cliente.rut}
                        <Tooltip title="Copiar RUT">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(cliente.rut);
                            }}
                            sx={{ ml: 1, opacity: 0.5, '&:hover': { opacity: 1 } }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {cliente.telefono ? (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1 
                          }}
                        >
                          <PhoneIcon 
                            fontSize="small" 
                            color="primary"
                            sx={{ opacity: 0.7 }}
                          />
                          {cliente.telefono}
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {cliente.email ? (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1 
                          }}
                        >
                          <EmailIcon 
                            fontSize="small" 
                            color="primary"
                            sx={{ opacity: 0.7 }}
                          />
                          <Typography 
                            sx={{ 
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {cliente.email}
                          </Typography>
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.activo ? "Activo" : "Inactivo"} 
                        color={cliente.activo ? "success" : "error"} 
                        size="small"
                        sx={{ 
                          fontWeight: 500,
                          borderRadius: 1
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Ver mascotas">
                          <IconButton 
                            color="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              cliente.id && handleViewMascotas(cliente.id);
                            }}
                            aria-label="Ver mascotas"
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              }
                            }}
                          >
                            <PetsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {canEdit && cliente.id && (
                          <Tooltip title="Editar cliente">
                            <IconButton 
                              color="info"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/clientes/editar/${cliente.id}`);
                              }}
                              aria-label="Editar cliente"
                              sx={{ 
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.info.main, 0.2),
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No se encontraron clientes
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {searchTerm ? 
                          `No hay clientes que coincidan con "${searchTerm}"` : 
                          'No hay clientes registrados en el sistema'}
                      </Typography>
                      
                      {filtersApplied && (
                        <Button
                          variant="outlined"
                          startIcon={<ClearIcon />}
                          onClick={clearAllFilters}
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
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
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            '.MuiTablePagination-toolbar': {
              paddingRight: 3,
            },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontWeight: 500,
            }
          }}
        />
      </Paper>
      
      <Snackbar 
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: `0 2px 10px ${alpha(
              notification.severity === 'success' ? 
                theme.palette.success.main : 
                theme.palette.error.main, 
              0.3
            )}`,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Para el componente ListItemIcon
const ListItemIcon = (props: any) => (
  <Box sx={{ mr: 2, color: 'primary.main' }}>{props.children}</Box>
);

// Para el componente ListItemText
const ListItemText = (props: any) => (
  <Typography variant="body2">{props.children}</Typography>
);

export default ClientesList;