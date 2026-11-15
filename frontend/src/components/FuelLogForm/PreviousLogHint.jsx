import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatDateTimeIST } from '../../utils/dateUtils';

/** Under the vehicle picker: the selected vehicle's last fuel log, if any. */
const PreviousLogHint = ({ loadingLastOdometer, lastOdometer }) => (
  <div
    style={{
      fontSize: '13px',
      color: '#64748b',
      marginTop: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    {loadingLastOdometer ? (
      <>
        <Loader2 size={13} className="spinning" /> Fetching prior logs...
      </>
    ) : lastOdometer ? (
      <span>
        <b>Previous Log:</b> {lastOdometer.fillingType?.replace('_', ' ')} fill{' '}
        {lastOdometer.odometerReading != null
          ? `at ${lastOdometer.odometerReading} km`
          : '(No odometer recorded)'}{' '}
        <span style={{ color: '#94a3b8' }}>({formatDateTimeIST(lastOdometer.refuelTime)} IST)</span>
      </span>
    ) : (
      <span>No prior fuel logs found. Starting fresh.</span>
    )}
  </div>
);

export default PreviousLogHint;
