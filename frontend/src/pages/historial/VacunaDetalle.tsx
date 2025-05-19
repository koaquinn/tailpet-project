import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, Button, Divider,
  Chip, CircularProgress, Alert, Card, CardContent, Avatar, useTheme, alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Vaccines as VaccineIcon,
  Edit as EditIcon,
  Event as EventIcon,
  Pets as PetsIcon,
  MedicalServices as MedicalServicesIcon,
  Science as ScienceIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import historialApi, { MascotaVacuna } from '../../api/historialApi';
import { useAuth } from '../../context/AuthContext';

const VacunaDetalle: React.FC = () => {
  const { mascotaId, vacunaId } = useParams<{ mascotaId: string, vacunaId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const theme = useTheme();
  const canEdit = hasRole('ADMIN') || hasRole('VETERINARIO');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vacunacion, setVacunacion] = useState<MascotaVacuna | null>(null);
  
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
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" color="textSecondary">
            Cargando información de la vacunación...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            boxShadow: theme.shadows[2],
            '& .MuiAlert-icon': { fontSize: 32 }
          }}
        >
          <Typography variant="body1" fontWeight={500}>
            {error}
          </Typography>
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => window.location.reload()}
            sx={{ 
              mt: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!vacunacion) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 2,
            boxShadow: theme.shadows[2],
            '& .MuiAlert-icon': { fontSize: 32 }
          }}
        >
          <Typography variant="body1" fontWeight={500}>
            No se encontró la vacunación especificada
          </Typography>
          <Button 
            component={Link} 
            to={`/mascotas/${mascotaId}/historial`} 
            color="inherit" 
            size="small" 
            sx={{ 
              mt: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Volver al historial
          </Button>
        </Alert>
      </Container>
    );
  }
  
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/mascotas/${mascotaId}/historial`)}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          mb: 4,
          px: 3,
          py: 1,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04)
          }
        }}
      >
        Volver al historial
      </Button>
      
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          overflow: 'hidden',
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[2]
        }}
      >
        {/* Header con título y botón de edición */}
        <Box 
          sx={{ 
            p: 3,
            display: 'flex',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`
          }}
        >
          <Avatar
            sx={{ 
              bgcolor: theme.palette.primary.main,
              mr: 2,
              width: 48,
              height: 48
            }}
          >
            <VaccineIcon fontSize="medium" />
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Detalle de Vacunación
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Información completa sobre la vacuna aplicada
            </Typography>
          </Box>
          
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/mascotas/${mascotaId}/vacunas/editar/${vacunaId}`)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1
              }}
            >
              Editar
            </Button>
          )}
        </Box>
        
        {/* Contenido principal */}
        <Box sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Información de la vacuna */}
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  height: '100%',
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={3}>
                    <ScienceIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight={600} color="primary">
                      Información de la Vacuna
                    </Typography>
                  </Box>
                  
                  <Box sx={{ '& > div': { mb: 2 } }}>
                    <Box display="flex">
                      <Typography variant="body1" fontWeight={500} sx={{ minWidth: 160 }}>
                        Nombre:
                      </Typography>
                      <Typography variant="body1">
                        {vacunacion.vacuna_nombre || 'No especificado'}
                      </Typography>
                    </Box>
                    
                    <Box display="flex">
                      <Typography variant="body1" fontWeight={500} sx={{ minWidth: 160 }}>
                        Fecha aplicación:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(vacunacion.fecha_aplicacion)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex">
                      <Typography variant="body1" fontWeight={500} sx={{ minWidth: 160 }}>
                        Próxima aplicación:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(vacunacion.fecha_proxima)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1" fontWeight={500} sx={{ minWidth: 160 }}>
                        Estado:
                      </Typography>
                      <Chip
                        label={estadoVacuna.label}
                        color={estadoVacuna.color}
                        size="medium"
                        sx={{ 
                          fontWeight: 500,
                          px: 1,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Información adicional */}
            <Grid item xs={12} md={6}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  height: '100%',
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={3}>
                    <MedicalServicesIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight={600} color="primary">
                      Información Adicional
                    </Typography>
                  </Box>
                  
                  <Box sx={{ '& > div': { mb: 2 } }}>
                    <Box display="flex">
                      <Typography variant="body1" fontWeight={500} sx={{ minWidth: 160 }}>
                        Veterinario:
                      </Typography>
                      <Typography variant="body1">
                        {vacunacion.veterinario_nombre || 'No especificado'}
                      </Typography>
                    </Box>
                    
                    <Box display="flex">
                      <Typography variant="body1" fontWeight={500} sx={{ minWidth: 160 }}>
                        Lote:
                      </Typography>
                      <Typography variant="body1">
                        {vacunacion.lote_codigo || `(${vacunacion.lote})`}
                      </Typography>
                    </Box>
                    
                    <Box display="flex">
                      <Typography variant="body1" fontWeight={500} sx={{ minWidth: 160 }}>
                        Mascota:
                      </Typography>
                      <Typography variant="body1">
                        {vacunacion.mascota_nombre || `ID: ${vacunacion.mascota}`}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Observaciones - AHORA OCUPA TODO EL ANCHO */}
            {vacunacion.observaciones && (
              <Grid item xs={12}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    width: '100%' // Aseguramos que ocupe todo el ancho disponible
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <NotesIcon color="primary" sx={{ mr: 1.5, fontSize: 28 }} />
                      <Typography variant="h6" fontWeight={600} color="primary">
                        Observaciones
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        p: 3,
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        minHeight: 100
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: 'pre-line',
                          lineHeight: 1.8,
                          fontSize: '1.1rem'
                        }}
                      >
                        {vacunacion.observaciones}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
          
          {/* Botones de acción */}
          <Box 
            sx={{ 
              mt: 4,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            {canEdit && vacunacion.fecha_proxima && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EventIcon />}
                onClick={() => navigate(`/mascotas/${mascotaId}/vacunas/nuevo?revacunacion=${vacunacion.vacuna}`)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  minWidth: 220,
                  boxShadow: theme.shadows[3],
                  '&:hover': {
                    boxShadow: theme.shadows[6],
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Registrar Revacunación
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/mascotas/${mascotaId}/historial`)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 4,
                py: 1.5,
                minWidth: 220,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04)
                }
              }}
            >
              Volver al Historial
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default VacunaDetalle;