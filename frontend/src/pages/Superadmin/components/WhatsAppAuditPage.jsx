import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WhatsAppAuditService } from './WhatsAppAuditService';
import './WhatsAppAuditPage.css';
import logger from '../../../utils/logger';
import { AlertCircle } from 'lucide-react';
import AuditTraceDrawer from './whatsappAudit/AuditTraceDrawer';
import AuditRequestsSection from './whatsappAudit/AuditRequestsSection';
import AuditAnalytics from './whatsappAudit/AuditAnalytics';
import AuditKpiCards from './whatsappAudit/AuditKpiCards';
import AuditHeader from './whatsappAudit/AuditHeader';
import AuditToast from './whatsappAudit/AuditToast';

const WhatsAppAuditPage = () => {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [organizations, setOrganizations] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [orgFilter, setOrgFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Trace Drawer
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [traceData, setTraceData] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [replayingWamid, setReplayingWamid] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const searchDebounceRef = useRef(null);

  const dateParams = useMemo(() => {
    if (timeRange === 'all') return {};
    const now = new Date();
    let start = new Date();
    if (timeRange === '24h') {
      start.setHours(now.getHours() - 24);
    } else if (timeRange === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      start.setDate(now.getDate() - 30);
    }
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }, [timeRange]);

  // Load organizations on mount
  useEffect(() => {
    WhatsAppAuditService.getOrganizations()
      .then((orgs) => setOrganizations(Array.isArray(orgs) ? orgs : []))
      .catch((err) => logger.warn('WhatsAppAuditPage', 'Could not load organizations', err));
  }, []);

  // Fetch stats and requests
  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const statsParams = {
          ...dateParams,
          ...(orgFilter ? { orgId: orgFilter } : {}),
        };

        const requestsParams = {
          ...dateParams,
          ...(orgFilter ? { orgId: orgFilter } : {}),
          ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
          ...(stageFilter !== 'ALL' ? { stage: stageFilter } : {}),
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
          page: pagination.page,
          limit: pagination.limit,
        };

        const [statsRes, reqsRes] = await Promise.all([
          WhatsAppAuditService.getStats(statsParams),
          WhatsAppAuditService.getRequests(requestsParams),
        ]);

        setStats(statsRes);
        setRequests(reqsRes.items || []);
        setPagination(reqsRes.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      } catch (err) {
        logger.warn('WhatsAppAuditPage', '[WhatsApp Audit] Failed to load data', err);
        setError(err.message || 'Failed to load reliability audit data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      dateParams,
      orgFilter,
      statusFilter,
      stageFilter,
      searchQuery,
      pagination.page,
      pagination.limit,
    ],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefreshInterval) return;
    const intervalId = setInterval(() => {
      fetchData(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchData]);

  // Open Trace Drawer
  const openTrace = async (id) => {
    setSelectedRequestId(id);
    setTraceLoading(true);
    try {
      const trace = await WhatsAppAuditService.getRequestTrace(id);
      setTraceData(trace);
    } catch (err) {
      logger.warn('WhatsAppAuditPage', 'Failed to load trace', err);
      setToastMessage({ type: 'error', text: err.message || 'Failed to load request trace.' });
    } finally {
      setTraceLoading(false);
    }
  };

  const closeTrace = () => {
    setSelectedRequestId(null);
    setTraceData(null);
  };

  // Replay message
  const handleReplay = async (wamid) => {
    if (!wamid) return;
    setReplayingWamid(wamid);
    try {
      await WhatsAppAuditService.replayMessage(wamid);
      setToastMessage({
        type: 'success',
        text: `Message re-queued successfully (${wamid.slice(-8)})`,
      });
      // Refresh requests list after a short delay
      setTimeout(() => fetchData(true), 1500);
      if (selectedRequestId) {
        setTimeout(() => openTrace(selectedRequestId), 1500);
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to replay message' });
    } finally {
      setReplayingWamid(null);
    }
  };

  // Quick copy phone
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <main className="wa-audit-page" id="wa-reliability-audit">
      {/* Toast */}
      {toastMessage && <AuditToast setToastMessage={setToastMessage} toastMessage={toastMessage} />}

      {/* Top Header */}
      <AuditHeader
        autoRefreshInterval={autoRefreshInterval}
        fetchData={fetchData}
        loading={loading}
        orgFilter={orgFilter}
        organizations={organizations}
        refreshing={refreshing}
        setAutoRefreshInterval={setAutoRefreshInterval}
        setOrgFilter={setOrgFilter}
        setPagination={setPagination}
        setTimeRange={setTimeRange}
        timeRange={timeRange}
      />

      {/* Error alert banner */}
      {error && (
        <section
          aria-label="Error announcement"
          className="wa-diagnosis-box"
          style={{ marginBottom: 20 }}
        >
          <div className="wa-diagnosis-box__head">
            <AlertCircle size={18} />
            <span>Observability Error</span>
          </div>
          <div className="wa-diagnosis-box__reason">{error}</div>
        </section>
      )}

      {/* Executive KPI Cards */}
      <AuditKpiCards stats={stats} />

      {/* Analytics Split: Failure Stage Breakdown & Top Errors */}
      <AuditAnalytics
        setPagination={setPagination}
        setStageFilter={setStageFilter}
        setStatusFilter={setStatusFilter}
        stats={stats}
      />

      {/* Stream & Requests Table */}
      <AuditRequestsSection
        copiedId={copiedId}
        copyToClipboard={copyToClipboard}
        handleReplay={handleReplay}
        loading={loading}
        openTrace={openTrace}
        pagination={pagination}
        replayingWamid={replayingWamid}
        requests={requests}
        searchDebounceRef={searchDebounceRef}
        searchQuery={searchQuery}
        setPagination={setPagination}
        setSearchQuery={setSearchQuery}
        setStageFilter={setStageFilter}
        setStatusFilter={setStatusFilter}
        stageFilter={stageFilter}
        statusFilter={statusFilter}
      />

      {/* Slide-Out Request Trace Drawer */}
      {selectedRequestId && (
        <AuditTraceDrawer
          closeTrace={closeTrace}
          copiedId={copiedId}
          copyToClipboard={copyToClipboard}
          handleReplay={handleReplay}
          replayingWamid={replayingWamid}
          traceData={traceData}
          traceLoading={traceLoading}
        />
      )}
    </main>
  );
};

export default WhatsAppAuditPage;
