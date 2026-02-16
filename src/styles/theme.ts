import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#4F90FF',
      dark: '#2563EB',
    },
    secondary: {
      main: '#E38AB5',
    },
    background: {
      default: '#F5F7FA',
      paper: 'rgba(255,255,255,0.8)',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter Tight", "SF Pro Display", Inter, Roboto, sans-serif',
    h4: {
      fontWeight: 800,
      fontSize: '2.1rem',
      lineHeight: 1.2,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.6,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F7FA',
          backgroundImage:
            'radial-gradient(70% 55% at 10% 5%, rgba(79,144,255,0.18), transparent 70%), radial-gradient(60% 50% at 92% 8%, rgba(227,138,181,0.18), transparent 70%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(25px)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(145deg, #3B82F6 0%, #2563EB 100%)',
          borderTop: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 10px 24px -12px rgba(37,99,235,0.85), inset 0 1px 0 rgba(255,255,255,0.35)',
          '&:hover': {
            background: 'linear-gradient(145deg, #4B8CFA 0%, #2D6BF0 100%)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.9)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E2E8F0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4F90FF',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 4px rgba(79,144,255,0.12)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          borderBottom: 'none',
        },
        head: {
          fontWeight: 700,
        },
      },
    },
  },
});
