import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
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
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Si no está autenticado, no renderizar nada (se redirigirá en el useEffect)
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <Box sx={{ display: 'flex' }}>
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
          p: 3, 
          mt: 8,
          ml: open ? '240px' : 0,
          transition: theme => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;