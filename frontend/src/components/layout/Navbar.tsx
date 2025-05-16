// src/components/Navbar.tsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  Chip,
  useTheme,
  alpha,
  Badge,
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PetsIcon from '@mui/icons-material/Pets';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  open: boolean;
  handleDrawerOpen: () => void;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    rol: string;
  } | null;
}

const Navbar: React.FC<NavbarProps> = ({ open, handleDrawerOpen, user }) => {
  const theme = useTheme();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  // Tomamos directamente el rol
  const primaryRole = user?.rol ?? 'Usuario';

  // Mapeo de roles a colores de Chip
  const roleColors: Record<string, 'default' | 'error' | 'info' | 'success'> = {
    ADMIN: 'error',
    VETERINARIO: 'info',
    RECEPCIONISTA: 'success',
  };
  const roleColor = roleColors[primaryRole] || 'default';

  // Función para obtener las iniciales del usuario
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name[0].toUpperCase();
    } else if (user.username) {
      return user.username[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={2}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.25)}`
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={{ 
            mr: 2, 
            ...(open && { display: 'none' }),
            backgroundColor: alpha('#fff', 0.1),
            '&:hover': {
              backgroundColor: alpha('#fff', 0.2),
            },
            borderRadius: 1,
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: alpha('#fff', 0.1),
            borderRadius: 1,
            px: 1.5,
            py: 0.75,
            mr: 1
          }}
        >
          <PetsIcon sx={{ fontSize: 24 }} />
        </Box>
        <Typography 
          variant="h6" 
          noWrap 
          component="div"
          sx={{ 
            fontWeight: 600,
            letterSpacing: 0.5,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          TailPet
        </Typography>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            ml: 1.5, 
            opacity: 0.8,
            display: { xs: 'none', sm: 'block' }
          }}
        >
          Gestión Veterinaria
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notificaciones - Solo para pantallas medianas y grandes */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
              <Tooltip title="Notificaciones">
                <IconButton color="inherit" size="large" sx={{ position: 'relative' }}>
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Información del usuario - Solo para pantallas medianas y grandes */}
            <Box 
              sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                alignItems: 'center', 
                mr: 2,
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}
            >
              <Typography 
                variant="body2" 
                color="inherit" 
                sx={{ 
                  fontWeight: 500,
                  lineHeight: 1.2
                }}
              >
                {user.first_name} {user.last_name}
              </Typography>
              <Chip
                label={primaryRole}
                color={roleColor}
                size="small"
                sx={{ 
                  height: 20, 
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  mt: 0.5,
                  backgroundColor: alpha(theme.palette[roleColor].main, 0.8),
                  color: '#fff',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            </Box>
            
            {/* Avatar del usuario - Siempre visible */}
            <Tooltip title="Abrir configuración de usuario">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  py: 0.5,
                  bgcolor: alpha('#fff', 0.15), 
                  borderRadius: 6, 
                  gap: 1,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.25),
                  },
                }}
                onClick={handleOpenUserMenu}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.background.paper, 
                    color: theme.palette.primary.main,
                    width: 36, 
                    height: 36, 
                    fontSize: 16,
                    fontWeight: 'bold',
                    border: `2px solid ${alpha('#fff', 0.5)}`,
                  }}
                >
                  {getUserInitials()}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography
                    variant="body2"
                    color="inherit"
                    sx={{ fontWeight: 500 }}
                  >
                    {user.username}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>

            {/* Menú de usuario */}
            <Menu
              sx={{ 
                mt: '45px',
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }
              }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {user.email}
                </Typography>
                <Chip
                  label={primaryRole}
                  color={roleColor}
                  size="small"
                  sx={{ 
                    mt: 1, 
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleCloseUserMenu} sx={{ py: 1.5 }}>
                <PersonIcon fontSize="small" sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                <Typography>Mi Perfil</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu} sx={{ py: 1.5 }}>
                <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                <Typography>Configuración</Typography>
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem 
                onClick={handleLogout}
                sx={{ 
                  py: 1.5,
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  }
                }}
              >
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                <Typography fontWeight={500}>Cerrar sesión</Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;