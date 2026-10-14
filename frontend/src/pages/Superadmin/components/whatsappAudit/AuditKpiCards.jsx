import { Clock, MessageSquare, Receipt, Send, TrendingDown, TrendingUp, Users } from 'lucide-react';

const AuditKpiCards = ({ stats }) => (
  <section aria-label="Executive summary metrics" className="wa-audit-kpis">
    {/* Total Bill Processing (Replaces Total Inbound Requests in position 1) */}
    <article className="wa-kpi-card">
      <div className="wa-kpi-card__head">
        <span className="wa-kpi-card__label">Total Bill Processing</span>
        <div className="wa-kpi-card__icon wa-kpi-card__icon--ok">
          <Receipt size={16} />
        </div>
      </div>
      <div className="wa-kpi-card__val" style={{ color: '#16a34a' }}>
        {stats ? (stats.fuelBills?.total ?? 0).toLocaleString() : '—'}
      </div>
      <div className="wa-kpi-card__sub">
        <Clock size={12} />
        <span>
          Avg{' '}
          {stats?.fuelBills?.avgDurationMs
            ? `${(stats.fuelBills.avgDurationMs / 1000).toFixed(1)}s`
            : '—'}{' '}
          • ₹{stats?.fuelBills?.totalAmount?.toLocaleString() || 0} (
          {stats?.fuelBills?.totalLitres || 0} L)
        </span>
      </div>
    </article>

    <article className="wa-kpi-card">
      <div className="wa-kpi-card__head">
        <span className="wa-kpi-card__label">Success Rate</span>
        <div
          className={`wa-kpi-card__icon ${
            (stats?.summary?.successRate ?? 100) >= 90
              ? 'wa-kpi-card__icon--ok'
              : 'wa-kpi-card__icon--warn'
          }`}
        >
          <TrendingUp size={16} />
        </div>
      </div>
      <div
        className="wa-kpi-card__val"
        style={{
          color: (stats?.summary?.successRate ?? 100) >= 90 ? '#16a34a' : '#d97706',
        }}
      >
        {stats ? `${stats.summary?.successRate}%` : '—'}
      </div>
      <div className="wa-kpi-card__sub">
        <span>{stats?.summary?.succeededCount?.toLocaleString() || 0} succeeded requests</span>
      </div>
    </article>

    <article className="wa-kpi-card">
      <div className="wa-kpi-card__head">
        <span className="wa-kpi-card__label">Failed Requests</span>
        <div className="wa-kpi-card__icon wa-kpi-card__icon--fail">
          <TrendingDown size={16} />
        </div>
      </div>
      <div className="wa-kpi-card__val" style={{ color: '#dc2626' }}>
        {stats ? stats.summary?.failedCount?.toLocaleString() : '—'}
      </div>
      <div className="wa-kpi-card__sub">
        <span>
          {stats?.summary?.totalRequests
            ? `${((stats.summary.failedCount / stats.summary.totalRequests) * 100).toFixed(1)}% of total requests`
            : '0% failure rate'}
        </span>
      </div>
    </article>

    <article className="wa-kpi-card">
      <div className="wa-kpi-card__head">
        <span className="wa-kpi-card__label">In-Flight / Queued</span>
        <div className="wa-kpi-card__icon wa-kpi-card__icon--warn">
          <Clock size={16} />
        </div>
      </div>
      <div className="wa-kpi-card__val">
        {stats ? stats.summary?.inFlightCount?.toLocaleString() : '—'}
      </div>
      <div className="wa-kpi-card__sub">
        <span>Processing under worker lock</span>
      </div>
    </article>

    <article className="wa-kpi-card">
      <div className="wa-kpi-card__head">
        <span className="wa-kpi-card__label">Active Users</span>
        <div className="wa-kpi-card__icon wa-kpi-card__icon--info">
          <Users size={16} />
        </div>
      </div>
      <div className="wa-kpi-card__val">
        {stats ? stats.summary?.uniqueUsers?.toLocaleString() : '—'}
      </div>
      <div className="wa-kpi-card__sub">
        <span>Unique WhatsApp senders</span>
      </div>
    </article>

    <article className="wa-kpi-card">
      <div className="wa-kpi-card__head">
        <span className="wa-kpi-card__label">Outbound Delivery</span>
        <div className="wa-kpi-card__icon wa-kpi-card__icon--primary">
          <Send size={16} />
        </div>
      </div>
      <div className="wa-kpi-card__val">{stats ? `${stats.summary?.deliveryRate}%` : '—'}</div>
      <div className="wa-kpi-card__sub">
        <span>
          {stats?.outbound?.delivered || 0} delivered / {stats?.outbound?.failed || 0} failed
        </span>
      </div>
    </article>

    {/* Total Inbound Requests (Moved AFTER Outbound Delivery) */}
    <article className="wa-kpi-card">
      <div className="wa-kpi-card__head">
        <span className="wa-kpi-card__label">Total Inbound Requests</span>
        <div className="wa-kpi-card__icon wa-kpi-card__icon--primary">
          <MessageSquare size={16} />
        </div>
      </div>
      <div className="wa-kpi-card__val">
        {stats ? stats.summary?.totalRequests?.toLocaleString() : '—'}
      </div>
      <div className="wa-kpi-card__sub">
        <Clock size={12} />
        <span>Avg {stats?.summary?.avgDurationMs || 0}ms latency</span>
      </div>
    </article>
  </section>
);

export default AuditKpiCards;
