import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RegisterTable from '../../components/Erp/RegisterTable';
import REGISTERS from './registerConfigs';
import '../../styles/erp-accounts-workspace.css';

/**
 * Registers hub — browsable history for everything the financial module writes.
 *
 * Nine registers; all nine endpoints already existed. Several of the client
 * methods were dead code that nothing called, which is why recording a receipt
 * or posting a fleet expense used to end in a toast and nothing else.
 */
const RegistersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState(() => searchParams.get('sub') || REGISTERS[0].key);

  useEffect(() => {
    const sub = searchParams.get('sub');
    if (sub && sub !== active && REGISTERS.some((r) => r.key === sub)) setActive(sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const select = (key) => {
    setActive(key);
    const next = new URLSearchParams(searchParams);
    next.set('sub', key);
    // Drop the previous register's list state so filters don't leak across tabs.
    ['page', 'q', 'from', 'to'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  const config = REGISTERS.find((r) => r.key === active) || REGISTERS[0];

  return (
    <div className="acc-workspace">
      <div className="erp-tabs" style={{ flexWrap: 'wrap', marginBottom: 18 }}>
        {REGISTERS.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`erp-tab ${active === r.key ? 'active' : ''}`}
            onClick={() => select(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* key forces a fresh hook state per register — otherwise the previous
          register's page/filters would carry into the next one. */}
      <RegisterTable key={config.key} config={config} />
    </div>
  );
};

export default RegistersPage;
