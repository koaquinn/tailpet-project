// src/pages/citas/CitasList.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  InputAdornment,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Card,
  CardContent,
  TablePagination,
  Badge,
  Fade,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Event as EventIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Cancel as CancelIcon,
  LocalHospital as HospitalIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import citasApi, { Consulta } from '../../api/citasApi';
import consultaApi from '../../api/consultaApi';
import { useAuth } from '../../context/AuthContext';

// Constantes para tipos y estados
const TIPOS_CONSULTA = [
  { value: 'RUTINA', label: 'Rutina', color: 'info' },
  { value: 'EMERGENCIA', label: 'Emergencia', color: 'error' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento', color: 'warning' },
];

const ESTADOS_CONSULTA = [
  { value: 'PROGRAMADA', label: 'Programada', color: 'primary' },
  { value: 'EN_CURSO', label: 'En curso', color: 'warning' },
  { value: 'COMPLETADA', label: 'Completada', color: 'success' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'error' },
];

const CitasList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtros
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  const { user } = useAuth();

  // Verificar si el usuario es veterinario o admin
  const canManageConsulta = user?.rol === 'VETERINARIO' || user?.rol === 'ADMIN';

  const handleCancelarConsulta = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta consulta?')) {
      return;
    }
    
    try {
      setProcessingAction(id);
      await citasApi.updateConsulta(id, { estado: 'CANCELADA' });
      fetchConsultas(); // Refresca la lista luego de cancelar
    } catch (err) {
      console.error('Error al cancelar consulta:', err);
      alert('Hubo un problema al cancelar la consulta');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleIniciarConsulta = async (id: number) => {
    try {
      setProcessingAction(id);
      await consultaApi.iniciarConsulta(id);
      navigate(`/citas/consulta/${id}`);
    } catch (err) {
      console.error('Error al iniciar consulta:', err);
      alert('Hubo un problema al iniciar la consulta');
      setProcessingAction(null);
    }
  };

  const handleContinuarConsulta = (id: number) => {
    navigate(`/citas/consulta/${id}`);
  };

  const fetchConsultas = async (showRefreshIndicator = true) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      let params: Record<string, any> = {};
      
      if (filterDate) {
        params.fecha = format(filterDate, 'yyyy-MM-dd');
      }
      
      if (filterStatus) {
        params.estado = filterStatus;
      }
      
      if (filterType) {
        params.tipo = filterType;
      }
      
      // Si el usuario es veterinario, solo mostrar sus consultas
      if (user?.rol === 'VETERINARIO') {
        params.veterinario = user.id;
      }
      
      const response = await citasApi.getConsultas(params);
      setConsultas(response.results);
      setError(null);
      
      // Verificar si hay filtros aplicados
      setFiltersApplied(
        !!filterDate || 
        !!filterStatus || 
        !!filterType || 
        !!searchTerm
      );
      
      // Reiniciar paginación
      setPage(0);
    } catch (err) {
      console.error('Error al cargar consultas:', err);
      setError('Error al cargar la lista de consultas');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchConsultas(false);
  }, [filterDate, filterStatus, filterType, user?.id]);

  const getStatusColor = (status: string) => {
    const estado = ESTADOS_CONSULTA.find(e => e.value === status);
    return estado ? estado.color : 'default';
  };

  const getTypeColor = (type: string) => {
    const tipo = TIPOS_CONSULTA.find(t => t.value === type);
    return tipo ? tipo.color : 'default';
  };

  const filterConsultas = () => {
    if (!searchTerm) return consultas;
    
    return consultas.filter(consulta => 
      consulta.mascota_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.veterinario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consulta.motivo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredConsultas = filterConsultas();
  
  // Consultas paginadas
  const paginatedConsultas = filteredConsultas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Función para formatear fecha con formato relativo (Hoy, Mañana, etc.)
  const formatFechaRelativa = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    
    if (isToday(fecha)) {
      return `Hoy, ${fecha.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`;
    } else if (isTomorrow(fecha)) {
      return `Mañana, ${fecha.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`;
    } else {
      const diferenciaDias = differenceInDays(fecha, new Date());
      
      if (diferenciaDias < 7 && diferenciaDias > 0) {
        return fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return fecha.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };
  
  // Manejadores para paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilterDate(null);
    setFilterStatus('');
    setFilterType('');
    setSearchTerm('');
  };

  // Renderizar vista móvil con tarjetas
  const renderMobileView = () => (
    <Box sx={{ mt: 2 }}>
      {loading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 8
          }}
        >
          <CircularProgress size={60} />
        </Box>
      ) : paginatedConsultas.length > 0 ? (
        <>
          {paginatedConsultas.map((consulta) => (
            <Card
              key={consulta.id}
              elevation={2}
              sx={{
                mb: 2,
                borderRadius: 2,
                overflow: 'visible',
                position: 'relative',
                borderLeft: `4px solid ${theme.palette[getStatusColor(consulta.estado) as any].main}`,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1 
                  }}
                >
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <CalendarIcon color="primary" sx={{ fontSize: 18 }} />
                      {formatFechaRelativa(consulta.fecha)}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {consulta.mascota_nombre}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Chip 
                      label={
                        consulta.estado === 'PROGRAMADA' ? 'Programada' :
                        consulta.estado === 'EN_CURSO' ? 'En curso' :
                        consulta.estado === 'COMPLETADA' ? 'Completada' : 'Cancelada'
                      }
                      color={getStatusColor(consulta.estado) as any}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip 
                      label={consulta.tipo}
                      color={getTypeColor(consulta.tipo) as any}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mb: 1
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 16 }} />
                    <strong>Veterinario:</strong> {consulta.veterinario_nombre}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Motivo:</strong> {consulta.motivo}
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {consulta.estado === 'PROGRAMADA' && (
                    <>
                      <IconButton 
                        color="primary" 
                        size="small"
                        component={Link}
                        to={`/citas/${consulta.id}`}
                        disabled={processingAction === consulta.id}
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      {canManageConsulta && (
                        <IconButton 
                          color="success" 
                          size="small"
                          onClick={() => handleIniciarConsulta(consulta.id!)}
                          disabled={processingAction === consulta.id}
                          sx={{ 
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.success.main, 0.2),
                            }
                          }}
                        >
                          <HospitalIcon fontSize="small" />
                        </IconButton>
                      )}
                      
                      <IconButton 
                        color="error"
                        size="small"
                        onClick={() => handleCancelarConsulta(consulta.id!)}
                        disabled={processingAction === consulta.id}
                        sx={{ 
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.2),
                          }
                        }}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  
                  {consulta.estado === 'EN_CURSO' && canManageConsulta && (
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={() => handleContinuarConsulta(consulta.id!)}
                      startIcon={<HospitalIcon />}
                      sx={{ 
                        borderRadius: 1.5,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`
                      }}
                    >
                      Continuar
                    </Button>
                  )}
                  
                  {consulta.estado === 'COMPLETADA' && (
                    <IconButton 
                      color="info" 
                      size="small"
                      component={Link}
                      to={`/mascotas/${consulta.mascota}/historial`}
                      sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.info.main, 0.2),
                        }
                      }}
                    >
                      <EventIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
          
          <TablePagination
            component="div"
            count={filteredConsultas.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      ) : (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.light, 0.1)
          }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            No se encontraron consultas
            {filtersApplied && " con los filtros aplicados"}
          </Typography>
          
          {filtersApplied && (
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ mt: 1 }}
            >
              Limpiar filtros
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );

  // Renderizar vista de escritorio con tabla
  const renderDesktopView = () => (
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
              <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Mascota</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Veterinario</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Motivo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
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
            ) : paginatedConsultas.length > 0 ? (
              paginatedConsultas.map((consulta) => (
                <TableRow
                  key={consulta.id}
                  hover
                  sx={{ 
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon 
                        color="primary" 
                        fontSize="small"
                        sx={{ opacity: 0.7 }}
                      />
                      <Typography variant="body2">
                        {formatFechaRelativa(consulta.fecha)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>
                      {consulta.mascota_nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>{consulta.veterinario_nombre}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {consulta.motivo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={consulta.tipo} 
                      color={getTypeColor(consulta.tipo) as any} 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={
                        consulta.estado === 'PROGRAMADA' ? 'Programada' :
                        consulta.estado === 'EN_CURSO' ? 'En curso' :
                        consulta.estado === 'COMPLETADA' ? 'Completada' : 'Cancelada'
                      } 
                      color={getStatusColor(consulta.estado) as any} 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {consulta.estado === 'PROGRAMADA' && (
                        <>
                          <Tooltip title="Editar consulta">
                            <span>
                              <IconButton 
                                color="primary" 
                                size="small"
                                component={Link}
                                to={`/citas/${consulta.id}`}
                                disabled={processingAction === consulta.id}
                                sx={{ 
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          {canManageConsulta && (
                            <Tooltip title="Iniciar consulta">
                              <span>
                                <IconButton 
                                  color="success" 
                                  size="small"
                                  onClick={() => handleIniciarConsulta(consulta.id!)}
                                  disabled={processingAction === consulta.id}
                                  sx={{ 
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.success.main, 0.2),
                                    }
                                  }}
                                >
                                  <HospitalIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Cancelar consulta">
                            <span>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleCancelarConsulta(consulta.id!)}
                                disabled={processingAction === consulta.id}
                                sx={{ 
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.error.main, 0.2),
                                  }
                                }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                      
                      {consulta.estado === 'EN_CURSO' && canManageConsulta && (
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          onClick={() => handleContinuarConsulta(consulta.id!)}
                          startIcon={<HospitalIcon />}
                          sx={{ 
                            borderRadius: 1.5,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`
                          }}
                        >
                          Continuar Consulta
                        </Button>
                      )}
                      
                      {consulta.estado === 'COMPLETADA' && (
                        <Tooltip title="Ver historial médico">
                          <IconButton 
                            color="info" 
                            size="small"
                            component={Link}
                            to={`/mascotas/${consulta.mascota}/historial`}
                            sx={{ 
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.info.main, 0.2),
                              }
                            }}
                          >
                            <EventIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {consulta.estado === 'CANCELADA' && (
                        <Typography variant="caption" color="text.secondary">
                          No disponible
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    No se encontraron consultas
                    {filtersApplied && " con los filtros aplicados"}
                  </Typography>
                  
                  {filtersApplied && (
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={handleClearFilters}
                      sx={{ mt: 1 }}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {paginatedConsultas.length > 0 && (
        <TablePagination
          component="div"
          count={filteredConsultas.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Consultas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      )}
    </Paper>
  );

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
            [theme.breakpoints.down('sm')]: {
              fontSize: '1.75rem',
            }
          }}
        >
          <EventIcon 
            sx={{ 
              mr: 1, 
              color: theme.palette.primary.main,
              fontSize: 32
            }} 
          />
          Consultas y Citas
        </Typography>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/citas/nueva"
            sx={{
              borderRadius: 1.5,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              px: { xs: 2, sm: 3 },
              py: 1,
              whiteSpace: 'nowrap',
              '&:hover': {
                boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Nueva Consulta
          </Button>
        </Box>
      </Box>

      {error && (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: alpha(theme.palette.error.main, 0.05),
            color: theme.palette.error.main,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CancelIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Error al cargar consultas
            </Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>{error}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            color="error"
            startIcon={<RefreshIcon />}
            onClick={() => fetchConsultas()}
            sx={{
              borderRadius: 1.5,
              borderWidth: 1.5
            }}
          >
            Reintentar
          </Button>
        </Paper>
      )}

      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3,
          borderRadius: 2,
          boxShadow: `0 4px 20px 0 ${alpha(theme.palette.grey[500], 0.1)}, 
                     0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.1)}`
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Buscar consulta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: theme.palette.background.paper,
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                  }
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Filtrar por fecha"
                value={filterDate}
                onChange={(date) => setFilterDate(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: theme.palette.background.paper,
                        transition: 'all 0.2s ease-in-out',
                        '&.Mui-focused': {
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                        }
                      }
                    }
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
  <FormControl fullWidth>
    <InputLabel 
      id="estado-filter-label"
      shrink={filterStatus !== ''}
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
      value={filterStatus}
      label="Estado"
      onChange={(e) => setFilterStatus(e.target.value)}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Todos</span>;
        }
        const estado = ESTADOS_CONSULTA.find(e => e.value === selected);
        return estado ? (
          <Chip 
            label={estado.label} 
            color={estado.color as any}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        ) : (
          <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Todos</span>
        );
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300,
            minWidth: 200,
            mt: 1,
            '& .MuiMenuItem-root': {
              minHeight: '48px',
            },
          },
        },
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
        <em>Todos</em>
      </MenuItem>
      {ESTADOS_CONSULTA.map((estado) => (
        <MenuItem key={estado.value} value={estado.value}>
          <Chip 
            label={estado.label} 
            color={estado.color as any}
            size="small"
            sx={{ fontWeight: 500, minWidth: 100 }}
          />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>
          
          <Grid item xs={12} sm={6} md={2}>
  <FormControl fullWidth>
    <InputLabel 
      id="tipo-filter-label"
      shrink={filterType !== ''}
      sx={{
        backgroundColor: 'background.paper',
        px: 1,
        transform: 'translate(14px, -9px) scale(0.75)',
      }}
    >
      Tipo
    </InputLabel>
    <Select
      labelId="tipo-filter-label"
      value={filterType}
      label="Tipo"
      onChange={(e) => setFilterType(e.target.value)}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Todos</span>;
        }
        const tipo = TIPOS_CONSULTA.find(t => t.value === selected);
        return tipo ? (
          <Chip 
            label={tipo.label} 
            color={tipo.color as any}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        ) : (
          <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Todos</span>
        );
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300,
            minWidth: 200,
            mt: 1,
            '& .MuiMenuItem-root': {
              minHeight: '48px',
            },
          },
        },
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
        <em>Todos</em>
      </MenuItem>
      {TIPOS_CONSULTA.map((tipo) => (
        <MenuItem key={tipo.value} value={tipo.value}>
          <Chip 
            label={tipo.label} 
            color={tipo.color as any}
            size="small"
            sx={{ fontWeight: 500, minWidth: 100 }}
          />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>
          
          <Grid item xs={12} md={2}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                gap: 1
              }}
            >
              <Tooltip title="Refrescar consultas">
                <IconButton 
                  color="primary" 
                  onClick={() => fetchConsultas()}
                  disabled={refreshing}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    }
                  }}
                >
                  {refreshing ? (
                    <CircularProgress size={24} color="primary" />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
              </Tooltip>
              
              {filtersApplied && (
                <Tooltip title="Limpiar filtros">
                  <IconButton 
                    color="secondary" 
                    onClick={handleClearFilters}
                    sx={{ 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      }
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>
        
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
              />
            )}
            
            {filterDate && (
              <Chip 
                label={`Fecha: ${format(filterDate, 'dd/MM/yyyy')}`} 
                onDelete={() => setFilterDate(null)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            
            {filterStatus && (
              <Chip 
                label={`Estado: ${ESTADOS_CONSULTA.find(e => e.value === filterStatus)?.label}`} 
                onDelete={() => setFilterStatus('')}
                size="small"
                color={getStatusColor(filterStatus) as any}
              />
            )}
            
            {filterType && (
              <Chip 
                label={`Tipo: ${TIPOS_CONSULTA.find(t => t.value === filterType)?.label}`} 
                onDelete={() => setFilterType('')}
                size="small"
                color={getTypeColor(filterType) as any}
              />
            )}
            
            <Button 
              variant="text" 
              size="small" 
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ ml: 'auto' }}
            >
              Limpiar todos
            </Button>
          </Box>
        )}
      </Paper>

      {/* Renderizar vista según el tamaño de pantalla */}
      {isMobile ? renderMobileView() : renderDesktopView()}
    </Container>
  );
};

export default CitasList;