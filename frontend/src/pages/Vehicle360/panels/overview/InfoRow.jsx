import { formatDateIST } from '../../../../utils/dateUtils';

/** dt/dd pair for InfoCard — a component so key can attach outside the fragment. */
export default function InfoRow({ docType, expiryDate }) {
  return (
    <>
      <dt>{docType}</dt>
      <dd>{expiryDate ? formatDateIST(expiryDate) : 'no expiry recorded'}</dd>
    </>
  );
}
