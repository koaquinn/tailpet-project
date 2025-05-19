// src/pages/historial/HistorialMascota.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Tabs, Tab, Button, Divider, Grid,
  Chip, Avatar, CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, useTheme
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Vaccines as VaccineIcon, 
    Close as CloseIcon
} from '@mui/icons-material';
import {
  PetsOutlined as PetsIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  EventNote as EventNoteIcon,
  MonitorWeight as WeightIcon, // Icono para la tab
  Medication as MedicationIcon 
} from '@mui/icons-material';
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Importar Material-UI Charts
import { LineChart } from '@mui/x-charts/LineChart';
// No es estrictamente necesario importar los componentes de ejes/tooltip/leyenda si se usan las props del LineChart,
// pero se pueden importar para personalización avanzada vía slots.

// APIs
import mascotaApi, { RegistroPesoData, getMascota } from '../../api/mascotaApi';
import historialApi from '../../api/historialApi';
import consultaApi, { RecetaCompletaResponse } from '../../api/consultaApi';
import { useAuth } from '../../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`historial-tabpanel-${index}`} aria-labelledby={`historial-tab-${index}`} {...other}>
      {value === index && (<Box sx={{ p: {xs: 1.5, sm: 2, md: 3} }}>{children}</Box>)}
    </div>
  );
}

function a11yProps(index: number) {
  return { id: `historial-tab-${index}`, 'aria-controls': `historial-tabpanel-${index}`};
}

interface PesoChartDataPointMUI {
    idOriginal: number;
    xValueForChart: number; 
    fechaOriginal: Date;   
    peso: number;
    notas?: string | null;
    // Para tooltip si agrupamos por día y queremos mostrar detalles
    registrosDelDia?: { peso: number, notas?: string | null, fechaOriginalHora: Date }[]; 
}


const HistorialMascota: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth(); 
  const theme = useTheme();
  const canEdit = hasRole('ADMIN') || hasRole('VETERINARIO');

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  const [mascota, setMascota] = useState<any>(null); 
  const [historial, setHistorial] = useState<any>(null); 
  const [consultas, setConsultas] = useState<any[]>([]);
  const [vacunaciones, setVacunaciones] = useState<any[]>([]);
  const [registrosPeso, setRegistrosPeso] = useState<RegistroPesoData[]>([]);

  const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<RecetaCompletaResponse | null>(null);
  const [loadingReceta, setLoadingReceta] = useState(false);
  const [selectedConsultaInfo, setSelectedConsultaInfo] = useState<{ 
    fecha: string, motivo?: string, diagnostico?: string, veterinario_nombre?: string 
  } | null>(null);

  const formatDate = (dateInput: string | null | undefined | Date, dateFormat: string = 'PPP') => {
    if (!dateInput) return 'No registrada';
    try {
      const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
      return isValid(date) ? format(date, dateFormat, { locale: es }) : 'Fecha inválida';
    } catch (error) { 
      console.error("Error formateando fecha:", dateInput, error);
      return 'Fecha inválida'; 
    }
  };

  const formatNumber = (value: number | string | null | undefined, unit: string, decimals: number = 1) => {
    if (value === null || value === undefined || value === '') return 'N/R';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 'Inv.' : `${num.toFixed(decimals)} ${unit}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) { setError("ID de mascota no proporcionado."); setLoading(false); return; }
      try {
        setLoading(true); setError(null);
        const mascotaId = parseInt(id);
        if (isNaN(mascotaId)) { setError("ID de mascota inválido."); setLoading(false); return; }

        const [
            mascotaData, 
            historialResponseData,
            vacunacionesData,
            apiRegistrosPesoData
        ] = await Promise.all([
            getMascota(mascotaId),
            historialApi.getHistorialByMascota(mascotaId).catch(e => { console.warn("Error cargando historial principal:", e); return null;}),
            historialApi.getVacunacionesByMascota(mascotaId).catch(e => { console.warn("Error cargando vacunaciones:", e); return {results:[]};}),
            mascotaApi.getRegistrosPesoPorMascota(mascotaId).catch(e => { console.warn("Error cargando registros de peso:", e); return [];})
        ]);
        
        setMascota(mascotaData);
        setVacunaciones(vacunacionesData?.results || vacunacionesData || []); 
        setRegistrosPeso(apiRegistrosPesoData?.results || apiRegistrosPesoData || []);

        if (historialResponseData && Array.isArray(historialResponseData.results) && historialResponseData.results.length > 0) {
            const historialData = historialResponseData.results[0];
            setHistorial(historialData);
            if (historialData.id) {
              const consultasResponse = await historialApi.getConsultasHistorial(historialData.id).catch(e => { console.warn("Error cargando consultas del historial", e); return {results:[]};});
              setConsultas(consultasResponse?.results || []);
            }
        } else {
            setHistorial(null);
        }
      } catch (err: any) {
        console.error('Error general al cargar datos:', err);
        const apiError = err?.response?.data?.detail || err?.response?.data?.error || err?.message;
        setError(apiError || 'Error al cargar los datos.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

  const createHistorialMedico = async () => {
    if (!mascota || !mascota.id || !user?.id) {
        setError('Datos insuficientes para crear historial (mascota o veterinario no definido).');
        return;
    }
    setLoading(true);
    try {
      const newHistorial = await historialApi.createHistorial({
        mascota: mascota.id,
        veterinario: user.id, 
        fecha: new Date().toISOString().split('T')[0], 
        observaciones: 'Historial médico inicial creado automáticamente.'
      });
      setHistorial(newHistorial); 
      if (newHistorial.id) {
         const consultasResponse = await historialApi.getConsultasHistorial(newHistorial.id);
         setConsultas(consultasResponse?.results || []);
      }
    } catch (err: any) {
      console.error('Error al crear historial médico:', err);
      setError(err?.response?.data?.error || 'Error al crear el historial médico.');
    } finally { setLoading(false); }
  };
  
  const handleOpenRecetaModal = async (consultaDeHistorial: any) => {
    const idConsultaOriginal = consultaDeHistorial.cita_relacionada;
    if (!idConsultaOriginal) {
      alert("No se puede obtener la receta: Falta el ID de la consulta original para esta entrada del historial.");
      return;
    }
    setSelectedConsultaInfo({
        fecha: formatDate(consultaDeHistorial.fecha),
        motivo: consultaDeHistorial.motivo_consulta,
        diagnostico: consultaDeHistorial.diagnostico,
        veterinario_nombre: consultaDeHistorial.veterinario_nombre
    });
    setIsRecetaModalOpen(true); setLoadingReceta(true); setSelectedReceta(null); 
    try {
      const recetaData = await consultaApi.getRecetaPorConsultaId(idConsultaOriginal);
      setSelectedReceta(recetaData);
    } catch (error: any) {
      console.error("Error al obtener la receta:", error);
      const errorMessage = error?.response?.data?.observaciones_receta || error?.response?.data?.error || error?.message || 'Error al cargar la receta desde el servidor.';
      setSelectedReceta({ id_receta: null, fecha_emision: null, medicamentos: [], observaciones_receta: errorMessage });
    } finally { setLoadingReceta(false); }
  };

  const handleCloseRecetaModal = () => {
    setIsRecetaModalOpen(false); setSelectedReceta(null); setSelectedConsultaInfo(null);
  };

  // Preparación de datos para el gráfico de peso (MUI X Charts)
  // Usamos useMemo para evitar recálculos innecesarios
  const pesoChartDataMUI: PesoChartDataPointMUI[] = useMemo(() => {
    return registrosPeso
      .map((rp, index) => {
        const fechaObj = parseISO(rp.fecha_registro); // fecha_registro es string "YYYY-MM-DDTHH:mm:ssZ" o "YYYY-MM-DD"
        return {
          idOriginal: rp.id,
          xValueForChart: index, // Un valor numérico secuencial para el eje X
          fechaOriginal: isValid(fechaObj) ? fechaObj : new Date(0), // El objeto Date real
          peso: parseFloat(rp.peso),
          notas: rp.notas,
        };
      })
      .filter(d => isValid(d.fechaOriginal) && d.fechaOriginal.getFullYear() > 1900 && !isNaN(d.peso)) // Filtrado más robusto
      .sort((a, b) => a.fechaOriginal.getTime() - b.fechaOriginal.getTime()); // Ordenar por fecha real
  }, [registrosPeso]);


  const getPesoDomainMUI = (): [number, number] | undefined => {
      if (pesoChartDataMUI.length === 0) return undefined;
      const pesos = pesoChartDataMUI.map(d => d.peso);
      const minPeso = Math.min(...pesos);
      const maxPeso = Math.max(...pesos);
      const padding = Math.max((maxPeso - minPeso) * 0.20, 2); 
      const domainMin = Math.max(0, Math.floor(minPeso - padding));
      let domainMax = Math.ceil(maxPeso + padding);
      if (domainMax <= domainMin) {
          domainMax = domainMin + Math.max(5, Math.abs(domainMin * 0.3) || 5); 
      }
      return [domainMin, domainMax];
  };
  const muiPesoYAxisDomain = getPesoDomainMUI();

  if (loading && !mascota) { return (<Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}><CircularProgress size={60} /></Container>); }
  if (error && !mascota) { return (<Container maxWidth="md" sx={{mt:4}}><Alert severity="error" sx={{ mt: 2 }}>{error}<Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>Reintentar</Button></Alert></Container>); }
  if (!mascota) { return (<Container maxWidth="md" sx={{mt:4}}><Alert severity="warning" sx={{ mt: 2 }}>No se encontró la mascota solicitada.<Button component={Link} to="/mascotas" color="inherit" size="small" sx={{ ml: 2 }}>Volver al listado</Button></Alert></Container>); }

  return (
    <Container maxWidth="lg" sx={{my: 3}}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="outlined">
          Volver
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Box display="flex" alignItems={{xs: 'flex-start', sm:'center'}} mb={2.5} flexDirection={{xs: 'column', sm: 'row'}}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: {sm: 2.5}, mb: {xs:2, sm:0}, width: 72, height: 72 }}><PetsIcon sx={{fontSize: 40}} /></Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="600" color="primary.dark">Historial Médico</Typography>
            <Typography variant="h5" component="div" color="text.secondary" fontWeight="normal">Paciente: {mascota.nombre}</Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2.5 }} />
        <Grid container spacing={{xs: 1.5, sm: 2.5}}>
          <Grid item xs={12} sm={6} md={3}> <Typography variant="body1"><strong>Dueño:</strong> {mascota.cliente_nombre || 'N/A'}</Typography> </Grid>
          <Grid item xs={12} sm={6} md={3}> <Typography variant="body1"><strong>Especie:</strong> {mascota.especie_nombre || 'N/A'}</Typography> </Grid>
          <Grid item xs={12} sm={6} md={3}> <Typography variant="body1"><strong>Raza:</strong> {mascota.raza_nombre || 'N/A'}</Typography> </Grid>
          <Grid item xs={12} sm={6} md={3}> <Typography variant="body1"><strong>Sexo:</strong> {mascota.sexo === 'M' ? 'Macho' : mascota.sexo === 'H' ? 'Hembra' : 'N/A'}</Typography> </Grid>
          <Grid item xs={12} sm={6} md={3}> <Typography variant="body1"><strong>Nacimiento:</strong> {formatDate(mascota.fecha_nacimiento)}</Typography> </Grid>
          <Grid item xs={12} sm={6} md={3}> <Typography variant="body1"><strong>Microchip:</strong> {mascota.microchip || 'N/A'}</Typography> </Grid>
          <Grid item xs={12} sm={6} md={3}> <Typography variant="body1"><strong>Esterilizado:</strong> {mascota.esterilizado ? 'Sí' : 'No'}</Typography> </Grid>
          <Grid item xs={12} sm={6} md={3}><Typography variant="body1" display="flex" alignItems="center" component="div"> <Box component="strong" mr={0.5}>Estado:</Box> <Chip label={mascota.activo ? 'Activo' : 'Inactivo'} color={mascota.activo ? 'success' : 'error'} size="small" sx={{ fontWeight: 'medium' }} /></Typography></Grid>
        </Grid>
      </Paper>

      {!historial && !loading && ( 
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, boxShadow: 1, mt:2 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">Esta mascota aún no tiene un historial médico.</Typography>
          <Typography variant="body2" sx={{mb:2}}>Crea uno para comenzar a registrar consultas y otros eventos médicos.</Typography>
          {canEdit && (<Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={createHistorialMedico} disabled={loading}>{loading ? 'Creando...' : 'Crear Historial Médico'}</Button>)}
        </Paper>
      )}
      { loading && historial === null && <Box sx={{display:'flex', justifyContent:'center', my: 5}}><CircularProgress/></Box> }

      {historial && (
        <>
          <Paper sx={{ mb: 3, borderRadius: 2, overflow:'hidden', boxShadow: 1 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile indicatorColor="primary" textColor="primary" sx={{borderBottom: 1, borderColor: 'divider'}}>
              <Tab label="Consultas" icon={<MedicalIcon />} iconPosition="start" {...a11yProps(0)} sx={{textTransform: 'none', fontSize: '0.9rem', px: {xs:1.5, sm:2}}}/>
              <Tab label="Vacunas" icon={<VaccineIcon />} iconPosition="start" {...a11yProps(1)} sx={{textTransform: 'none', fontSize: '0.9rem', px: {xs:1.5, sm:2}}}/>
              <Tab label="Peso" icon={<WeightIcon />} iconPosition="start" {...a11yProps(2)} sx={{textTransform: 'none', fontSize: '0.9rem', px: {xs:1.5, sm:2}}}/>
            </Tabs>

            {/* Pestaña de Consultas */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: {xs:0, sm:1} }}>
                <Typography variant="h5" fontWeight="500">Consultas Realizadas</Typography>
                {canEdit && (<Button variant="contained" size="small" color="primary" startIcon={<AddIcon />} component={Link} to={`/citas/nueva?mascotaId=${mascota?.id}`}>Nueva Consulta</Button>)}
              </Box>
              {consultas.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{borderRadius: 2}}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.100' } }}>
                        <TableCell>Fecha</TableCell><TableCell>Veterinario/a</TableCell><TableCell>Motivo</TableCell>
                        <TableCell>Diagnóstico</TableCell><TableCell>Signos Vitales</TableCell><TableCell align="center">Receta</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consultas.map((consulta) => (
                        <TableRow key={consulta.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>{formatDate(consulta.fecha, 'dd/MM/yy')}</TableCell>
                          <TableCell>{consulta.veterinario_nombre || 'N/A'}</TableCell>
                          <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Tooltip title={consulta.motivo_consulta || 'N/A'}><span>{consulta.motivo_consulta || 'N/A'}</span></Tooltip></TableCell>
                          <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Tooltip title={consulta.diagnostico || 'N/A'}><span>{consulta.diagnostico || 'N/A'}</span></Tooltip></TableCell>
                          <TableCell>
                            {consulta.peso && <Typography variant="caption" display="block">P: {formatNumber(consulta.peso, 'kg')}</Typography>}
                            {consulta.temperatura && <Typography variant="caption" display="block">T: {formatNumber(consulta.temperatura, '°C')}</Typography>}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver Receta">
                              <IconButton size="small" color="primary" onClick={() => handleOpenRecetaModal(consulta)} disabled={!consulta.cita_relacionada}>
                                <EventNoteIcon fontSize="small"/>
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (<Alert severity="info" variant="outlined" sx={{mt:1}}>No hay consultas registradas para esta mascota en su historial.</Alert>)}
            </TabPanel>

            {/* Pestaña de Vacunas */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: {xs:0, sm:1}  }}>
                <Typography variant="h5" fontWeight="500">Vacunaciones Aplicadas</Typography>
                {canEdit && (<Button variant="contained" size="small" color="primary" startIcon={<AddIcon />} component={Link} to={`/mascotas/${mascota?.id}/vacunas/nuevo`}>Registrar Vacuna</Button>)}
              </Box>
              {vacunaciones.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{borderRadius: 2}}>
                  <Table stickyHeader size="small">
                    <TableHead><TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.100' } }}><TableCell>Vacuna</TableCell><TableCell>Aplicación</TableCell><TableCell>Próxima Dosis</TableCell><TableCell>Veterinario/a</TableCell><TableCell>Estado</TableCell><TableCell align="center" sx={{minWidth: 120}}>Acciones</TableCell></TableRow></TableHead>
                    <TableBody>
                      {vacunaciones.map((vacuna) => {
                        const fechaProxima = vacuna.fecha_proxima ? parseISO(vacuna.fecha_proxima) : null;
                        const hoy = new Date(); hoy.setHours(0,0,0,0);
                        let estadoLabel = 'Dosis única / Sin revac.'; let estadoColor: "default" | "success" | "warning" | "error" = 'default';
                        if (fechaProxima && isValid(fechaProxima)) {
                            if (fechaProxima > hoy) { estadoLabel = 'Al día'; estadoColor = 'success'; const diffDays = (fechaProxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24); if (diffDays <= 30) { estadoLabel = 'Próxima Dosis Cercana'; estadoColor = 'warning';}}
                            else { estadoLabel = 'Revacunación Pendiente'; estadoColor = 'error'; }
                        }
                        return (
                          <TableRow key={vacuna.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>{vacuna.vacuna_nombre || 'N/A'}</TableCell><TableCell>{formatDate(vacuna.fecha_aplicacion, 'dd/MM/yy')}</TableCell><TableCell>{formatDate(vacuna.fecha_proxima, 'dd/MM/yy')}</TableCell><TableCell>{vacuna.veterinario_nombre || 'N/A'}</TableCell>
                            <TableCell><Chip label={estadoLabel} color={estadoColor} size="small" sx={{fontSize:'0.75rem', height: 'auto', '& .MuiChip-label': { py: 0.5, px:1 }}}/></TableCell>
                            <TableCell align="center"><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}><Tooltip title="Ver detalles de vacuna"><IconButton size="small" color="primary" onClick={() => navigate(`/mascotas/${mascota?.id}/vacunas/${vacuna.id}`)}><EventNoteIcon fontSize="small"/></IconButton></Tooltip>{canEdit && (<Tooltip title="Editar vacuna"><IconButton size="small" color="secondary" onClick={() => navigate(`/mascotas/${mascota?.id}/vacunas/editar/${vacuna.id}`)}><EditIcon fontSize="small"/></IconButton></Tooltip>)}{fechaProxima && isValid(fechaProxima) && fechaProxima <= hoy && canEdit && (<Tooltip title="Registrar revacunación"><IconButton size="small" sx={{color: 'success.main'}} onClick={() => navigate(`/mascotas/${mascota?.id}/vacunas/nuevo?revacunacion=${vacuna.vacuna}`)}><VaccineIcon fontSize="small"/></IconButton></Tooltip>)}</Box></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (<Alert severity="info" variant="outlined" sx={{mt:1}}>No hay vacunas registradas para esta mascota.</Alert>)}
            </TabPanel>
              <TabPanel value={tabValue} index={2}>
  {loading && registrosPeso.length === 0 ? ( 
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, py:3 }}>
      <CircularProgress size={50} />
    </Box>
  ) : pesoChartDataMUI.length > 1 ? ( 
    <Paper 
      elevation={3}
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        pt: { xs: 3, sm: 4 }, 
        borderRadius: 3, 
        mb: 4,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        }
      }}
    >
      {/* Título y estadísticas resumidas */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="600" color="text.primary" gutterBottom>
          Registro de Peso - {pesoChartDataMUI.length} mediciones
        </Typography>
        
        {/* Estadísticas rápidas */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 1.5,
            bgcolor: 'rgba(25, 118, 210, 0.05)',
            borderRadius: 2,
            border: `1px solid rgba(25, 118, 210, 0.1)`
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: 'primary.main' 
            }} />
            <Typography variant="body2" color="text.secondary">
              Peso actual: <strong>{formatNumber(pesoChartDataMUI[pesoChartDataMUI.length - 1]?.peso, 'kg')}</strong>
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 1.5,
            bgcolor: 'rgba(156, 39, 176, 0.05)',
            borderRadius: 2,
            border: `1px solid rgba(156, 39, 176, 0.1)`
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: 'secondary.main' 
            }} />
            <Typography variant="body2" color="text.secondary">
              Variación: {(() => {
                if (pesoChartDataMUI.length < 2) return 'N/A';
                const first = pesoChartDataMUI[0].peso;
                const last = pesoChartDataMUI[pesoChartDataMUI.length - 1].peso;
                const diff = last - first;
                const sign = diff >= 0 ? '+' : '';
                return <strong style={{ color: diff >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                  {sign}{diff.toFixed(1)} kg
                </strong>;
              })()}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Gráfico mejorado */}
      <Box sx={{ 
        height: { xs: 350, sm: 400, md: 450 }, 
        width: '100%',
        position: 'relative',
        '& .MuiChartsAxis-root': {
          '& .MuiChartsAxis-tickLabel': {
            fontSize: '0.75rem',
            fontWeight: 500,
          }
        }
      }}>
        <LineChart
          dataset={pesoChartDataMUI}
          series={[
            { 
              dataKey: 'peso', 
              label: 'Peso (kg)', 
              color: theme.palette.primary.main,
              showMark: true,
              curve: "catmullRom", // Línea suavizada
            },
          ]}
          xAxis={[{ 
            dataKey: 'xValueForChart',
            scaleType: 'linear',
            valueFormatter: (value: number) => {
              const dataPoint = pesoChartDataMUI[value];
              return (dataPoint && isValid(dataPoint.fechaOriginal)) 
                ? format(dataPoint.fechaOriginal, 'dd MMM', {locale: es}) 
                : '';
            },
            tickLabelStyle: { 
              angle: -45, 
              textAnchor: 'end', 
              fontSize: '0.75rem', 
              fill: theme.palette.text.secondary,
              fontWeight: 500,
            } as React.CSSProperties,
            tickNumber: Math.min(Math.max(3, Math.floor(pesoChartDataMUI.length / 2)), 8),
          }]}
          yAxis={[{ 
            min: muiPesoYAxisDomain?.[0],
            max: muiPesoYAxisDomain?.[1],
            tickLabelStyle: {
              fontSize: '0.8rem', 
              fill: theme.palette.text.secondary,
              fontWeight: 500,
            } as React.CSSProperties,
            valueFormatter: (value) => `${value} kg`,
            tickNumber: 6,
          }]}
          margin={{ top: 40, right: 30, bottom: 80, left: 60 }}
          grid={{ 
            vertical: false, 
            horizontal: true, 
            strokeDasharray: '5 5', 
            strokeOpacity: 0.2,
            stroke: theme.palette.divider,
          }}
          tooltip={{ 
            trigger: 'item',
          }}
          legend={{ 
            position: { vertical: 'top', horizontal: 'right' }, 
            labelStyle: { 
              fontSize: '0.875rem',
              fontWeight: 500,
              fill: theme.palette.text.primary,
            },
            padding: { top: 0, bottom: 20, left: 0, right: 0 }
          }}
          sx={{
            // Estilos para la línea principal
            width: '100%',
            height: '100%',
            '& .MuiLineElement-root': { 
              strokeWidth: 3,
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
            },
            // Estilos para los puntos de datos
            '& .MuiMarkElement-root': {
              r: 5, 
              fill: theme.palette.background.paper,
              strokeWidth: 3, 
              stroke: theme.palette.primary.main,
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { 
                r: 7,
                strokeWidth: 4,
                filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.2))',
              },
            },
            // Estilos para las líneas de la cuadrícula
            '& .MuiChartsGrid-line': {
              strokeWidth: 1,
            },
            // Estilos para el área del gráfico
            '& .MuiChartsAxis-root': {
              '& .MuiChartsAxis-line': {
                stroke: theme.palette.divider,
                strokeWidth: 1.5,
              },
              '& .MuiChartsAxis-tick': {
                stroke: theme.palette.divider,
                strokeWidth: 1,
              }
            },
            // Estilos para el tooltip
            '& .MuiChartsTooltip-root': {
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
            },
            // Animación suave al cargar
            '& .MuiLineElement-root, & .MuiMarkElement-root': {
              animation: 'fadeInChart 0.8s ease-out',
            },
            '@keyframes fadeInChart': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0px)',
              },
            },
          }}
        />
      </Box>

      {/* Información adicional en la parte inferior */}
      <Box sx={{ 
        mt: 3, 
        pt: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Última actualización: {formatDate(pesoChartDataMUI[pesoChartDataMUI.length - 1]?.fechaOriginal, 'PPp')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WeightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {pesoChartDataMUI.length} registros en total
          </Typography>
        </Box>
      </Box>
    </Paper>
  ) : registrosPeso.length >= 1 ? (
    <Paper
      elevation={2}
      sx={{ 
        p: 3, 
        borderRadius: 3,
        bgcolor: 'info.50',
        border: `1px solid ${theme.palette.info.light}`,
        textAlign: 'center'
      }}
    >
      <WeightIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
      <Alert 
        severity="info" 
        variant="standard"
        sx={{ 
          bgcolor: 'transparent',
          '& .MuiAlert-message': {
            textAlign: 'center'
          }
        }}
      >
        Se necesita al menos un registro de peso en un día diferente para mostrar la evolución en el gráfico.
        <br/>
        <Box component="span" sx={{ 
          display: 'inline-block', 
          mt: 1, 
          p: 1.5,
          bgcolor: 'white',
          borderRadius: 1,
          fontWeight: 'bold',
          fontSize: '1.1rem',
          color: 'primary.dark'
        }}>
          Único registro: {formatNumber(registrosPeso[0].peso, 'kg')} 
          <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
            el {formatDate(registrosPeso[0].fecha_registro, 'PPP')}
          </Typography>
        </Box>
      </Alert>
    </Paper>
  ) : (
    <Paper
      elevation={1}
      sx={{ 
        p: 4, 
        borderRadius: 3,
        bgcolor: 'grey.50',
        border: `2px dashed ${theme.palette.divider}`,
        textAlign: 'center'
      }}
    >
      <WeightIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Alert 
        severity="info" 
        variant="standard"
        sx={{ 
          bgcolor: 'transparent',
          '& .MuiAlert-icon': { alignItems: 'center' }
        }}
      >
        <Typography variant="h6" gutterBottom>
          No hay registros de peso disponibles
        </Typography>
        <Typography variant="body2">
          Comienza registrando el peso de la mascota para ver su evolución en el tiempo.
        </Typography>
      </Alert>
    </Paper>
  )}

  {/* Tabla de Registros de Peso Mejorada */}
  {registrosPeso.length > 0 && (
                <>
                  <Typography 
                    variant="h6" 
                    fontWeight="500" 
                    sx={{ 
                      mb: 2, 
                      mt: 4,
                      color: 'text.primary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <AssignmentIcon sx={{ color: 'primary.main' }} />
                    Historial Completo de Registros
                  </Typography>
                  
                  <TableContainer 
                    component={Paper} 
                    elevation={2}
                    sx={{ 
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`,
                      '& .MuiTableHead-root': {
                        bgcolor: 'primary.50' // Un fondo muy claro para el encabezado
                      }
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow sx={{ 
                          '& th': { 
                            fontWeight: 'bold', 
                            bgcolor: 'primary.main', // Fondo más oscuro para el encabezado
                            color: 'primary.contrastText',
                            fontSize: '0.875rem',
                            borderBottom: 'none'
                          } 
                        }}>
                          {/* MODIFICACIÓN 1: Cambiar el encabezado de la columna */}
                          <TableCell>Fecha</TableCell>
                          <TableCell align="right">Peso (kg)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {registrosPeso
                            .slice()
                            .sort((a,b) => {
                                const dateA = parseISO(a.fecha_registro);
                                const dateB = parseISO(b.fecha_registro);
                                if (!isValid(dateA) && !isValid(dateB)) return 0;
                                if (!isValid(dateA)) return 1;
                                if (!isValid(dateB)) return -1;
                                return dateB.getTime() - dateA.getTime();
                            })
                            .map((rp, index) => (
                                <TableRow 
                                  key={rp.id} 
                                  hover 
                                  sx={{ 
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' }, // Alternar color de filas
                                    '&:hover': { 
                                      bgcolor: theme.palette.action.selected, // Efecto hover más sutil
                                    }
                                  }}
                                >
                                  <TableCell sx={{ fontWeight: 500 }}>
                                    {/* MODIFICACIÓN 2: Cambiar el formato de la fecha */}
                                    {formatDate(rp.fecha_registro, 'PPP')}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ 
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      bgcolor: index === 0 ? 'success.light' : 'transparent', // Resaltar el más reciente
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      fontWeight: 'bold',
                                      color: index === 0 ? 'success.dark' : 'text.primary'
                                    }}>
                                      {parseFloat(rp.peso).toFixed(2)}
                                      {index === 0 && (
                                        <Typography component="span" variant="caption" sx={{ ml: 0.5, fontSize: '0.6rem', fontWeight:'normal' }}>
                                          ACTUAL
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                            ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}


</TabPanel>
          </Paper>
        </>
      )}

      {/* Modal para mostrar la receta */}
      <Dialog open={isRecetaModalOpen} onClose={handleCloseRecetaModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, m:{xs:1, sm:2} } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', px:2.5, py:1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MedicationIcon />
            <Typography variant="h6" component="div" fontWeight="medium">Detalle de Receta</Typography>
          </Box>
          <IconButton aria-label="close" onClick={handleCloseRecetaModal} size="small" sx={{color: 'primary.contrastText', '&:hover': {bgcolor: 'rgba(255,255,255,0.15)'}}}>
            <CloseIcon fontSize="small"/>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{p: {xs: 2, sm: 2.5, md: 3}, bgcolor: 'grey.50' }}>
          {loadingReceta ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, py:3 }}><CircularProgress /></Box>
          ) : selectedReceta && selectedConsultaInfo ? (
            <Box>
                <Paper elevation={0} sx={{p:2, mb:2.5, borderRadius:2}}>
                    <Typography variant="h6" gutterBottom color="text.primary" sx={{fontSize: '1.1rem', mb:0.5}}>Consulta del {selectedConsultaInfo.fecha}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 1.5}}>Atendido por: {selectedConsultaInfo.veterinario_nombre || 'N/A'}</Typography>
                    
                    <Grid container spacing={0.5} sx={{fontSize: '0.9rem'}}>
                        {selectedConsultaInfo.motivo && <Grid item xs={12}><Typography variant="body2"><strong>Motivo:</strong> {selectedConsultaInfo.motivo}</Typography></Grid>}
                        {selectedConsultaInfo.diagnostico && <Grid item xs={12}><Typography variant="body2" sx={{mt:0.5}}><strong>Diagnóstico:</strong> {selectedConsultaInfo.diagnostico}</Typography></Grid>}
                    </Grid>
                </Paper>
                
                {selectedReceta.medicamentos && selectedReceta.medicamentos.length > 0 ? (
                <>
                    <Typography variant="subtitle1" component="div" sx={{ mb: 1.5, fontWeight: 'medium', mt: 1, color:'text.primary' }}>
                        Medicamentos Recetados ({selectedReceta.medicamentos.length})
                    </Typography>
                    <Box sx={{maxHeight: {xs:200, sm: 280}, overflowY: 'auto', pr: {xs:0.5, sm:1}, mr: {xs:-0.5, sm:-1} }}>
                      {selectedReceta.medicamentos.map((med) => (
                          <Paper key={med.id || med.nombre} elevation={0} variant="outlined" sx={{ mb: 1.5, p: 1.5, borderRadius: 2, '&:last-child': {mb:0.5}, borderColor: 'grey.300' }}>
                              <Typography variant="subtitle1" component="div" fontWeight="bold" color="primary.dark" sx={{mb:1}}>
                                  {med.nombre || 'Medicamento Desconocido'}
                              </Typography>
                              <Grid container spacing={1} sx={{fontSize:'0.875rem'}}>
                                  <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Dosis:</strong> {med.dosis || 'N/A'}</Typography></Grid>
                                  <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Frecuencia:</strong> {med.frecuencia || 'N/A'}</Typography></Grid>
                                  <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Duración:</strong> {med.duracion || 'N/A'}</Typography></Grid>
                                  <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Cantidad:</strong> {med.cantidad != null ? `${med.cantidad} uds.` : 'N/A'}</Typography></Grid>
                                  {med.instrucciones && med.instrucciones !== 'N/A' && (
                                      <Grid item xs={12}><Typography variant="body2" sx={{mt:0.5, fontStyle:'italic', color:'text.secondary'}}><strong>Instrucciones:</strong> {med.instrucciones}</Typography></Grid>
                                  )}
                              </Grid>
                          </Paper>
                      ))}
                    </Box>
                    {selectedReceta.observaciones_receta && selectedReceta.observaciones_receta !== "No se encontró una receta directamente asociada a esta consulta por su ID en las observaciones." && (
                        <Typography variant="caption" display="block" sx={{mt:2, pt:1.5, fontStyle: 'italic', color: 'text.secondary', borderTop: 1, borderColor:'divider'}}>
                            Observaciones Generales de la Receta: {selectedReceta.observaciones_receta}
                        </Typography>
                    )}
                </>
                ) : (
                  <Alert severity="info" variant="outlined" sx={{ my: 2, textAlign: 'center' }}>No se recetaron medicamentos en esta consulta o no se encontró la receta asociada.</Alert>
                )}
            </Box>
          ) : (
             <Alert severity="warning" variant="outlined" sx={{ my: 2, textAlign: 'center' }}>No hay datos de receta disponibles para esta consulta o la consulta seleccionada no tiene una receta asociada.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{px: {xs:2, sm:2.5}, py:1.5, borderTop: 1, borderColor:'divider', bgcolor: 'grey.100'}}>
          <Button onClick={handleCloseRecetaModal} variant="contained" color="primary" size="medium">Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default HistorialMascota;