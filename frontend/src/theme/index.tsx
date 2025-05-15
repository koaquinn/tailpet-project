// src/theme/index.tsx
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Define tu paleta de colores personalizada para TailPet
const palette = {
  primary: {
    main: '#6366F1', // Color indigo que ya estás usando
    dark: '#4F46E5',
    light: '#A5B4FC',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#4A7B9D', // Color azul que he visto en algunos de tus componentes
    dark: '#385E79',
    light: '#6A9BC0',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
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
};

// Crear el tema base
let theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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
  },
});

// Hacer las fuentes responsive
theme = responsiveFontSizes(theme);

export default theme;