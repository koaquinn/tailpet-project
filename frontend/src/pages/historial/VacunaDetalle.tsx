// src/pages/historial/VacunaDetalle.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, Button, Divider,
  Chip, CircularProgress, Alert, Card, CardContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Vaccines as VaccineIcon,
  Edit as EditIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import historialApi, { MascotaVacuna } from '../../api/historialApi';
import { useAuth } from '../../context/AuthContext';

const VacunaDetalle: React.FC = () => {
  const { mascotaId, vacunaId } = useParams<{ mascotaId: string, vacunaId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN') || hasRole('VETERINARIO');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vacunacion, setVacunacion] = useState<MascotaVacuna | null>(null);
  
  // Función segura para formatear fechas
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No registrada';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Fecha inválida';
      return format(date, 'PPP', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (!vacunaId) return;
      
      try {
        setLoading(true);
        const data = await historialApi.getVacunacion(parseInt(vacunaId));
        setVacunacion(data);
      } catch (error) {
        console.error('Error al cargar datos de la vacunación:', error);
        setError('Error al cargar los datos de la vacunación');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [vacunaId]);
  
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md">
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
  
  if (!vacunacion) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 2 }}>
          No se encontró la vacunación especificada
          <Button 
            component={Link} 
            to={`/mascotas/${mascotaId}/historial`} 
            color="inherit" 
            size="small" 
            sx={{ ml: 2 }}
          >
            Volver al historial
          </Button>
        </Alert>
      </Container>
    );
  }
  
  // Calcular el estado de la vacuna
  const calcularEstadoVacuna = () => {
    if (!vacunacion.fecha_proxima) {
      return { 
        label: 'Sin revacunación', 
        color: 'default' as 'default'
      };
    }
    
    const hoy = new Date();
    const fechaProxima = parseISO(vacunacion.fecha_proxima);
    
    if (!isValid(fechaProxima)) {
      return { 
        label: 'Fecha inválida', 
        color: 'error' as 'error'
      };
    }
    
    const diasRestantes = differenceInDays(fechaProxima, hoy);
    
    if (diasRestantes < 0) {
      return { 
        label: 'Revacunación pendiente', 
        color: 'error' as 'error'
      };
    }
    
    if (diasRestantes <= 30) {
      return { 
        label: `Próxima dosis en ${diasRestantes} días`, 
        color: 'warning' as 'warning'
      };
    }
    
    return { 
      label: 'Al día', 
      color: 'success' as 'success'
    };
  };
  
  const estadoVacuna = calcularEstadoVacuna();
  
  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/mascotas/${mascotaId}/historial`)}
        >
          Volver al historial
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <VaccineIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h1">
            Detalle de Vacunación
          </Typography>
          
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ ml: 'auto' }}
              onClick={() => navigate(`/mascotas/${mascotaId}/vacunas/editar/${vacunaId}`)}
            >
              Editar
            </Button>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box mb={4}>
              <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="bold">
                Información de la Vacuna
              </Typography>
              <Typography variant="body1">
                <strong>Nombre de la vacuna:</strong> {vacunacion.vacuna_nombre || 'No especificado'}
              </Typography>
              <Typography variant="body1">
                <strong>Fecha de aplicación:</strong> {formatDate(vacunacion.fecha_aplicacion)}
              </Typography>
              <Typography variant="body1">
                <strong>Próxima aplicación:</strong> {formatDate(vacunacion.fecha_proxima)}
              </Typography>
              <Typography variant="body1">
                <strong>Estado:</strong>{' '}
                <Chip
                  label={estadoVacuna.label}
                  color={estadoVacuna.color}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box mb={4}>
              <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="bold">
                Información Adicional
              </Typography>
              <Typography variant="body1">
                <strong>Veterinario:</strong> {vacunacion.veterinario_nombre || 'No especificado'}
              </Typography>
              <Typography variant="body1">
                <strong>Lote:</strong> {vacunacion.lote_codigo || '(' + vacunacion.lote + ')'}
              </Typography>
              <Typography variant="body1">
                <strong>Mascota:</strong> {vacunacion.mascota_nombre || `ID: ${vacunacion.mascota}`}
              </Typography>
            </Box>
          </Grid>
          
          {vacunacion.observaciones && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom fontWeight="bold">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">
                    {vacunacion.observaciones}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          {canEdit && vacunacion.fecha_proxima && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EventIcon />}
              onClick={() => navigate(`/mascotas/${mascotaId}/vacunas/nuevo?revacunacion=${vacunacion.vacuna}`)}
              sx={{ mr: 2 }}
            >
              Registrar Revacunación
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/mascotas/${mascotaId}/historial`)}
          >
            Volver al Historial
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default VacunaDetalle;