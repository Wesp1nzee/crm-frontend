import {
  Box,
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  IconButton,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowBack, NavigateNext } from "@mui/icons-material";
import { useCase, useCases } from "../hooks/useCases";
import { useClient } from "../hooks/useClients";
export function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cases } = useCases();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const caseIdIndex = pathnames.findIndex(
    (segment, index) => segment === "cases" && index < pathnames.length - 1,
  );
  const caseId = caseIdIndex >= 0 ? pathnames[caseIdIndex + 1] : "";
  const { data: caseDetails } = useCase(caseId);

  const clientIdIndex = pathnames.findIndex(
    (segment, index) => segment === "clients" && index < pathnames.length - 1,
  );
  const clientId = clientIdIndex >= 0 ? pathnames[clientIdIndex + 1] : "";
  const { data: client } = useClient(clientId);

  const breadcrumbsSegments =
    pathnames[0] === "crm" ? pathnames.slice(1) : pathnames;

  const getBreadcrumbName = (segment: string, index: number) => {
    if (segment === "cases") return "Дела";
    if (segment === "clients") return "Клиенты";
    if (segment === "documents") return "Документы";
    if (segment === "finance") return "Финансы";
    if (segment === "reports") return "Отчеты";
    if (segment === "experts") return "Эксперты";

    const originalIndex = index + (pathnames[0] === "crm" ? 1 : 0);
    if (originalIndex > 0 && pathnames[originalIndex - 1] === "cases") {
      if (segment === caseId && caseDetails?.case?.case_number) {
        return `Дело ${caseDetails.case.case_number}`;
      }

      const case_ = cases?.data?.find((c) => c.id === segment);
      return case_ ? `Дело ${case_.case_number}` : `Дело`;
    }

    if (originalIndex > 0 && pathnames[originalIndex - 1] === "clients") {
      return client?.name ?? "Клиент";
    }

    return `Страница ${segment}`;
  };

  if (breadcrumbsSegments.length === 0) {
    return (
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <MuiBreadcrumbs separator={<NavigateNext fontSize="small" />}>
          <Link component={RouterLink} to="/crm" color="inherit">
            Главная
          </Link>
        </MuiBreadcrumbs>
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" mb={2}>
      <IconButton onClick={() => navigate(-1)} size="small" sx={{ mr: 1 }}>
        <ArrowBack />
      </IconButton>

      <MuiBreadcrumbs separator={<NavigateNext fontSize="small" />}>
        <Link component={RouterLink} to="/crm" color="inherit">
          Главная
        </Link>

        {breadcrumbsSegments.map((segment, index) => {
          const fullPath = `/crm/${breadcrumbsSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === breadcrumbsSegments.length - 1;
          const name = getBreadcrumbName(segment, index);

          return isLast ? (
            <Typography key={fullPath} color="text.primary">
              {name}
            </Typography>
          ) : (
            <Link
              key={fullPath}
              component={RouterLink}
              to={fullPath}
              color="inherit"
            >
              {name}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}
