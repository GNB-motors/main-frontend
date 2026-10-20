import { Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ReceiptApprovalDetailPage from './lazyReceiptApprovalDetailPage';

// Superadmin pages are lazy-loaded: admin-only JSX (incl. the LEMU
// observability page) must not ship in the customer bundle.
const SuperAdminLayout = lazy(() => import('../../pages/Superadmin/SuperAdminLayout.jsx'));
const SuperAdminPage = lazy(() => import('../../pages/Superadmin/SuperAdminPage.jsx'));
const AddUserPage = lazy(() => import('../../pages/Superadmin/components/AddUserPage.jsx'));
const OrgFeatureFlagsPage = lazy(
  () => import('../../pages/Superadmin/components/OrgFeatureFlagsPage.jsx'),
);
const OrgFeatureFlagsDetailPage = lazy(
  () => import('../../pages/Superadmin/components/OrgFeatureFlagsDetailPage.jsx'),
);
const OrgDetailPage = lazy(() => import('../../pages/Superadmin/components/OrgDetailPage.jsx'));
const FleetEdgeHealthPage = lazy(
  () => import('../../pages/Superadmin/components/FleetEdgeHealthPage.jsx'),
);
const FleetEdgeHealthOrgPage = lazy(
  () => import('../../pages/Superadmin/components/FleetEdgeHealthOrgPage.jsx'),
);
const RbacPermissionsPage = lazy(
  () => import('../../pages/Superadmin/components/RbacPermissionsPage.jsx'),
);
const RbacRolesPage = lazy(() => import('../../pages/Superadmin/components/RbacRolesPage.jsx'));
const LemuLogsPage = lazy(() => import('../../pages/Superadmin/components/LemuLogsPage.jsx'));
const LemuGraphPage = lazy(
  () => import('../../pages/Superadmin/components/lemu/graph/LemuGraphPage.jsx'),
);
const WarehousePage = lazy(() => import('../../pages/Superadmin/components/WarehousePage.jsx'));
const WhatsAppAuditPage = lazy(
  () => import('../../pages/Superadmin/components/WhatsAppAuditPage.jsx'),
);
const SuperAdminLearningPage = lazy(
  () => import('../../pages/Superadmin/components/SuperAdminLearningPage.jsx'),
);
const ReceiptApprovalPage = lazy(
  () => import('../../pages/Superadmin/components/ReceiptApprovalPage.jsx'),
);
const AuditTrailPage = lazy(() => import('../../pages/AuditTrail/AuditTrailPage.jsx'));
const SupportTicketsPage = lazy(
  () => import('../../pages/Superadmin/components/supportTickets/SupportTicketsPage.jsx'),
);
const SupportTicketDetailPage = lazy(
  () => import('../../pages/Superadmin/components/supportTickets/SupportTicketDetailPage.jsx'),
);
const EnquiriesPage = lazy(
  () => import('../../pages/Superadmin/components/enquiries/EnquiriesPage.jsx'),
);

const superAdminRoutes = (
  <>
    {/* Super Admin Routes */}
    <Route
      path="/superadmin"
      element={
        <Suspense fallback={<div style={{ padding: 24 }}>Loading admin…</div>}>
          <SuperAdminLayout />
        </Suspense>
      }
    >
      <Route
        index
        element={
          <Suspense fallback={null}>
            <SuperAdminPage />
          </Suspense>
        }
      />
      <Route
        path="add-user"
        element={
          <Suspense fallback={null}>
            <AddUserPage />
          </Suspense>
        }
      />
      <Route
        path="feature-flags"
        element={
          <Suspense fallback={null}>
            <OrgFeatureFlagsPage />
          </Suspense>
        }
      />
      <Route
        path="feature-flags/:orgId"
        element={
          <Suspense fallback={null}>
            <OrgFeatureFlagsDetailPage />
          </Suspense>
        }
      />
      <Route
        path="learning"
        element={
          <Suspense fallback={null}>
            <SuperAdminLearningPage />
          </Suspense>
        }
      />
      <Route
        path="organizations/:id"
        element={
          <Suspense fallback={null}>
            <OrgDetailPage />
          </Suspense>
        }
      />
      <Route
        path="organizations/:orgId/audit-trail"
        element={
          <Suspense fallback={null}>
            <AuditTrailPage />
          </Suspense>
        }
      />
      {/* FleetEdge data-flow health audit */}
      <Route
        path="fleetedge-health"
        element={
          <Suspense fallback={null}>
            <FleetEdgeHealthPage />
          </Suspense>
        }
      />
      <Route
        path="fleetedge-health/:orgId"
        element={
          <Suspense fallback={null}>
            <FleetEdgeHealthOrgPage />
          </Suspense>
        }
      />
      {/* RBAC management */}
      <Route
        path="rbac/permissions"
        element={
          <Suspense fallback={null}>
            <RbacPermissionsPage />
          </Suspense>
        }
      />
      <Route
        path="rbac/roles"
        element={
          <Suspense fallback={null}>
            <RbacRolesPage />
          </Suspense>
        }
      />
      <Route
        path="lemu"
        element={
          <Suspense fallback={null}>
            <LemuLogsPage />
          </Suspense>
        }
      />
      <Route
        path="graph"
        element={
          <Suspense fallback={null}>
            <LemuGraphPage />
          </Suspense>
        }
      />
      <Route
        path="warehouse"
        element={
          <Suspense fallback={null}>
            <WarehousePage />
          </Suspense>
        }
      />
      <Route
        path="whatsapp-audit"
        element={
          <Suspense fallback={<div style={{ padding: 24 }}>Loading WhatsApp Audit…</div>}>
            <WhatsAppAuditPage />
          </Suspense>
        }
      />
      {/* WhatsApp fuel-receipt review + approval */}
      <Route
        path="receipts"
        element={
          <Suspense fallback={null}>
            <ReceiptApprovalPage />
          </Suspense>
        }
      />
      <Route
        path="receipts/:id"
        element={
          <Suspense fallback={null}>
            <ReceiptApprovalDetailPage />
          </Suspense>
        }
      />
      <Route
        path="support-tickets"
        element={
          <Suspense fallback={null}>
            <SupportTicketsPage />
          </Suspense>
        }
      />
      <Route
        path="support-tickets/:id"
        element={
          <Suspense fallback={null}>
            <SupportTicketDetailPage />
          </Suspense>
        }
      />
      <Route
        path="enquiries"
        element={
          <Suspense fallback={null}>
            <EnquiriesPage />
          </Suspense>
        }
      />
    </Route>
  </>
);

export default superAdminRoutes;
