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
  colors
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
import LogoutIcon from '@mui/icons-material/Logout'; //
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
  { text: 'Clientes',  icon: <PeopleIcon />, path: '/clientes',   roles: ['ADMIN', 'RECEPCIONISTA'] },
  { text: 'Mascotas',  icon: <PetsIcon />,  path: '/mascotas',    roles: ['ADMIN', 'RECEPCIONISTA', 'VETERINARIO'] },
  { text: 'Citas',     icon: <EventNoteIcon />, path: '/citas',     roles: ['ADMIN', 'RECEPCIONISTA', 'VETERINARIO'] },
  { text: 'Historiales', icon: <HealthAndSafetyIcon />, path: '/historiales', roles: ['ADMIN', 'VETERINARIO'] },
  { text: 'Inventario', icon: <MedicationIcon />, path: '/inventario', roles: ['ADMIN', 'VETERINARIO'] },
  { text: 'Facturación', icon: <ReceiptIcon />, path: '/facturacion', roles: ['ADMIN', 'RECEPCIONISTA'] },
  { text: 'Reportes',  icon: <BarChartIcon />, path: '/reportes',    roles: ['ADMIN'] },
  { text: 'Usuarios',  icon: <AdminPanelSettingsIcon />, path: '/admin/usuarios', roles: ['ADMIN'] },
];

const Sidebar: React.FC<SidebarProps> = ({ open, handleDrawerClose }) => {
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
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
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
              sx={{ textDecoration: 'none', color: 'inherit' }}
            >
              <ListItemButton
                selected={isActive}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.12)' },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box flexGrow={1} />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}
          
          sx={{ 
            '&:hover':{
              backgroundColor:'#6366F1',
              '& .MuiListItemText-primary': {
                color: 'white',
              },
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
          >
            <ListItemIcon sx={{ color: 'black'}}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" 
              primaryTypographyProps={{
                fontWeight: 'normal', 
              }}
              />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
