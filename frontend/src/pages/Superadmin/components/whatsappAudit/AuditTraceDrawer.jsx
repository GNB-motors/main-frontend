import { RefreshCw, RotateCcw, Truck, X } from 'lucide-react';
import TraceOutboundLogs from './TraceOutboundLogs';
import TraceReliabilitySection from './TraceReliabilitySection';
import TracePipeline from './TracePipeline';
import TraceFuelBillCard from './TraceFuelBillCard';
import TraceVehicleBanner from './TraceVehicleBanner';

const AuditTraceDrawer = ({
  closeTrace,
  copiedId,
  copyToClipboard,
  handleReplay,
  replayingWamid,
  traceData,
  traceLoading,
}) => (
  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the backdrop is also the drawer's landmark; outside click closes it, Escape is its keyboard path
  <aside
    aria-label="Request lifecycle trace details"
    className="wa-drawer-backdrop"
    onClick={closeTrace}
    onKeyDown={(e) => e.key === 'Escape' && closeTrace()}
  >
    <section className="wa-drawer" role="presentation" onClick={(e) => e.stopPropagation()}>
      <div className="wa-drawer__header">
        <h2>
          <Truck size={20} color="#4f46e5" />
          Vehicle &amp; Interaction Audit Trace
        </h2>
        <button className="wa-drawer__close" onClick={closeTrace} aria-label="Close trace drawer">
          <X size={18} />
        </button>
      </div>

      <div className="wa-drawer__body">
        {traceLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw
              size={24}
              className="wa-spin"
              style={{ margin: '0 auto 12px', display: 'block', color: 'var(--wa-primary)' }}
            />
            Retrieving request lifecycle trace…
          </div>
        ) : traceData ? (
          <>
            {/* Vehicle & Driver Identity Banner */}
            <TraceVehicleBanner
              copiedId={copiedId}
              copyToClipboard={copyToClipboard}
              traceData={traceData}
            />

            {/* Fuel Bill Processing Details Card (if draft or OCR details exist) */}
            {(traceData.draft || traceData.request.messageType === 'image') && (
              <TraceFuelBillCard traceData={traceData} />
            )}

            {/* Pipeline Stepper (The Trace) */}
            <TracePipeline traceData={traceData} />

            {/* Under the Trace: Time, Message Content & Reliability Status */}
            <TraceReliabilitySection
              copiedId={copiedId}
              copyToClipboard={copyToClipboard}
              traceData={traceData}
            />

            {/* Outbound Delivery Logs */}
            {traceData.outboundMessages && traceData.outboundMessages.length > 0 && (
              <TraceOutboundLogs traceData={traceData} />
            )}

            {/* Raw Inbound Payload Viewer */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700 }}>
                Raw Meta Payload
              </h4>
              <pre className="wa-json-viewer">
                {JSON.stringify(traceData.request.payload, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div className="wa-empty-state">No trace details available.</div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="wa-drawer__footer">
        <button className="wa-audit-btn" onClick={closeTrace}>
          Close
        </button>
        {traceData?.request && (
          <button
            className="wa-audit-btn wa-audit-btn--primary"
            onClick={() => handleReplay(traceData.request.wamid)}
            disabled={replayingWamid === traceData.request.wamid}
          >
            <RotateCcw
              size={14}
              className={replayingWamid === traceData.request.wamid ? 'wa-spin' : ''}
            />
            <span>Replay Message</span>
          </button>
        )}
      </div>
    </section>
  </aside>
);

export default AuditTraceDrawer;
