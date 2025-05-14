// src/pages/citas/CitasList.tsx (nuevo)
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Event as EventIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import citasApi, { Consulta } from '../../api/citasApi';
import { useAuth } from '../../context/AuthContext';

const CitasList: React.FC = () => {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { user } = useAuth();

  const handleCancelarConsulta = async (id: number) => {
  try {
    await citasApi.updateConsulta(id, { estado: 'CANCELADA' });
    fetchConsultas(); // Refresca la lista luego de cancelar
  } catch (err) {
    console.error('Error al cancelar consulta:', err);
    alert('Hubo un problema al cancelar la consulta');
  }
};


  const fetchConsultas = async () => {
    setLoading(true);
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
    } catch (err) {
      console.error('Error al cargar consultas:', err);
      setError('Error al cargar la lista de consultas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultas();
  }, [filterDate, filterStatus, filterType, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROGRAMADA':
        return 'primary';
      case 'COMPLETADA':
        return 'success';
      case 'CANCELADA':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RUTINA':
        return 'info';
      case 'EMERGENCIA':
        return 'error';
      case 'SEGUIMIENTO':
        return 'warning';
      default:
        return 'default';
    }
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Consultas y Citas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/citas/nueva"
        >
          Nueva Consulta
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1, bgcolor: 'white' }} 
            onClick={fetchConsultas}
          >
            Reintentar
          </Button>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Buscar por mascota, veterinario o motivo"
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
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Filtrar por fecha"
                value={filterDate}
                onChange={(date) => setFilterDate(date)}
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
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterStatus}
                label="Estado"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PROGRAMADA">Programada</MenuItem>
                <MenuItem value="COMPLETADA">Completada</MenuItem>
                <MenuItem value="CANCELADA">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterType}
                label="Tipo"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="RUTINA">Rutina</MenuItem>
                <MenuItem value="EMERGENCIA">Emergencia</MenuItem>
                <MenuItem value="SEGUIMIENTO">Seguimiento</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Mascota</TableCell>
                <TableCell>Veterinario</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredConsultas.length > 0 ? (
                filteredConsultas.map((consulta) => (
                  <TableRow key={consulta.id} hover>
                    <TableCell>
                      {new Date(consulta.fecha).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{consulta.mascota_nombre}</TableCell>
                    <TableCell>{consulta.veterinario_nombre}</TableCell>
                    <TableCell>{consulta.motivo}</TableCell>
                    <TableCell>
                      <Chip 
                        label={consulta.tipo} 
                        color={getTypeColor(consulta.tipo)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={consulta.estado} 
                        color={getStatusColor(consulta.estado)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                      <IconButton 
                        color="primary" 
                        size="small"
                        component={Link}
                        to={`/citas/${consulta.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                      </Tooltip>
                      {consulta.estado !== 'CANCELADA' && (
                        <Tooltip title="Cancelar">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleCancelarConsulta(consulta.id!)}
                        >
                          <CancelIcon />
                        </IconButton>
                        </Tooltip>
                      )}

                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron consultas
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

export default CitasList;