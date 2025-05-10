// src/pages/auth/ForbiddenPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const ForbiddenPage: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backgroundColor: '#fff8f8'
        }}
      >
        <WarningIcon 
          sx={{ 
            fontSize: 80, 
            color: '#f44336',
            mb: 2
          }} 
        />
        
        <Typography variant="h4" component="h1" gutterBottom>
          Acceso Denegado
        </Typography>
        
        <Typography variant="body1" align="center" paragraph sx={{ mb: 3 }}>
          No tienes los permisos necesarios para acceder a esta página.
          Por favor, contacta al administrador del sistema si crees que 
          deberías tener acceso.
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Button 
            component={Link} 
            to="/dashboard" 
            variant="contained" 
            color="primary"
            sx={{ mr: 2 }}
          >
            Ir al Dashboard
          </Button>
          
          <Button 
            component={Link} 
            to="/"
            variant="outlined"
          >
            Volver al Inicio
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForbiddenPage;