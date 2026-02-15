import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#4F90FF',
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
