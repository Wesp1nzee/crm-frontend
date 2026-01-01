import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { CaseListPage } from '../pages/cases/CaseListPage';
import { CaseDetailPage } from '../pages/cases/CaseDetailPage';
import { ClientListPage } from '../pages/clients/ClientListPage';
import { DocumentsPage } from '../pages/documents/DocumentsPage';
import { FinancePage } from '../pages/finance/FinancePage';
import { ReportsPage } from '../pages/reports/ReportsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <CaseListPage /> },
      { path: 'cases', element: <CaseListPage /> },
      { path: 'cases/:id', element: <CaseDetailPage /> },
      { path: 'clients', element: <ClientListPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
]);