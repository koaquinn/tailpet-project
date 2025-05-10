// src/pages/auth/PaginaLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, AccountCircle, VpnKey } from '@mui/icons-material';
import './PaginaLogin.css';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPage: React.FC = () => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/dashboard';
  
  // Si el usuario ya está autenticado, redirige a la página principal
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas
    if (!credential) {
      setError('Ingrese su nombre de usuario o email');
      return;
    }
    
    if (!password) {
      setError('Ingrese su contraseña');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(credential, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          'Error al iniciar sesión. Verifica tus credenciales.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="login-container">
      <Paper className="login-card" elevation={3}>
        <Typography variant="h4" className="login-title">
          TailPet
        </Typography>
        <Typography variant="h6" className="login-subtitle">
          Sistema de Gestión Veterinaria
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <TextField
            fullWidth
            id="credential"
            label="Email o nombre de usuario"
            variant="outlined"
            margin="normal"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            disabled={isLoading}
            autoFocus
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle />
                </InputAdornment>
              ),
            }}
            className="login-input"
          />

          <TextField
            fullWidth
            id="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <VpnKey />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            className="login-input"
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            className="login-button"
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Iniciando sesión...
              </>
            ) : 'Iniciar sesión'}
          </Button>
        </form>
        
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          © TailPet {new Date().getFullYear()}
        </Typography>
      </Paper>
    </div>
  );
};

export default LoginPage;