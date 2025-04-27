import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { getMascotas, getEspecies, Mascota, Especie } from '../../api/mascotaApi';
import { getClientes, Cliente } from '../../api/clienteApi';
import { formatFullName, booleanToText } from '../../utils/formatters';

const MascotasList = () => {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [filteredMascotas, setFilteredMascotas] = useState<Mascota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ cliente: '', especie: '' });

  const clienteNombreMap = useMemo(() => {
    const map: Record<number, string> = {};
    clientes.forEach((c) => {
      map[c.id] = formatFullName(c.nombre, c.apellido);
    });
    return map;
  }, [clientes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mascotasData, clientesData, especiesData] = await Promise.all([
          getMascotas(),
          getClientes(),
          getEspecies(),
        ]);

        setMascotas(mascotasData.results || []);
        setFilteredMascotas(mascotasData.results || []);
        setClientes(clientesData.results || []);
        setEspecies(especiesData.results || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = mascotas;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((mascota) => {
        const clienteNombreCompleto = clienteNombreMap[mascota.cliente]?.toLowerCase() || '';
        return (
          mascota.nombre.toLowerCase().includes(term) || clienteNombreCompleto.includes(term)
        );
      });
    }

    if (filters.cliente) {
      result = result.filter((m) => m.cliente.toString() === filters.cliente);
    }

    if (filters.especie) {
      result = result.filter((m) => m.especie.toString() === filters.especie);
    }

    setFilteredMascotas(result);
  }, [searchTerm, filters, mascotas, clienteNombreMap]);

  const handleFilterChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name as string]: value as string }));
  };

  const resetFilters = () => {
    setFilters({ cliente: '', especie: '' });
    setSearchTerm('');
  };

  if (loading)
    return (
      <Container maxWidth="lg">
        <Typography sx={{ mt: 4 }}>Cargando mascotas...</Typography>
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
                  <MenuItem key={c.id} value={c.id.toString()}>
                    {formatFullName(c.nombre, c.apellido)}
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
                {especies.map((e) => (
                  <MenuItem key={e.id} value={e.id.toString()}>
                    {e.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button variant="outlined" onClick={resetFilters} fullWidth>
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
              <TableCell align="center">Esterilizado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMascotas.length > 0 ? (
              filteredMascotas.map((m) => {
                const clienteNombreCompleto = clienteNombreMap[m.cliente] || `Cliente #${m.cliente}`;

                return (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.nombre}</TableCell>
                    <TableCell>{clienteNombreCompleto}</TableCell>
                    <TableCell>{m.especie_nombre || `Especie #${m.especie}`}</TableCell>
                    <TableCell>{m.raza_nombre || `Raza #${m.raza}`}</TableCell>
                    <TableCell>{m.sexo === 'M' ? 'Macho' : 'Hembra'}</TableCell>
                    <TableCell>
                      <Chip
                        label={booleanToText(m.esterilizado)}
                        color={m.esterilizado ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar mascota">
                        <IconButton component={Link} to={`/mascotas/${m.id}`} color="primary" size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
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
