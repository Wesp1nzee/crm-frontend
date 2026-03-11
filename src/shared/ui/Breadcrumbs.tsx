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

const segmentTitles: Record<string, string> = {
  cases: "Дела",
  clients: "Клиенты",
  documents: "Документы",
  finance: "Финансы",
  reports: "Отчеты",
  experts: "Эксперты",
  settings: "Настройки",
  profile: "Профиль",
  mail: "Почта",
  inbox: "Входящие",
  sent: "Отправленные",
  drafts: "Черновики",
  spam: "Спам",
  trash: "Корзина",
  archive: "Архив",
};

const looksLikeTechnicalId = (segment: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment) ||
  /^[0-9a-f]{24}$/i.test(segment) ||
  /^\d{8,}$/.test(segment);

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

  const breadcrumbsSegments = pathnames[0] === "crm" ? pathnames.slice(1) : pathnames;

  const getBreadcrumbName = (segment: string, index: number) => {
    const originalIndex = index + (pathnames[0] === "crm" ? 1 : 0);
    const prevSegment = originalIndex > 0 ? pathnames[originalIndex - 1] : "";

    if (segmentTitles[segment]) {
      return segmentTitles[segment];
    }

    if (prevSegment === "cases") {
      if (segment === caseId && caseDetails?.case?.case_number) {
        return `Дело ${caseDetails.case.case_number}`;
      }
      const case_ = cases?.data?.find((c) => c.id === segment);
      return case_ ? `Дело ${case_.case_number}` : "Дело";
    }

    if (prevSegment === "clients") {
      return client?.name ?? "Клиент";
    }

    if (prevSegment === "mail" || ["inbox", "sent", "drafts", "spam", "trash", "archive"].includes(prevSegment)) {
      return "Письмо";
    }

    if (looksLikeTechnicalId(segment)) {
      return "Карточка";
    }

    return "Страница";
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
