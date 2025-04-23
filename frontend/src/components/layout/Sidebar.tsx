// src/components/layout/Sidebar.tsx
import { 
    Box, Drawer, List, Divider, IconButton, ListItem, 
    ListItemButton, ListItemIcon, ListItemText, styled 
  } from '@mui/material';
  import { Link } from 'react-router-dom';
  import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
  import DashboardIcon from '@mui/icons-material/Dashboard';
  import PeopleIcon from '@mui/icons-material/People';
  import PetsIcon from '@mui/icons-material/Pets';
  import EventNoteIcon from '@mui/icons-material/EventNote';
  
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
  
  const Sidebar = ({ open, handleDrawerClose }: SidebarProps) => {
    const menuItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
      { text: 'Mascotas', icon: <PetsIcon />, path: '/mascotas' },
    ];  
  
    return (
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
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
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding component={Link} to={item.path} sx={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    );
  };
  
  export default Sidebar;