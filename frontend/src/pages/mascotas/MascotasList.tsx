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
import { getMascotas, getEspecies, getClientes, Mascota, Especie } from '../../api/mascotaApi';
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

  const clienteNombreMap = useMemo(() => {
    const map: Record<number, string> = {};
    clientes.forEach((c) => {
      if (c.id) {
        map[c.id] = formatFullName(c.nombre, c.apellido);
      }
    });
    return map;
  }, [clientes]);

  const especieNombreMap = useMemo(() => {
    const map: Record<number, string> = {};
    especies.forEach((e) => {
      if (e.id) {
        map[e.id] = e.nombre;
      }
    });
    return map;
  }, [especies]);

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

      // Enriquecer los datos de mascotas con nombres
      const mascotasEnriquecidas = mascotasData.results.map(mascota => ({
        ...mascota,
        especie_nombre: especieNombreMap[mascota.especie] || `Especie #${mascota.especie}`,
        cliente_nombre: clienteNombreMap[mascota.cliente] || `Cliente #${mascota.cliente}`
      }));

      setMascotas(mascotasEnriquecidas);
      setFilteredMascotas(mascotasEnriquecidas);
      setClientes(clientesData.results || []);
      setEspecies(especiesData.results || []);
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
              <InputLabel>Cliente</InputLabel>
              <Select
                name="cliente"
                value={filters.cliente}
                label="Cliente"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {clientes.map((c) => (
                  <MenuItem key={c.id} value={c.id?.toString() || ''}>
                    {formatFullName(c.nombre, c.apellido)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Especie</InputLabel>
              <Select
                name="especie"
                value={filters.especie}
                label="Especie"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {especies.map((e) => (
                  <MenuItem key={e.id} value={e.id?.toString() || ''}>
                    {e.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="activos"
                value={filters.activos}
                label="Estado"
                onChange={handleFilterChange}
              >
                <MenuItem value="true">Activos</MenuItem>
                <MenuItem value="false">Inactivos</MenuItem>
                <MenuItem value="">Todos</MenuItem>
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
              paginatedMascotas.map((mascota) => {
                const clienteNombre = clienteNombreMap[mascota.cliente] || `Cliente #${mascota.cliente}`;
                const especieNombre = especieNombreMap[mascota.especie] || `Especie #${mascota.especie}`;

                return (
                  <TableRow key={mascota.id} hover>
                    <TableCell>{mascota.nombre}</TableCell>
                    <TableCell>{clienteNombre}</TableCell>
                    <TableCell>{especieNombre}</TableCell>
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
                );
              })
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