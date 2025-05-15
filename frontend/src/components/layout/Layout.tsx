import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  Box, 
  CssBaseline, 
  CircularProgress, 
  useTheme, 
  alpha, 
  Typography,
  Fade,
  Paper 
} from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  
  // Verificar autenticación al cargar el componente
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Si no está autenticado, redirigir al login
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Mostrar spinner mientras verifica la autenticación
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: 'background.default',
          gap: 2
        }}
      >
        <CircularProgress 
          size={60}
          sx={{
            color: theme.palette.primary.main,
            boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        />
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ 
            mt: 2,
            fontWeight: 500,
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 }
            }
          }}
        >
          Cargando TailPet...
        </Typography>
      </Box>
    );
  }

  // Si no está autenticado, no renderizar nada (se redirigirá en el useEffect)
  if (!isAuthenticated) {
    return null;
  }
  
  // Calcular el ancho del drawer para el margen
  const drawerWidth = 240;
  
  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      bgcolor: alpha(theme.palette.primary.main, 0.02)
    }}>
      <CssBaseline />
      <Navbar 
        open={open} 
        handleDrawerOpen={() => setOpen(true)} 
        user={user} 
      />
      <Sidebar 
        open={open} 
        handleDrawerClose={() => setOpen(false)} 
      />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
          mt: 8,
          ml: open ? `${drawerWidth}px` : 0,
          transition: theme => theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            flexGrow: 1,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: 'none',
            position: 'relative',
            bgcolor: 'transparent'
          }}
        >
          <Fade in={true} timeout={500}>
            <Box sx={{ height: '100%' }}>
              <Outlet />
            </Box>
          </Fade>
        </Paper>
      </Box>
    </Box>
  );
};

export default Layout;