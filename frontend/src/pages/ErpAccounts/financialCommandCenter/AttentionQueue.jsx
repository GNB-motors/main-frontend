import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import ErpTable from '../../../components/Erp/ErpTable';

const QUEUES = [
  { key: 'overdue', label: 'Overdue receivables' },
  { key: 'payables', label: 'Payables due' },
  { key: 'unapplied', label: 'Unapplied receipts' },
];

function AttentionQueue({ queueLink, queue, setQueue, queueColumns, queueRows, queueLoading }) {
  return (
    <section className="acc-section">
      <div className="acc-card-panel acc-attention">
        <div className="acc-attention-head">
          <div className="acc-panel-title">
            <span className="acc-panel-ic acc-panel-ic--attn">
              <AlertTriangle size={15} />
            </span>
            <div>
              <h3>Needs attention</h3>
              <p className="acc-panel-sub">Items requiring follow-up or action</p>
            </div>
          </div>
          <Link to={queueLink} className="acc-viewall">
            View all
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="acc-attention-tabs">
          <div className="erp-tabs acc-subtabs">
            {QUEUES.map((q) => (
              <button
                key={q.key}
                type="button"
                className={`erp-tab ${queue === q.key ? 'active' : ''}`}
                onClick={() => setQueue(q.key)}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <ErpTable
          columns={queueColumns}
          data={queueRows}
          loading={queueLoading}
          emptyText="Nothing needs attention here"
        />
      </div>
    </section>
  );
}

export default AttentionQueue;
