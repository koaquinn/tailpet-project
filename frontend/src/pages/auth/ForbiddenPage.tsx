// src/pages/auth/ForbiddenPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  useTheme,
  alpha 
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const ForbiddenPage: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Container 
      maxWidth="sm"
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2, // Responsive padding
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 3, sm: 4 }, // Responsive padding
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 3,
          width: '100%',
          backgroundColor: alpha(theme.palette.error.light, 0.1),
          borderLeft: `4px solid ${theme.palette.error.main}`,
          boxShadow: `0 10px 15px -3px ${alpha(theme.palette.error.main, 0.1)}, 
                      0 4px 6px -2px ${alpha(theme.palette.error.main, 0.05)}`,
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            mb: 3,
          }}
        >
          <WarningIcon 
            sx={{ 
              fontSize: 60, 
              color: theme.palette.error.main,
            }} 
          />
        </Box>
        
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            mb: 2,
          }}
        >
          Acceso Denegado
        </Typography>
        
        <Typography 
          variant="body1" 
          align="center" 
          paragraph 
          sx={{ 
            mb: 4,
            color: theme.palette.text.secondary,
            maxWidth: '90%',
            lineHeight: 1.6,
          }}
        >
          No tienes los permisos necesarios para acceder a esta página.
          Por favor, contacta al administrador del sistema si crees que 
          deberías tener acceso.
        </Typography>
        
        <Box 
          sx={{ 
            mt: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          <Button 
            component={Link} 
            to="/dashboard" 
            variant="contained" 
            color="primary"
            fullWidth={true}
            sx={{ 
              py: 1.2,
              minWidth: { xs: '100%', sm: 140 },
              fontWeight: 500,
            }}
          >
            Ir al Dashboard
          </Button>
          
          <Button 
            component={Link} 
            to="/"
            variant="outlined"
            fullWidth={true}
            sx={{ 
              py: 1.2,
              minWidth: { xs: '100%', sm: 140 },
              fontWeight: 500,
            }}
          >
            Volver al Inicio
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForbiddenPage;