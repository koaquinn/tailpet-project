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

interface Summary {
  totalClientes: number;
  totalMascotas: number;
}

const Dashboard: FC = () => {
  const [summary, setSummary] = useState<Summary>({
    totalClientes: 0,
    totalMascotas: 0
  });
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
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard – Sistema Veterinario Tailpet
      </Typography>

      <Grid container spacing={3}>
        {/* Tarjetas de resumen */}
        <Grid item xs={12} sm={6}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'white'
            }}
          >
            <PersonIcon sx={{ fontSize: 60 }} />
            <Typography variant="h4">{summary.totalClientes}</Typography>
            <Typography variant="h6">Clientes Registrados</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'secondary.light',
              color: 'white'
            }}
          >
            <PetsIcon sx={{ fontSize: 60 }} />
            <Typography variant="h4">{summary.totalMascotas}</Typography>
            <Typography variant="h6">Mascotas Registradas</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Bienvenido al Sistema de Gestión Veterinaria
              </Typography>
              <Typography variant="body1">
                Este sistema te permitirá gestionar la información de clientes,
                mascotas, citas y servicios veterinarios de forma eficiente.
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Selecciona una opción del menú lateral para comenzar.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
