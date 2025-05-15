// src/components/Sidebar.tsx
import React from 'react';
import {
  Box,
  Drawer,
  List,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  useTheme,
  alpha
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PetsIcon from '@mui/icons-material/Pets';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicationIcon from '@mui/icons-material/Medication';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

interface SidebarProps {
  open: boolean;
  handleDrawerClose: () => void;
}

interface MenuEntry {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];  // qué roles pueden verlo
}

const menuItems: MenuEntry[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: [] },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { text: 'Mascotas', icon: <PetsIcon />, path: '/mascotas', roles: ['ADMIN', 'RECEPCIONISTA', 'VETERINARIO'] },
  { text: 'Citas', icon: <EventNoteIcon />, path: '/citas', roles: ['ADMIN', 'RECEPCIONISTA', 'VETERINARIO'] },
  { text: 'Inventario', icon: <MedicationIcon />, path: '/inventario', roles: ['ADMIN', 'VETERINARIO'] },
  { text: 'Facturación', icon: <ReceiptIcon />, path: '/facturacion', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { text: 'Reportes', icon: <BarChartIcon />, path: '/reportes', roles: ['ADMIN'] },
  { text: 'Usuarios', icon: <AdminPanelSettingsIcon />, path: '/admin/usuarios', roles: ['ADMIN'] },
];

const Sidebar: React.FC<SidebarProps> = ({ open, handleDrawerClose }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  // Filtra: rutas sin roles ([]) o donde user.rol esté incluído
  const filteredMenuItems = menuItems.filter(item =>
    item.roles.length === 0 ||
    (!!user && item.roles.includes(user.rol))
  );

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)', 
          borderRight: `1px solid ${theme.palette.divider}` 
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader sx={{ 
        bgcolor: alpha(theme.palette.primary.main, 0.03),
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
      }}>
        <IconButton 
          onClick={handleDrawerClose}
          sx={{
            borderRadius: 1.5,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>

      <List sx={{ px: 1, py: 1.5 }}>
        {filteredMenuItems.map(item => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <ListItem
              key={item.text}
              disablePadding
              component={Link}
              to={item.path}
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit',
                mb: 0.5,
                borderRadius: 1.5,
                overflow: 'hidden'
              }}
            >
              <ListItemButton
                selected={isActive}
                sx={{
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease',
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isActive ? 'primary.main' : 'text.secondary',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.95rem',
                    color: isActive ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box flexGrow={1} />
      <Divider />
      <List sx={{ p: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={logout}
            sx={{
              borderRadius: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                '& .MuiListItemIcon-root': {
                  color: theme.palette.error.main,
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.error.main,
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Cerrar Sesión"
              slotProps={{
                primary: {
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;