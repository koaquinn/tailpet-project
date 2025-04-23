// src/components/layout/Navbar.tsx
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PetsIcon from '@mui/icons-material/Pets';

interface NavbarProps {
  open: boolean;
  handleDrawerOpen: () => void;
}

const Navbar = ({ open, handleDrawerOpen }: NavbarProps) => {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={{ marginRight: 2, ...(open && { display: 'none' }) }}
        >
          <MenuIcon />
        </IconButton>
        <PetsIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        <Typography variant="h6" noWrap component="div">
          Tailpet - Gestión Veterinaria
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;