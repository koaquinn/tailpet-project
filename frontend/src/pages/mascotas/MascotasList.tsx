// src/pages/mascotas/MascotasList.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Box,
  TextField, InputAdornment, Chip, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { getMascotas, getEspecies, Mascota, Especie } from '../../api/mascotaApi';
import { getClientes, Cliente } from '../../api/clienteApi';

const MascotasList = () => {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [filteredMascotas, setFilteredMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    cliente: '',
    especie: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mascotasData, clientesData, especiesData] = await Promise.all([
          getMascotas(),
          getClientes(),
          getEspecies()
        ]);
        
        setMascotas(mascotasData.results || []);
        setFilteredMascotas(mascotasData.results || []);
        setClientes(clientesData.results || []);
        setEspecies(especiesData.results || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    let result = mascotas;
    
    // Aplicar filtro por término de búsqueda
    if (searchTerm) {
      result = result.filter(mascota => 
        mascota.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar filtro por cliente
    if (filters.cliente) {
      result = result.filter(mascota => 
        mascota.cliente.toString() === filters.cliente
      );
    }
    
    // Aplicar filtro por especie
    if (filters.especie) {
      result = result.filter(mascota => 
        mascota.especie.toString() === filters.especie
      );
    }
    
    setFilteredMascotas(result);
  }, [searchTerm, filters, mascotas]);
  
  const handleFilterChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      cliente: '',
      especie: ''
    });
    setSearchTerm('');
  };
  
  if (loading) return (
    <Container maxWidth="lg">
      <Typography>Cargando mascotas...</Typography>
    </Container>
  );
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mascotas
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/mascotas/nuevo"
          startIcon={<AddIcon />}
        >
          Nueva Mascota
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar por nombre"
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
                {clientes.map(cliente => (
                  <MenuItem key={cliente.id} value={cliente.id?.toString()}>
                    {cliente.nombre} {cliente.apellido}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Especie</InputLabel>
              <Select
                name="especie"
                value={filters.especie}
                label="Especie"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {especies.map(especie => (
                  <MenuItem key={especie.id} value={especie.id.toString()}>
                    {especie.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              onClick={resetFilters}
              fullWidth
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
              <TableCell>Raza</TableCell>
              <TableCell>Sexo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Esterilizado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMascotas.length > 0 ? (
              filteredMascotas.map((mascota) => (
                <TableRow key={mascota.id}>
                  <TableCell>{mascota.nombre}</TableCell>
                  <TableCell>{mascota.cliente_nombre || `Cliente #${mascota.cliente}`}</TableCell>
                  <TableCell>{mascota.especie_nombre || `Especie #${mascota.especie}`}</TableCell>
                  <TableCell>{mascota.raza_nombre || `Raza #${mascota.raza}`}</TableCell>
                  <TableCell>
                    {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={mascota.activo ? "Activo" : "Inactivo"} 
                      color={mascota.activo ? "success" : "error"} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                    label={mascota.esterilizado ? "Esterilizado" : "No esterilizado"}
                    color={mascota.esterilizado ? "success" : "error"}
                    size='small'
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar mascota">
                      <IconButton 
                        component={Link} 
                        to={`/mascotas/${mascota.id}`}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron mascotas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default MascotasList;