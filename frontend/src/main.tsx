// src/main.tsx (corregido)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A7B9D',
      light: '#6a99b5',
      dark: '#34566d',
    },
    secondary: {
      main: '#3A9B7A',
      light: '#5eaf93',
      dark: '#286c55',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);