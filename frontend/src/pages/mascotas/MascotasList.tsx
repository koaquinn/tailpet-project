// src/pages/mascotas/MascotasList.tsx
import { useState, useEffect, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TablePagination,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  HealthAndSafety as HealthIcon,
  Vaccines as VaccineIcon,
  Pets as PetsIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getMascotas, getEspecies, Mascota, Especie } from '../../api/mascotaApi';
import { getClientes } from '../../api/clienteApi';
import { Cliente } from '../../types/cliente';
import { formatFullName, booleanToText, sexoToText } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const MascotasList = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN') || hasRole('RECEPCIONISTA');
  const canViewHistory = hasRole('ADMIN') || hasRole('VETERINARIO');
  
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [filteredMascotas, setFilteredMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [especies, setEspecies] = useState<Especie[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ cliente: '', especie: '', activos: 'true' });
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Notificación
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Mapeamos clientes por ID para acceso rápido
  const clienteNombreMap = useMemo(() => {
    const map: Record<number, string> = {};
    clientes.forEach((c) => {
      if (c.id) {
        map[c.id] = formatFullName(c.nombre, c.apellido);
      }
    });
    return map;
  }, [clientes]);

  // Mapeamos especies por ID para acceso rápido
  const especieNombreMap = useMemo(() => {
    const map: Record<number, string> = {};
    especies.forEach((e) => {
      if (e.id) {
        map[e.id] = e.nombre;
      }
    });
    return map;
  }, [especies]);

  // Enriquecemos las mascotas con la información de cliente y especie
  const enrichMascotas = (mascotasData: Mascota[]) => {
    return mascotasData.map(mascota => ({
      ...mascota,
      cliente_nombre: clienteNombreMap[mascota.cliente] || `Cliente #${mascota.cliente}`,
      especie_nombre: especieNombreMap[mascota.especie] || `Especie #${mascota.especie}`
    }));
  };

  // Actualizar las mascotas enriquecidas cuando cambien los mapas de clientes o especies
  useEffect(() => {
    if (mascotas.length > 0) {
      const enrichedMascotas = enrichMascotas(mascotas);
      setMascotas(enrichedMascotas);
      
      // Aplicamos búsqueda después de enriquecer
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = enrichedMascotas.filter((mascota) => {
          const clienteNombre = clienteNombreMap[mascota.cliente]?.toLowerCase() || '';
          return (
            mascota.nombre.toLowerCase().includes(term) || 
            clienteNombre.includes(term)
          );
        });
        setFilteredMascotas(filtered);
      } else {
        setFilteredMascotas(enrichedMascotas);
      }
    }
  }, [clienteNombreMap, especieNombreMap]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar parámetros de filtrado para la API
      const params: any = {};
      if (filters.activos !== '') {
        params.activo = filters.activos === 'true';
      }
      if (filters.cliente) {
        params.cliente = Number(filters.cliente);
      }
      if (filters.especie) {
        params.especie = Number(filters.especie);
      }
      
      const [mascotasData, clientesData, especiesData] = await Promise.all([
        getMascotas(params),
        getClientes(),
        getEspecies(),
      ]);

      // Guardamos clientes y especies primero para que los mapas estén disponibles
      setClientes(clientesData.results || []);
      setEspecies(especiesData.results || []);
      
      // Luego configuramos las mascotas
      setMascotas(mascotasData.results);
      setFilteredMascotas(mascotasData.results);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los datos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.activos, filters.cliente, filters.especie]);

  useEffect(() => {
    if (searchTerm && mascotas.length > 0) {
      const term = searchTerm.toLowerCase();
      const filtered = mascotas.filter((mascota) => {
        const clienteNombre = clienteNombreMap[mascota.cliente]?.toLowerCase() || '';
        return (
          mascota.nombre.toLowerCase().includes(term) || 
          clienteNombre.includes(term)
        );
      });
      setFilteredMascotas(filtered);
    } else {
      setFilteredMascotas(mascotas);
    }
    
    // Resetear paginación
    setPage(0);
  }, [searchTerm, mascotas, clienteNombreMap]);

  const handleFilterChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ cliente: '', especie: '', activos: 'true' });
    setSearchTerm('');
  };
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Calcular mascotas paginadas
  const paginatedMascotas = filteredMascotas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <PetsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Mascotas
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            onClick={() => navigate('/mascotas/nuevo')}
            startIcon={<AddIcon />}
          >
            Nueva Mascota
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            color="inherit"
            size="small"
            onClick={fetchData}
            startIcon={<RefreshIcon />}
            sx={{ ml: 2 }}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Buscar mascota o dueño"
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

          <Grid item xs={12} md={3}>
  <FormControl fullWidth>
    <InputLabel 
      id="cliente-filter-label"
      shrink={!!filters.cliente}
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
      }}
    >
      Cliente
    </InputLabel>
    <Select
      labelId="cliente-filter-label"
      name="cliente"
      value={filters.cliente}
      label="Cliente"
      onChange={handleFilterChange}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Todos los clientes</span>;
        }
        const cliente = clientes.find(c => c.id?.toString() === selected);
        return cliente ? formatFullName(cliente.nombre, cliente.apellido) : selected;
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 400,
            minWidth: 300,
            mt: 1,
            '& .MuiMenuItem-root': {
              whiteSpace: 'normal',
              minHeight: '48px',
              py: 1.5,
            },
          },
        },
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
        disablePortal: true,
      }}
      sx={{
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          minHeight: '1.4375em',
          padding: '16.5px 14px',
        },
      }}
    >
      <MenuItem value="">
        <em>Todos los clientes</em>
      </MenuItem>
      {clientes.map((cliente) => (
        <MenuItem key={cliente.id} value={cliente.id?.toString() || ''}>
          <Box>
            <Typography>{formatFullName(cliente.nombre, cliente.apellido)}</Typography>
            {cliente.rut && (
              <Typography variant="body2" color="text.secondary">
                {cliente.rut}
              </Typography>
            )}
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>

          <Grid item xs={12} md={2}>
  <FormControl fullWidth>
    <InputLabel 
      id="especie-filter-label"
      shrink={!!filters.especie}
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
      }}
    >
      Especie
    </InputLabel>
    <Select
      labelId="especie-filter-label"
      name="especie"
      value={filters.especie}
      label="Especie"
      onChange={handleFilterChange}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Todas las especies</span>;
        }
        const especie = especies.find(e => e.id?.toString() === selected);
        return especie?.nombre || selected;
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300,
            minWidth: 250,
            mt: 1,
          },
        },
      }}
      sx={{
        '& .MuiSelect-select': {
          padding: '16.5px 14px',
        },
      }}
    >
      <MenuItem value="">
        <em>Todas las especies</em>
      </MenuItem>
      {especies.map((especie) => (
        <MenuItem key={especie.id} value={especie.id?.toString() || ''}>
          {especie.nombre}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>
          
          <Grid item xs={12} md={2}>
  <FormControl fullWidth>
    <InputLabel 
      id="estado-filter-label"
      shrink={filters.activos !== ''} // Cambio importante aquí
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
      }}
    >
      Estado
    </InputLabel>
    <Select
      labelId="estado-filter-label"
      name="activos"
      value={filters.activos}
      label="Estado"
      onChange={handleFilterChange}
      displayEmpty // Añadido para manejar mejor el estado vacío
      renderValue={(selected) => {
        if (selected === 'true') return 'Activos';
        if (selected === 'false') return 'Inactivos';
        return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Todos</span>; // Estilo para "Todos"
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300,
            minWidth: 200,
            mt: 1,
          },
        },
      }}
      sx={{
        '& .MuiSelect-select': {
          padding: '16.5px 14px',
          display: 'flex',
          alignItems: 'center',
        },
      }}
    >
      <MenuItem value="true">Activos</MenuItem>
      <MenuItem value="false">Inactivos</MenuItem>
      <MenuItem value="">
        <em>Todos</em> {/* Usamos <em> para el estilo de placeholder */}
      </MenuItem>
    </Select>
  </FormControl>
</Grid>

          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              onClick={resetFilters} 
              fullWidth
              startIcon={<FilterListIcon />}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Dueño</TableCell>
              <TableCell>Especie</TableCell>
              <TableCell>Sexo</TableCell>
              <TableCell align="center">Esterilizado</TableCell>
              <TableCell align="center">Estado</TableCell>
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
            ) : paginatedMascotas.length > 0 ? (
              paginatedMascotas.map((mascota) => (
                <TableRow key={mascota.id} hover>
                  <TableCell>{mascota.nombre}</TableCell>
                  <TableCell>{clienteNombreMap[mascota.cliente] || `Cliente #${mascota.cliente}`}</TableCell>
                  <TableCell>{especieNombreMap[mascota.especie] || `Especie #${mascota.especie}`}</TableCell>
                  <TableCell>{sexoToText(mascota.sexo)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={booleanToText(mascota.esterilizado)}
                      color={mascota.esterilizado ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={mascota.activo ? 'Activo' : 'Inactivo'}
                      color={mascota.activo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {canEdit && mascota.id && (
                        <Tooltip title="Editar mascota">
                          <IconButton 
                            onClick={() => navigate(`/mascotas/editar/${mascota.id}`)} 
                            color="primary" 
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {canViewHistory && mascota.id && (
                        <Tooltip title="Historial médico">
                          <IconButton 
                            onClick={() => navigate(`/mascotas/${mascota.id}/historial`)} 
                            color="secondary" 
                            size="small"
                          >
                            <HealthIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {canViewHistory && mascota.id && (
                        <Tooltip title="Vacunas">
                          <IconButton 
                            onClick={() => navigate(`/mascotas/${mascota.id}/vacunas`)} 
                            color="info" 
                            size="small"
                          >
                            <VaccineIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron mascotas
                  {searchTerm || filters.cliente || filters.especie || filters.activos !== 'true' ? (
                    <Box component="span" sx={{ ml: 1 }}>
                      con los filtros seleccionados
                    </Box>
                  ) : null}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredMascotas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count}`
          }
        />
      </TableContainer>
      
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
    </Container>
  );
};

export default MascotasList;