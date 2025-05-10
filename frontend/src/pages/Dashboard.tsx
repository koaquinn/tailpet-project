// src/pages/Dashboard.tsx
import React, { FC, useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import PersonIcon from '@mui/icons-material/Person';
import { getClientes } from '../api/clienteApi';
import { getMascotas } from '../api/mascotaApi';
import { useAuth } from '../context/AuthContext';
import { blue } from '@mui/material/colors';


interface Summary {
  totalClientes: number;
  totalMascotas: number;
}

const Dashboard: FC = () => {
  const [summary, setSummary] = useState<Summary>({
    totalClientes: 0,
    totalMascotas: 0
  });

  const { user } = useAuth();//hererererreeggeggeggdhd

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [clientesData, mascotasData] = await Promise.all([
          getClientes(),
          getMascotas()
        ]);

        setSummary({
          totalClientes:
            clientesData.count ?? clientesData.results?.length ?? 0,
          totalMascotas:
            mascotasData.count ?? mascotasData.results?.length ?? 0
        });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Typography variant="h6" align="center">
        Cargando información...
      </Typography>
    );
  }

  return (
    <Box>

      {user && (
        <Paper
        elevation={3}
        sx={{
          mb: 3,
          p: 2,
          bgcolor: 'rgba(0,0,0,0.03)',
          borderRadius: 2,
          maxWidth: 800,
          textAlign: 'left'
          
        }}
      >
        <Typography variant="h6" color='#6366F1'>
          Bienvenido/a, <strong>{user.username}</strong>
        </Typography>
      </Paper>
      )}

      <Grid container spacing={1}>
        <Grid item xs={12}
          md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color='#6366F1'>Citas del día</Typography>
              <Box mt={2} display="flex" alignItems="baseline">
                <Typography variant="h3" sx={{ mr: 1, color: "blue" }}>
                  4
                </Typography>
                <Typography variant="subtitle1">citas programadas</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}
          md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color='#6366F1'>Alertas de inventario</Typography>
              <Box mt={2} display="flex" alignItems="baseline">
                <Typography variant="h3" sx={{ mr: 1, color: "red" }}>
                  1
                </Typography>
                <Typography variant="subtitle1">productos con bajo stock</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}
          md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color='#6366F1'>Vacunas proximas</Typography>
              <Box mt={2} display="flex" alignItems="baseline">
                <Typography variant="h3" sx={{ mr: 1, color: "orange" }}>
                  2
                </Typography>
                <Typography variant="subtitle1">vacunas por vencer</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom color='#6366F1'>
              Actividad reciente
            </Typography>
            <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                  <Box sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: '#4285F4', 
                    mr: 2 
                  }}/>
                  <Typography variant="body2">
                    Hoy 09:00 AM - Se creó ficha para Mascota: Toby (Cliente: Juan Pérez)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                  <Box sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: '#4285F4', 
                    mr: 2 
                  }}/>
                  <Typography variant="body2">
                    Hoy 09:15 AM - Se agendó cita con Dr. García para Luna (Cliente: María López)
                  </Typography>
                </Box>
          </Box>
          </CardContent>
        </Card>
      </Box>

      <Box mt={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom color='#6366F1'>
              Consultas del mes (Mayo)
            </Typography>
            {/*ejemplo grafico*/}
            <Box sx={{ mt: 2, height: 150, display: 'flex', alignItems: 'flex-end' }}>

                {['1-5', '6-10', '11-15', '16-20', '21-25', '26-30'].map((label, index) => {
                  const height = [55, 70, 55, 80, 65, 50, 70][index % 7];
                  return (
                    <Box 
                      key={label}
                      sx={{
                        height: `${height}%`,
                        width: '12%',
                        bgcolor: '#4A7B9D',
                        mx: '2%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        {label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
          </CardContent>
        </Card>
      </Box>

      
    </Box>
  );
};

export default Dashboard;
