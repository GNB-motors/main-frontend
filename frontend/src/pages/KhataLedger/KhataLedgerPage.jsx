import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Fuel,
  LayoutDashboard,
  Users,
  Truck,
  Route,
  ClipboardList,
  Receipt,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TripService from '../Trip/services/TripService';
import KhataDashboardTab from './components/KhataDashboardTab';
import DriversTab from './components/DriversTab';
import TrucksTab from './components/TrucksTab';
import ErpTripsTab from './components/ErpTripsTab';
import AssignmentsTab from './components/AssignmentsTab';
import AllTransactionsTab from './components/AllTransactionsTab';
import KhataReportsTab from './components/KhataReportsTab';
import AddFuelLogModal from './components/AddFuelLogModal';
import { useActiveBranch } from '../../contexts/BranchContext';

const TAB_KEYS = {
  dashboard: 'dashboard',
  drivers: 'drivers',
  trucks: 'trucks',
  trips: 'trips',
  assignments: 'assignments',
  all: 'all',
  reports: 'reports',
};

const KhataLedgerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab = rawTab && TAB_KEYS[rawTab] ? rawTab : TAB_KEYS.dashboard;
  const [activeTab, setActiveTab] = useState(initialTab);

  const { activeBranch } = useActiveBranch();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);

  // Sync state if URL changes externally
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && TAB_KEYS[currentTab] && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    const loadDropdowns = async () => {
      setDropdownsLoading(true);
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setVehicles(vRes?.data || vRes?.results || (Array.isArray(vRes) ? vRes : []));
        setDrivers(dRes?.data || dRes?.results || (Array.isArray(dRes) ? dRes : []));
      } catch {
        // Non-critical; child tabs may re-fetch as needed
      } finally {
        setDropdownsLoading(false);
      }
    };
    loadDropdowns();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  return (
    <div className="space-y-5 p-1">
      {/* Header with Title and Branch Indicator */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookOpen size={24} style={{ color: 'var(--primary-color, #4f46e5)' }} />
            Khata Ledger
          </h1>
          <p className="text-sm text-muted-foreground">Track all expenses by driver, truck, assignment, or as a flat list</p>
        </div>
        <button
          onClick={() => setFuelModalOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: 'var(--primary-color, #4f46e5)' }}
        >
          <Fuel size={18} />
          Add Fuel
        </button>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
            <TabsTrigger
              value={TAB_KEYS.dashboard}
              className="flex items-center gap-1.5 px-3 text-xs font-medium"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value={TAB_KEYS.drivers}
              className="flex items-center gap-1.5 px-3 text-xs font-medium"
            >
              <Users size={14} />
              Drivers
            </TabsTrigger>
            <TabsTrigger
              value={TAB_KEYS.trucks}
              className="flex items-center gap-1.5 px-3 text-xs font-medium"
            >
              <Truck size={14} />
              Vehicles
            </TabsTrigger>
            <TabsTrigger
              value={TAB_KEYS.trips}
              className="flex items-center gap-1.5 px-3 text-xs font-medium"
            >
              <Route size={14} />
              ERP Trips
            </TabsTrigger>
            <TabsTrigger
              value={TAB_KEYS.assignments}
              className="flex items-center gap-1.5 px-3 text-xs font-medium"
            >
              <ClipboardList size={14} />
              Assignments
            </TabsTrigger>
            <TabsTrigger
              value={TAB_KEYS.all}
              className="flex items-center gap-1.5 px-3 text-xs font-medium"
            >
              <Receipt size={14} />
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value={TAB_KEYS.reports}
              className="flex items-center gap-1.5 px-3 text-xs font-medium"
            >
              <FileSpreadsheet size={14} />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value={TAB_KEYS.dashboard} className="mt-4 focus-visible:outline-none">
          <KhataDashboardTab vehicles={vehicles} drivers={drivers} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.drivers} className="mt-4 focus-visible:outline-none">
          <DriversTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.trucks} className="mt-4 focus-visible:outline-none">
          <TrucksTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.trips} className="mt-4 focus-visible:outline-none">
          <ErpTripsTab vehicles={vehicles} drivers={drivers} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.assignments} className="mt-4 focus-visible:outline-none">
          <AssignmentsTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.all} className="mt-4 focus-visible:outline-none">
          <AllTransactionsTab vehicles={vehicles} drivers={drivers} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.reports} className="mt-4 focus-visible:outline-none">
          <KhataReportsTab vehicles={vehicles} drivers={drivers} />
        </TabsContent>
      </Tabs>

      {/* Quick Add Fuel Modal */}
      <AddFuelLogModal open={fuelModalOpen} onClose={() => setFuelModalOpen(false)} />
    </div>
  );
};

export default KhataLedgerPage;
