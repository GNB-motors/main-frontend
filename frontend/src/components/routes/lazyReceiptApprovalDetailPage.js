import { lazy } from 'react';

// Shared by the superadmin and dashboard route tables.
const ReceiptApprovalDetailPage = lazy(
  () => import('../../pages/Superadmin/components/ReceiptApprovalDetailPage.jsx'),
);

export default ReceiptApprovalDetailPage;
