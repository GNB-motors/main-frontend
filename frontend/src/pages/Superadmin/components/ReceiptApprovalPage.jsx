import React from 'react';
import ReceiptApprovalDrawer from './ReceiptApprovalDrawer';
import ImagePreviewModal from '../../Trip/components/ImagePreviewModal';
import useReceiptInbox from './receipts/useReceiptInbox';
import ReceiptInboxHeader from './receipts/ReceiptInboxHeader';
import ReceiptKpiGrid from './receipts/ReceiptKpiGrid';
import ReceiptToolbar from './receipts/ReceiptToolbar';
import ReceiptTable from './receipts/ReceiptTable';
import BulkActionBar from './receipts/BulkActionBar';
import BulkApproveModal from './receipts/BulkApproveModal';
import BulkRejectModal from './receipts/BulkRejectModal';
import './ReceiptApproval.css';

/**
 * `embedded`: rendered as the WhatsApp tab of the Approvals page, which owns the title.
 * `onCounts` gets the status counts whenever they load, for the tab's pending badge.
 */
const ReceiptApprovalPage = ({ embedded = false, onCounts } = {}) => {
  const {
    activeDrawerId,
    anomalyFilter,
    basePath,
    bulkBusy,
    bulkRejectReason,
    clearSelection,
    counts,
    currentDrawerIndex,
    dateFilter,
    error,
    fetchData,
    filtered,
    handleBulkApprove,
    handleBulkReject,
    handleRetryRow,
    handleSingleApprove,
    isSuperadminRoute,
    kpis,
    listMeta,
    loading,
    navigate,
    odoFilter,
    page,
    pageSize,
    previewImage,
    query,
    refreshing,
    rowErrors,
    selectableItems,
    selectedIds,
    setActiveDrawerId,
    setAnomalyFilter,
    setBulkRejectReason,
    setDateFilter,
    setOdoFilter,
    setPage,
    setPageSize,
    setPreviewImage,
    setQuery,
    setShowBulkApproveModal,
    setShowBulkRejectModal,
    setSortDirection,
    setStatus,
    showBulkApproveModal,
    showBulkRejectModal,
    sortDirection,
    status,
    toggleSelectAll,
    toggleSelectOne,
    totalSelectedAmount,
    totalSelectedLitres,
  } = useReceiptInbox({ onCounts });

  const toggleSort = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const isAllSelected =
    selectableItems.length > 0 && selectableItems.every((d) => selectedIds.has(d._id));
  const isSomeSelected = selectableItems.some((d) => selectedIds.has(d._id)) && !isAllSelected;

  // Active filters count
  const activeFiltersCount = [
    dateFilter !== 'ALL',
    odoFilter !== 'ALL',
    anomalyFilter !== 'ALL',
    query.trim().length > 0,
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setDateFilter('ALL');
    setOdoFilter('ALL');
    setAnomalyFilter('ALL');
    setQuery('');
  };

  const handlePrevDrawer = () => {
    if (currentDrawerIndex > 0) {
      setActiveDrawerId(filtered[currentDrawerIndex - 1]._id);
    }
  };

  const handleNextDrawer = () => {
    if (currentDrawerIndex >= 0 && currentDrawerIndex < filtered.length - 1) {
      setActiveDrawerId(filtered[currentDrawerIndex + 1]._id);
    }
  };

  return (
    <div className={`ra-page${embedded ? ' ra-page--embedded' : ''}`}>
      {/* ── Top Header & Atmospheric Bar ── */}
      <ReceiptInboxHeader
        isSuperadminRoute={isSuperadminRoute}
        navigate={navigate}
        embedded={embedded}
        refreshing={refreshing}
        fetchData={fetchData}
      />

      {/* ── Top KPI Stat Cards (Supercrazy Wow Factor) ── */}
      <ReceiptKpiGrid
        loading={loading}
        kpis={kpis}
        odoFilter={odoFilter}
        setOdoFilter={setOdoFilter}
        error={error}
        onRetry={() => fetchData(true)}
      />

      {/* ── Advanced Control Bar: Tabs, Filters, Search ── */}
      <ReceiptToolbar
        status={status}
        setStatus={setStatus}
        counts={counts}
        loading={loading}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        odoFilter={odoFilter}
        setOdoFilter={setOdoFilter}
        anomalyFilter={anomalyFilter}
        setAnomalyFilter={setAnomalyFilter}
        activeFiltersCount={activeFiltersCount}
        resetAllFilters={resetAllFilters}
        query={query}
        setQuery={setQuery}
      />

      {/* A failed load says so in the table itself, never as an empty inbox. */}

      {/* ── Main Receipts Table ── */}      <ReceiptTable
        selectedIds={selectedIds}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        toggleSelectAll={toggleSelectAll}
        selectableItems={selectableItems}
        toggleSort={toggleSort}
        sortDirection={sortDirection}
        loading={loading}
        filtered={filtered}
        activeFiltersCount={activeFiltersCount}
        status={status}
        resetAllFilters={resetAllFilters}
        setActiveDrawerId={setActiveDrawerId}
        toggleSelectOne={toggleSelectOne}
        setPreviewImage={setPreviewImage}
        handleSingleApprove={handleSingleApprove}
        listMeta={listMeta}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        error={error}
        onRetry={() => fetchData(true)}
        rowErrors={rowErrors}
        onRetryRow={handleRetryRow}
      />

      {/* ── Floating Bulk Action Bar (Both Approve and Reject) ── */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          totalSelectedLitres={totalSelectedLitres}
          totalSelectedAmount={totalSelectedAmount}
          clearSelection={clearSelection}
          bulkBusy={bulkBusy}
          setShowBulkRejectModal={setShowBulkRejectModal}
          setShowBulkApproveModal={setShowBulkApproveModal}
        />
      )}

      {/* ── Bulk Approve Modal ── */}
      {showBulkApproveModal && (
        <BulkApproveModal
          bulkBusy={bulkBusy}
          setShowBulkApproveModal={setShowBulkApproveModal}
          selectedIds={selectedIds}
          totalSelectedLitres={totalSelectedLitres}
          totalSelectedAmount={totalSelectedAmount}
          handleBulkApprove={handleBulkApprove}
        />
      )}

      {/* ── Bulk Reject Modal (solves "no reject button only approve") ── */}
      {showBulkRejectModal && (
        <BulkRejectModal
          bulkBusy={bulkBusy}
          setShowBulkRejectModal={setShowBulkRejectModal}
          selectedIds={selectedIds}
          totalSelectedAmount={totalSelectedAmount}
          bulkRejectReason={bulkRejectReason}
          setBulkRejectReason={setBulkRejectReason}
          handleBulkReject={handleBulkReject}
        />
      )}

      {/* ── Slideover Quick Review Drawer ── */}
      <ReceiptApprovalDrawer
        draftId={activeDrawerId}
        isOpen={Boolean(activeDrawerId)}
        onClose={() => setActiveDrawerId(null)}
        onUpdated={() => fetchData(true)}
        onPrev={handlePrevDrawer}
        onNext={handleNextDrawer}
        hasPrev={currentDrawerIndex > 0}
        hasNext={currentDrawerIndex >= 0 && currentDrawerIndex < filtered.length - 1}
        basePath={basePath}
        navigate={navigate}
      />

      {/* ── High-Res Image Preview Modal ── */}
      {previewImage && (
        <ImagePreviewModal
          imageSrc={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default ReceiptApprovalPage;
