import { Box, Breadcrumbs as MuiBreadcrumbs, Link, Typography, IconButton } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowBack, NavigateNext } from '@mui/icons-material';
import { useCases } from '../hooks/useCases';
import { useClients } from '../hooks/useClients';

export function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cases } = useCases();
  const { data: clients } = useClients();

  const pathnames = location.pathname.split('/').filter(x => x);
  
  const getBreadcrumbName = (segment: string, index: number) => {
    if (segment === 'cases') return 'Дела';
    if (segment === 'clients') return 'Клиенты';
    if (segment === 'documents') return 'Документы';
    if (segment === 'finance') return 'Финансы';
    if (segment === 'reports') return 'Отчеты';
    
    // Если это ID дела
    if (pathnames[index - 1] === 'cases') {
      const case_ = cases?.data?.find(c => c.id === segment);
      return case_ ? `Дело ${case_.case_number}` : `Дело ${segment}`;
    }
    
    return segment;
  };

  if (pathnames.length === 0) return null;

  return (
    <Box display="flex" alignItems="center" mb={2}>
      <IconButton 
        onClick={() => navigate(-1)} 
        size="small" 
        sx={{ mr: 1 }}
      >
        <ArrowBack />
      </IconButton>
      
      <MuiBreadcrumbs separator={<NavigateNext fontSize="small" />}>
        <Link component={RouterLink} to="/" color="inherit">
          Главная
        </Link>
        {pathnames.map((segment, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const name = getBreadcrumbName(segment, index);

          return isLast ? (
            <Typography key={to} color="text.primary">
              {name}
            </Typography>
          ) : (
            <Link key={to} component={RouterLink} to={to} color="inherit">
              {name}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}