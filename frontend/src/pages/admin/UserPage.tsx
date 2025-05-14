// src/pages/admin/UserPage.tsx (corregido)
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import authApi, { User, Role } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState<number | null>(null);

  const { hasRole } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        authApi.getUsers(),
        authApi.getRoles(),
      ]);
      setUsers(usersRes.results);
      setRoles(rolesRes.results);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const changeRole = async (userId: number, roleId: number) => {
    setUpdateLoading(userId);
    try {
      await authApi.updateUser(userId, { rol_id: roleId });
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar el rol');
    } finally {
      setUpdateLoading(null);
    }
  };

  if (!hasRole('ADMIN')) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          No tienes permisos para ver esta página.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Administración de Usuarios
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button onClick={fetchData} color="inherit" size="small" sx={{ ml: 2 }}>
              Reintentar
            </Button>
          </Alert>
        )}
        
        <Paper sx={{ mt: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Box 
                        component="span" 
                        sx={{ 
                          py: 0.5, 
                          px: 1.5, 
                          borderRadius: '4px',
                          bgcolor: user.rol === 'ADMIN' ? 'error.100' : 
                                   user.rol === 'VETERINARIO' ? 'info.100' : 'success.100',
                          color: user.rol === 'ADMIN' ? 'error.700' : 
                                 user.rol === 'VETERINARIO' ? 'info.700' : 'success.700',
                          fontWeight: 'medium',
                          fontSize: '0.875rem'
                        }}
                      >
                        {user.rol}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          displayEmpty
                          value=""
                          onChange={(e: SelectChangeEvent) => {
                            const newRoleId = Number(e.target.value);
                            if (newRoleId) changeRole(user.id, newRoleId);
                          }}
                          disabled={updateLoading === user.id}
                          renderValue={() => "Cambiar rol..."}
                        >
                          {roles.map((role) => (
                            <MenuItem
                              key={role.id}
                              value={role.id.toString()}
                              disabled={role.nombre === user.rol}
                            >
                              {role.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {updateLoading === user.id && <CircularProgress size={20} sx={{ ml: 1 }} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default UserPage;