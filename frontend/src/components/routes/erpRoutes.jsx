import { Route } from 'react-router-dom';
import { lazy } from 'react';
import RedirectWithState from './RedirectWithState';

const PartiesPage = lazy(() => import('../../pages/ErpMasters/PartiesPage.jsx'));
const RatesPage = lazy(() => import('../../pages/ErpMasters/RatesPage.jsx'));
const CallTasksPage = lazy(() => import('../../pages/ErpCallPlanning/CallTasksPage.jsx'));
const CallSchedulesPage = lazy(() => import('../../pages/ErpCallPlanning/CallSchedulesPage.jsx'));
const ApprovalsPage = lazy(() => import('../../pages/ErpApprovals/ApprovalsPage.jsx'));
const BillApprovalsPage = lazy(() => import('../../pages/ErpBillApprovals/BillApprovalsPage.jsx'));
const VendorsPage = lazy(() => import('../../pages/ErpMasters/VendorsPage.jsx'));
const MaterialCompatibilityPage = lazy(
  () => import('../../pages/ErpMasters/MaterialCompatibilityPage.jsx'),
);
const ErpSettingsPage = lazy(() => import('../../pages/ErpMasters/ErpSettingsPage.jsx'));
const ErpTripDetailPage = lazy(() => import('../../pages/ErpTrips/TripDetailPage.jsx'));
const TripWindowsPage = lazy(() => import('../../pages/ErpTrips/TripWindowsPage.jsx'));
const AdvanceMastersPage = lazy(() => import('../../pages/ErpAdvances/AdvanceMastersPage.jsx'));
const InboundEwbPage = lazy(() => import('../../pages/ErpInboundEwb/InboundEwbPage.jsx'));
const ErpHomePage = lazy(() => import('../../pages/ErpHome/ErpHomePage.jsx'));
const ErpPipelinePage = lazy(() => import('../../pages/ErpPipeline/ErpPipelinePage.jsx'));
const ErpBillingPage = lazy(() => import('../../pages/ErpBilling/ErpBillingPage.jsx'));
const ErpPayablesPage = lazy(() => import('../../pages/ErpPayables/ErpPayablesPage.jsx'));
const ErpAccountsPage = lazy(() => import('../../pages/ErpAccounts/ErpAccountsPage.jsx'));
const Account360Page = lazy(() => import('../../pages/ErpAccounts/Account360Page.jsx'));
const DocumentDetailPage = lazy(() => import('../../pages/ErpAccounts/DocumentDetailPage.jsx'));

const erpRoutes = (
  <>
    {/* ISOCL ERP — five workspaces (CRM / Operations / Finance / Approval Center) */}
    <Route path="/erp" element={<ErpHomePage />} />
    <Route path="/erp/pipeline" element={<ErpPipelinePage />} />
    <Route path="/erp/inbound-ewb" element={<InboundEwbPage />} />
    <Route path="/erp/billing" element={<ErpBillingPage />} />
    <Route path="/erp/payables" element={<ErpPayablesPage />} />
    <Route path="/erp/accounts" element={<ErpAccountsPage />} />
    {/* Document detail — the "Source" links in Day Book / Account 360 /
        Registers (documentRoutes.documentPathFor) point here. DocumentDetailPage
        already handles each segment; these routes were simply never wired. */}
    <Route path="/erp/billing/bill/:docId" element={<DocumentDetailPage segment="bill" />} />
    <Route
      path="/erp/payables/purchase-bill/:docId"
      element={<DocumentDetailPage segment="purchase-bill" />}
    />
    <Route
      path="/erp/payables/supplier-invoice/:docId"
      element={<DocumentDetailPage segment="supplier-invoice" />}
    />
    {/* Voucher/document detail — MUST precede the Account 360 catch-all so
        "voucher" is not matched as an accountType. */}
    <Route path="/erp/accounts/voucher/:docId" element={<DocumentDetailPage segment="voucher" />} />
    {/* Account 360 — per-party/vendor/supplier/driver financial detail. */}
    <Route path="/erp/accounts/:accountType/:accountId" element={<Account360Page />} />
    <Route path="/erp/approvals" element={<ApprovalsPage />} />
    <Route path="/erp/bill-approvals" element={<BillApprovalsPage />} />
    <Route path="/erp/call-tasks" element={<CallTasksPage />} />
    <Route path="/erp/call-schedules" element={<CallSchedulesPage />} />
    <Route path="/erp/trips/:tripId" element={<ErpTripDetailPage />} />
    <Route path="/erp/trip-windows" element={<TripWindowsPage />} />

    {/* Masters & Settings */}
    <Route path="/erp/parties" element={<PartiesPage />} />
    <Route path="/erp/rates" element={<RatesPage />} />
    <Route path="/erp/vendors" element={<VendorsPage />} />
    <Route path="/erp/material-compatibility" element={<MaterialCompatibilityPage />} />
    <Route path="/erp/advance-masters" element={<AdvanceMastersPage />} />
    <Route path="/erp/settings" element={<ErpSettingsPage />} />

    {/* Legacy Route Redirects (1 Release Backward Compatibility) */}
    <Route path="/erp/delivery-orders" element={<RedirectWithState to="/erp/pipeline?tab=dos" />} />
    <Route path="/erp/placement" element={<RedirectWithState to="/erp/pipeline?tab=placement" />} />
    <Route
      path="/erp/placement-board"
      element={<RedirectWithState to="/erp/pipeline?tab=placement" />}
    />
    <Route
      path="/erp/placements"
      element={<RedirectWithState to="/erp/pipeline?tab=placement" />}
    />
    <Route path="/erp/trips" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
    <Route path="/erp/advances" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
    <Route path="/erp/consignments" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
    <Route path="/erp/trip-close" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
    <Route path="/erp/pods" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
    <Route path="/erp/unloading" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
    <Route path="/erp/sale-bills" element={<RedirectWithState to="/erp/billing?tab=bills" />} />
    <Route
      path="/erp/outstanding"
      element={<RedirectWithState to="/erp/billing?tab=outstanding" />}
    />
    <Route path="/erp/receipts" element={<RedirectWithState to="/erp/billing?tab=receipts" />} />
    <Route
      path="/erp/vendor-payments"
      element={<RedirectWithState to="/erp/payables?tab=vendor" />}
    />
    <Route
      path="/erp/supplier-payments"
      element={<RedirectWithState to="/erp/payables?tab=supplier" />}
    />
    <Route path="/erp/ledger" element={<RedirectWithState to="/erp/accounts?tab=ledger" />} />
    <Route path="/erp/finance" element={<RedirectWithState to="/erp/accounts?tab=finance" />} />
  </>
);

export default erpRoutes;
