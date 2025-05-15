// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';


// Definimos la paleta de colores
const palette = {
  primary: {
    main: '#6366F1', // Color indigo que estabas usando en varios componentes
    light: '#A5B4FC',
    dark: '#4F46E5',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#4A7B9D', // Color azul que has mantenido como primario
    light: '#6A9BC0',
    dark: '#385E79',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8FAFC', // Un fondo ligeramente grisáceo claro
    paper: '#FFFFFF',
  },
  text: {
    primary: '#111827', // Texto oscuro casi negro
    secondary: '#374151', // Gris oscuro para texto secundario
    disabled: '#9CA3AF',
  },
  divider: 'rgba(0, 0, 0, 0.1)',
};

// Crear el tema base
let theme = createTheme({
  palette,
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none', // Elimina el uppercase de los botones
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Bordes redondeados consistentes
  },
  // Personalizar los componentes
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '0.5rem 1.25rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: palette.primary.main,
                borderWidth: 2,
              },
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary.light,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'visible',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F8FAFC',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          color: palette.success.dark,
        },
        standardError: {
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: palette.error.dark,
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          color: palette.warning.dark,
        },
        standardInfo: {
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          color: palette.info.dark,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.2s ease-in-out',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 46,
          height: 28,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 2,
            '&.Mui-checked': {
              transform: 'translateX(18px)',
              '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: palette.primary.main,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            width: 24,
            height: 24,
          },
          '& .MuiSwitch-track': {
            borderRadius: 14,
            opacity: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          '& .MuiTablePagination-select': {
            paddingLeft: 8,
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          animationDuration: '1s',
        },
      },
    }
  },
});

// Hacer las fuentes responsive
theme = responsiveFontSizes(theme);

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