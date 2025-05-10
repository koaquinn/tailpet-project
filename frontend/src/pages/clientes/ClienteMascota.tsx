// src/pages/clientes/ClienteMascotas.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  ArrowBack,
  Pets,
  Add,
  Edit,
  MedicalServices,
  Vaccines
} from '@mui/icons-material';
import { getCliente, getMascotasByCliente } from '../../api/clienteApi';
import { getEspecie, getRaza } from '../../api/mascotaApi';
import { Mascota } from '../../types/mascota';

interface MascotaEnriquecida extends Mascota {
  especieNombre?: string;
  razaNombre?: string;
}

const ClienteMascotas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<any>(null);
  const [mascotas, setMascotas] = useState<MascotaEnriquecida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clienteData, mascotasData] = await Promise.all([
          getCliente(Number(id)),
          getMascotasByCliente(Number(id))
        ]);

        // Enriquecer mascotas con nombres de especie y raza
        const mascotasEnriquecidas = await Promise.all(
          mascotasData.results.map(async (mascota) => {
            try {
              const [especie, raza] = await Promise.all([
                getEspecie(mascota.especie),
                getRaza(mascota.raza)
              ]);
              return {
                ...mascota,
                especieNombre: especie.nombre,
                razaNombre: raza.nombre
              };
            } catch (error) {
              console.error('Error obteniendo detalles:', error);
              return {
                ...mascota,
                especieNombre: 'Desconocido',
                razaNombre: 'Desconocida'
              };
            }
          })
        );

        setCliente(clienteData);
        setMascotas(mascotasEnriquecidas);
      } catch (err) {
        setError('Error al cargar los datos del cliente y sus mascotas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const calcularEdad = (fechaNacimiento?: string, edad?: number) => {
    if (fechaNacimiento) {
      const diff = new Date().getFullYear() - new Date(fechaNacimiento).getFullYear();
      return `${diff} año${diff !== 1 ? 's' : ''}`;
    }
    return edad ? `${edad} año${edad !== 1 ? 's' : ''}` : 'N/A';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
          <Button onClick={() => window.location.reload()} color="inherit" size="small">
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!cliente) {
    return <Alert severity="warning">Cliente no encontrado</Alert>;
  }

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs y título */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link to="/clientes" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Clientes</Typography>
          </Link>
          <Typography color="text.primary">
            {cliente.nombre} {cliente.apellido}
          </Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            <Pets sx={{ verticalAlign: 'middle', mr: 1 }} />
            Mascotas de {cliente.nombre} {cliente.apellido}
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/clientes')}
              sx={{ mr: 2 }}
            >
              Volver
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => navigate(`/mascotas/nuevo?clienteId=${id}`)}
            >
              Nueva Mascota
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Información del cliente */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información del Cliente
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={4}>
          <Box>
            <Typography variant="subtitle1">
              <strong>Nombre:</strong> {cliente.nombre} {cliente.apellido}
            </Typography>
            <Typography variant="subtitle1">
              <strong>RUT:</strong> {cliente.rut}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">
              <strong>Teléfono:</strong> {cliente.telefono || 'No registrado'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Email:</strong> {cliente.email || 'No registrado'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">
              <strong>Estado:</strong> 
              <Chip
                label={cliente.activo ? 'Activo' : 'Inactivo'}
                color={cliente.activo ? 'success' : 'error'}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Lista de mascotas */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Especie</TableCell>
                <TableCell>Raza</TableCell>
                <TableCell>Edad</TableCell>
                <TableCell>Sexo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mascotas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No se encontraron mascotas registradas para este cliente
                    </Typography>
                    <Button
                      variant="text"
                      color="primary"
                      startIcon={<Add />}
                      onClick={() => navigate(`/mascotas/nuevo?clienteId=${id}`)}
                      sx={{ mt: 1 }}
                    >
                      Agregar primera mascota
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                mascotas
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((mascota) => (
                    <TableRow key={mascota.id} hover>
                      <TableCell>{mascota.nombre}</TableCell>
                      <TableCell>{mascota.especieNombre}</TableCell>
                      <TableCell>{mascota.razaNombre}</TableCell>
                      <TableCell>
                        {calcularEdad(mascota.fecha_nacimiento, mascota.edad)}
                      </TableCell>
                      <TableCell>
                        {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={mascota.activo ? 'Activo' : 'Inactivo'}
                          color={mascota.activo ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/mascotas/editar/${mascota.id}`)}
                            aria-label="Editar mascota"
                            title="Editar mascota"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => navigate(`/mascotas/${mascota.id}/historial`)}
                            aria-label="Historial médico"
                            title="Historial médico"
                          >
                            <MedicalServices />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => navigate(`/mascotas/${mascota.id}/vacunas`)}
                            aria-label="Vacunas"
                            title="Vacunas"
                          >
                            <Vaccines />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {mascotas.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={mascotas.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Mascotas por página:"
          />
        )}
      </Paper>
    </Container>
  );
};

export default ClienteMascotas;