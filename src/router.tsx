import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import {
  Dashboard,
  VendorList,
  StallList,
  ScheduleCalendar,
  ConflictCenter,
  RevenuePage,
} from '@/pages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'vendors', element: <VendorList /> },
      { path: 'stalls', element: <StallList /> },
      { path: 'schedule', element: <ScheduleCalendar /> },
      { path: 'conflicts', element: <ConflictCenter /> },
      { path: 'revenue', element: <RevenuePage /> },
    ],
  },
]);

export default router;
