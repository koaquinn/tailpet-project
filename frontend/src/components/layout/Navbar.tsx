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
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PetsIcon from '@mui/icons-material/Pets';
import LogoutIcon from '@mui/icons-material/Logout';
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
    rol: string;         // ahora viene como un string único
  } | null;
}

const Navbar: React.FC<NavbarProps> = ({ open, handleDrawerOpen, user }) => {
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

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={{ mr: 2, ...(open && { display: 'none' }) }}
        >
          <MenuIcon />
        </IconButton>

        <PetsIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        <Typography variant="h6" noWrap component="div">
          Tailpet - Gestión Veterinaria
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 2 }}>
              <Typography variant="body2" color="inherit" sx={{ mr: 1 }}>
                {user.first_name} {user.last_name}
              </Typography>
              <Chip
                label={primaryRole}
                color={roleColor}
                size="small"
                variant="outlined"
                sx={{ borderColor: 'white', color: 'white', fontSize: '0.7rem' }}
              />
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                bgcolor: 'rgba(255, 255, 255, 0.15)', 
                borderRadius: '999px', 
                gap: 1,
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                },
              }}
              onClick={handleOpenUserMenu}
            >
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: 16 }}>
                {user.first_name ? user.first_name[0] : user.username ? user.username[0] : 'U'}
              </Avatar>
              <Typography
                variant="body2"
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {user.username}
              </Typography>
            </Box>
          

            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem disabled>
                <Typography textAlign="center">{user.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography textAlign="center">Cerrar sesión</Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
