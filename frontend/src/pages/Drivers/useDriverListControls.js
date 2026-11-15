/**
 * Search / filter / paging / export handlers for the Drivers page, split out of
 * DriversPage.jsx to keep it under the file-size rule. The code (and the order of
 * its hooks, which run right after useDriverColumns) is unchanged.
 */
import { useEffect, useMemo } from 'react';
import { DriverService } from './DriverService.js';
import {
  normalizeDriver,
  filterAndSortDrivers,
  countActiveDrivers,
  mapDriverForExport,
} from './driverList.js';

export function useDriverListControls({
  drivers,
  filters,
  tempFilters,
  setTempFilters,
  setFilters,
  searchTerm,
  setSearchInput,
  isFilterDropdownOpen,
  setIsFilterDropdownOpen,
  businessRefId,
  totalPages,
  setCurrentPage,
}) {
  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterDropdownOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      role: '',
      vehicleAssignment: '',
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    setIsFilterDropdownOpen(false);
  };

  const toggleFilterDropdown = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsFilterDropdownOpen((prev) => {
      if (!prev) {
        // When opening dropdown, sync temp filters with current filters
        setTempFilters(filters);
      }
      return !prev;
    });
  };

  // Client-side filtering with search and filters
  const filteredDrivers = useMemo(
    () => filterAndSortDrivers(drivers, filters.vehicleAssignment),
    [drivers, filters.vehicleAssignment],
  );

  // The header count reflects only active employees (deactivated are excluded).
  const activeCount = useMemo(() => countActiveDrivers(filteredDrivers), [filteredDrivers]);

  const exportRows = useMemo(() => filteredDrivers.map(mapDriverForExport), [filteredDrivers]);

  // Export must cover every matching employee, not just the currently-loaded
  // page — pull all pages from the API (capped at the backend's max `limit`
  // of 1000 per request) before applying the same client-side filter as the table.
  const fetchAllEmployeesForExport = async () => {
    const EXPORT_PAGE_LIMIT = 1000;
    const baseParams = { limit: EXPORT_PAGE_LIMIT };
    if (searchTerm) baseParams.search = searchTerm;
    if (filters.role) baseParams.role = filters.role;

    const first = await DriverService.getAllDrivers(businessRefId, { ...baseParams, page: 1 });
    const all = (first.data || []).map(normalizeDriver);
    const exportTotalPages = first.meta?.totalPages || 1;
    for (let page = 2; page <= exportTotalPages; page += 1) {
      const next = await DriverService.getAllDrivers(businessRefId, { ...baseParams, page });
      all.push(...(next.data || []).map(normalizeDriver));
    }
    const withVehicles = await DriverService.withAssignedVehicles(all);
    return filterAndSortDrivers(withVehicles, filters.vehicleAssignment).map(mapDriverForExport);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, setCurrentPage]);

  const paginatedDrivers = filteredDrivers;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Close filter dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target || typeof event.target.closest !== 'function') return;

      // Check if the click is outside the filter dropdown
      if (isFilterDropdownOpen && !event.target.closest('.drivers-filter-container')) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterDropdownOpen, setIsFilterDropdownOpen]);

  return {
    handleSearchChange,
    handleFilterChange,
    handleApplyFilters,
    handleClearFilters,
    toggleFilterDropdown,
    activeCount,
    exportRows,
    fetchAllEmployeesForExport,
    paginatedDrivers,
    handlePageChange,
  };
}
