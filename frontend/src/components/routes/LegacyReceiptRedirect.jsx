import { Navigate, useParams } from 'react-router-dom';

function LegacyReceiptRedirect() {
  const { id } = useParams();
  return <Navigate to={`/approvals/whatsapp/${id}`} replace />;
}

export default LegacyReceiptRedirect;
