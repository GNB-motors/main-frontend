import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import STAGE_LABELS from './stageLabels';
import renderTypeBadge from './renderTypeBadge';
import renderStatusBadge from './renderStatusBadge';
import renderMessageContentDetail from './renderMessageContentDetail';
import { relativeTime, formatDate } from './waAuditFormat';

const TraceReliabilitySection = ({ copiedId, copyToClipboard, traceData }) => (
  <div className="wa-under-trace-section">
    <h4 className="wa-under-trace-title">
      <Clock size={16} color="#2563eb" />
      Trace Details &amp; Execution Audit
    </h4>

    <div className="wa-under-trace-cards">
      {/* 1. Time & Processing Latency */}
      <div className="wa-audit-subcard wa-audit-subcard--time">
        <div className="wa-audit-subcard__head">
          <div className="wa-audit-subcard__head-title">
            <Clock size={15} color="#2563eb" />
            <strong>Execution Time &amp; Latency</strong>
          </div>
          <span className="wa-time-relative-tag">{relativeTime(traceData.request.receivedAt)}</span>
        </div>
        <div className="wa-audit-subcard__content">
          <div className="wa-time-grid">
            <div className="wa-time-stat">
              <span className="wa-time-stat__label">Inbound Ingested</span>
              <strong className="wa-time-stat__value">
                {formatDate(traceData.request.receivedAt)}
              </strong>
              <span className="wa-time-stat__sub">Received from Meta Webhook</span>
            </div>
            <div className="wa-time-stat">
              <span className="wa-time-stat__label">Pipeline Latency</span>
              <strong
                className="wa-time-stat__value"
                style={{
                  color: traceData.request.durationMs > 3000 ? '#dc2626' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Activity size={14} />
                {traceData.request.durationMs != null ? `${traceData.request.durationMs}ms` : '—'}
              </strong>
              <span className="wa-time-stat__sub">
                {traceData.request.durationMs != null
                  ? traceData.request.durationMs < 1000
                    ? 'High Performance (<1s)'
                    : traceData.request.durationMs < 3000
                      ? 'Standard SLA (<3s)'
                      : 'Slow Processing SLA'
                  : 'Queue time'}
              </span>
            </div>
            {traceData.outboundMessages?.[0]?.createdAt && (
              <div className="wa-time-stat">
                <span className="wa-time-stat__label">Bot Response Dispatched</span>
                <strong className="wa-time-stat__value">
                  {formatDate(traceData.outboundMessages[0].createdAt)}
                </strong>
                <span className="wa-time-stat__sub">
                  {relativeTime(traceData.outboundMessages[0].createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Message Content */}
      <div className="wa-audit-subcard wa-audit-subcard--message">
        <div className="wa-audit-subcard__head">
          <div className="wa-audit-subcard__head-title">
            <MessageSquare size={15} color="#059669" />
            <strong>Message Content</strong>
          </div>
          <div>{renderTypeBadge(traceData.request.messageType)}</div>
        </div>
        <div className="wa-audit-subcard__content">
          {renderMessageContentDetail(
            traceData.request,
            traceData.draft,
            copiedId,
            copyToClipboard,
          )}
        </div>
      </div>

      {/* 3. Reliability Status */}
      <div className="wa-audit-subcard wa-audit-subcard--status">
        <div className="wa-audit-subcard__head">
          <div className="wa-audit-subcard__head-title">
            <ShieldAlert
              size={15}
              color={
                traceData.request.isFailed || traceData.request.status === 'FAILED'
                  ? '#dc2626'
                  : '#16a34a'
              }
            />
            <strong>Reliability Status</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {renderStatusBadge(traceData.request)}
            {traceData.request.errorStage && (
              <span className="wa-stage-tag" style={{ margin: 0 }}>
                {STAGE_LABELS[traceData.request.errorStage]?.label || traceData.request.errorStage}
              </span>
            )}
          </div>
        </div>
        <div className="wa-audit-subcard__content">
          {/* Failure Diagnosis or Success Banner */}
          {traceData.diagnosis ? (
            <div className="wa-diagnosis-box" style={{ margin: '0 0 12px 0' }}>
              <div className="wa-diagnosis-box__head">
                <AlertCircle size={16} />
                <span>
                  Failure Identified in{' '}
                  {STAGE_LABELS[traceData.diagnosis.stage]?.label || traceData.diagnosis.stage}
                </span>
              </div>
              <div className="wa-diagnosis-box__reason">
                <strong>Root Cause:</strong> {traceData.diagnosis.reason}
              </div>
              <div className="wa-diagnosis-box__action">
                <strong>Suggested Resolution:</strong> {traceData.diagnosis.suggestedAction}
              </div>
            </div>
          ) : (
            <div className="wa-success-box">
              <div className="wa-success-box__head">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>All Reliability Checks Passed</span>
              </div>
              <div className="wa-success-box__desc">
                Inbound request successfully passed Webhook Signature, Identity Verification, OCR
                &amp; Vehicle Resolution with zero errors.
              </div>
            </div>
          )}

          {/* Reliability KPI Breakdown */}
          <div className="wa-reliability-metrics-bar">
            <div className="wa-rel-metric">
              <span className="wa-rel-metric__label">Delivery Attempts</span>
              <strong className="wa-rel-metric__value">{traceData.request.attempts || 1}</strong>
              <span className="wa-rel-metric__sub">
                {traceData.request.attempts > 1 ? 'Re-queued / Retried' : 'Direct execution'}
              </span>
            </div>
            <div className="wa-rel-metric">
              <span className="wa-rel-metric__label">Failure Stage</span>
              <strong
                className="wa-rel-metric__value"
                style={{
                  color: traceData.request.errorStage ? '#dc2626' : '#16a34a',
                }}
              >
                {traceData.request.errorStage || 'NONE (PASSED)'}
              </strong>
              <span className="wa-rel-metric__sub">
                {traceData.request.errorStage ? 'Requires attention' : 'Healthy flow'}
              </span>
            </div>
            <div className="wa-rel-metric">
              <span className="wa-rel-metric__label">Outbound Reply Status</span>
              <strong className="wa-rel-metric__value">
                {traceData.outboundMessages && traceData.outboundMessages.length > 0
                  ? traceData.outboundMessages[0].status
                  : 'Idle / No Outbound'}
              </strong>
              <span className="wa-rel-metric__sub">
                {traceData.outboundMessages && traceData.outboundMessages.length > 0
                  ? `Kind: ${traceData.outboundMessages[0].kind}`
                  : 'No message required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TraceReliabilitySection;
