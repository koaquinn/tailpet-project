// src/pages/historial/HistorialMascota.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Tabs, Tab, Button, Divider, Grid,
  Chip, Avatar, CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, List,
  Card, CardContent
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
  MonitorWeight as WeightIcon, // Para el icono de la tab de Peso
  Medication as MedicationIcon 
} from '@mui/icons-material';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Importar Recharts
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

// APIs
import mascotaApi, { RegistroPesoData, getMascota } from '../../api/mascotaApi';
import historialApi from '../../api/historialApi';
import consultaApi, { RecetaCompletaResponse } from '../../api/consultaApi'; // Asumiendo que RecetaCompletaResponse está exportada
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

const HistorialMascota: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth(); 
  const canEdit = hasRole('ADMIN') || hasRole('VETERINARIO');

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  const [mascota, setMascota] = useState<any>(null); 
  const [historial, setHistorial] = useState<any>(null); 
  const [consultas, setConsultas] = useState<any[]>([]); // Estas son las historial_medico.models.Consulta
  const [vacunaciones, setVacunaciones] = useState<any[]>([]);
  const [registrosPeso, setRegistrosPeso] = useState<RegistroPesoData[]>([]);

  const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<RecetaCompletaResponse | null>(null);
  const [loadingReceta, setLoadingReceta] = useState(false);
  const [selectedConsultaInfo, setSelectedConsultaInfo] = useState<{ 
    fecha: string, motivo?: string, diagnostico?: string, veterinario_nombre?: string 
  } | null>(null);

  const formatDate = (dateString: string | null | undefined, dateFormat: string = 'PPP') => {
    if (!dateString) return 'No registrada';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, dateFormat, { locale: es }) : 'Fecha inválida';
    } catch (error) { 
      console.error("Error formateando fecha:", dateString, error);
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
        // Asumiendo que getRegistrosPesoPorMascota puede devolver un array o un objeto con results
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
    setLoading(true); // Para el botón
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

  const pesoChartData = registrosPeso
    .map(rp => {
      const fechaObj = parseISO(rp.fecha_registro);
      return {
        fecha: fechaObj, 
        peso: parseFloat(rp.peso), 
        name: isValid(fechaObj) ? format(fechaObj, 'dd MMM yy', { locale: es }) : 'Fecha Inv.', 
      };
    })
    .filter(d => isValid(d.fecha) && !isNaN(d.peso)) 
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()); 

  const getPesoDomain = (): [number | string, number | string] => {
    if (pesoChartData.length === 0) return ['auto', 'auto']; 
    const pesos = pesoChartData.map(d => d.peso);
    const minPeso = Math.min(...pesos);
    const maxPeso = Math.max(...pesos);
    const padding = Math.max((maxPeso - minPeso) * 0.15, 1); 
    const domainMin = Math.max(0, Math.floor(minPeso - padding));
    const domainMax = Math.ceil(maxPeso + padding);
    return [domainMin, domainMax === domainMin ? domainMin + 2 : domainMax]; 
  };
  const pesoDomain = getPesoDomain();

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

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: {xs:0, sm:1} }}>
                <Typography variant="h5" fontWeight="500">Consultas Realizadas</Typography>
                {canEdit && (<Button variant="contained" size="small" color="primary" startIcon={<AddIcon />} component={Link} to={`/citas/nueva?mascotaId=${mascota.id}`}>Nueva Consulta</Button>)}
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

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: {xs:0, sm:1}  }}>
                <Typography variant="h5" fontWeight="500">Vacunaciones Aplicadas</Typography>
                {canEdit && (<Button variant="contained" size="small" color="primary" startIcon={<AddIcon />} component={Link} to={`/mascotas/${mascota.id}/vacunas/nuevo`}>Registrar Vacuna</Button>)}
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
                            <TableCell align="center"><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}><Tooltip title="Ver detalles de vacuna"><IconButton size="small" color="primary" onClick={() => navigate(`/mascotas/${mascota.id}/vacunas/${vacuna.id}`)}><EventNoteIcon fontSize="small"/></IconButton></Tooltip>{canEdit && (<Tooltip title="Editar vacuna"><IconButton size="small" color="secondary" onClick={() => navigate(`/mascotas/${mascota.id}/vacunas/editar/${vacuna.id}`)}><EditIcon fontSize="small"/></IconButton></Tooltip>)}{fechaProxima && isValid(fechaProxima) && fechaProxima <= hoy && canEdit && (<Tooltip title="Registrar revacunación"><IconButton size="small" sx={{color: 'success.main'}} onClick={() => navigate(`/mascotas/${mascota.id}/vacunas/nuevo?revacunacion=${vacuna.vacuna}`)}><VaccineIcon fontSize="small"/></IconButton></Tooltip>)}</Box></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (<Alert severity="info" variant="outlined" sx={{mt:1}}>No hay vacunas registradas para esta mascota.</Alert>)}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: {xs:0, sm:1} }}>
                <Typography variant="h5" fontWeight="500">Evolución del Peso</Typography>
                {canEdit && (
                    <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => alert("Funcionalidad para registrar peso manualmente pendiente.")} // TODO: Implementar ruta/modal
                    >
                        Registrar Peso
                    </Button>
                )}
              </Box>

              {loading && registrosPeso.length === 0 ? ( 
                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, py:3 }}><CircularProgress /></Box>
              ) : pesoChartData.length > 1 ? ( 
                <Paper variant="outlined" sx={{ p: {xs:1, sm:2}, pt:{xs:2, sm:3}, borderRadius: 2, mb: 3, height: { xs: 300, sm: 350, md: 400 } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pesoChartData} margin={{ top: 5, right: 25, left: 0, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4}/>
                      <XAxis 
                          dataKey="name" 
                          angle={-40}
                          textAnchor="end"
                          height={70} 
                          interval="preserveStartEnd" // Muestra la primera y última etiqueta, y algunas intermedias
                          tick={{fontSize: '0.7rem', fill: '#555'}}
                      />
                      <YAxis 
                          domain={pesoDomain} 
                          tickFormatter={(tick) => `${tick}kg`}
                          allowDecimals={true}
                          tickCount={Math.min(7, Math.ceil(pesoDomain[1] - pesoDomain[0]) + 2)} // Ajustar tickCount
                          width={50} // Ancho para las etiquetas del eje Y
                          tick={{fontSize: '0.75rem', fill: '#555'}}
                      />
                      <RechartsTooltip 
                          labelFormatter={(label) => `Fecha: ${label}`} 
                          formatter={(value: number) => [`${value.toFixed(2)} kg`, "Peso"]}
                          contentStyle={{borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.15)', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.9)'}}
                          labelStyle={{fontWeight: 'bold', color: '#1a237e', marginBottom:'4px'}}
                          itemStyle={{color: '#1976d2'}}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '0.9rem', paddingTop: '5px'}}/>
                      <Line 
                        type="monotone" 
                        dataKey="peso" 
                        strokeWidth={3} 
                        stroke="#1976d2" 
                        activeDot={{ r: 8, strokeWidth: 2, fill: '#bbdefb', stroke: '#1976d2' }} 
                        name="Peso (kg)" 
                        dot={{stroke: '#1976d2', strokeWidth: 1.5, r:4, fill: '#fff'}}
                        />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              ) : registrosPeso.length === 1 ? (
                 <Alert severity="info" variant="outlined" sx={{mt:1}}>
                    Se necesita al menos un registro de peso más para mostrar la evolución en el gráfico.
                    <br/>Único registro: <strong>{formatNumber(registrosPeso[0].peso, 'kg')}</strong> el {formatDate(registrosPeso[0].fecha_registro, 'PPP')}.
                </Alert>
              ) : (
                 <Alert severity="info" variant="outlined" sx={{mt:1}}>
                  No hay registros de peso disponibles para esta mascota.
                </Alert>
              )}

              {registrosPeso.length > 0 && (
                <>
                  <Typography variant="h6" fontWeight="500" sx={{mb:1.5, mt: pesoChartData.length > 1 ? 3: 1}}>
                    Tabla de Registros de Peso
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{borderRadius: 2}}>
                    <Table stickyHeader size="small">
                      <TableHead><TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.100' } }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Peso (kg)</TableCell>
                        <TableCell>Notas</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {pesoChartData.slice().reverse().map((rpData) => { 
                            const originalRegistro = registrosPeso.find(orig => parseISO(orig.fecha_registro).getTime() === rpData.fecha.getTime());
                            return (
                                <TableRow key={originalRegistro?.id || rpData.name} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{rpData.name}</TableCell>
                                    <TableCell align="right">{rpData.peso.toFixed(2)}</TableCell>
                                    <TableCell sx={{maxWidth: 250, whiteSpace: 'normal'}}>{originalRegistro?.notas || ''}</TableCell>
                                </TableRow>
                            );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </TabPanel>
          </Paper>
        </>
      )}

      <Dialog open={isRecetaModalOpen} onClose={handleCloseRecetaModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, m:{xs:1, sm:2} } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', px:2.5, py:1.5 }}> {/* Ajustado color a primary.main */}
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