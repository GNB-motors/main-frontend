import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
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
import PageShell from '@/components/ui/PageShell';
import NewButton from '@/components/ui/NewButton';
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
import './KhataLedger.css';

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
    <PageShell
      className="khata-ledger"
      title={
        <>
          Khata Ledger
          {activeBranch?.name && (
            <Badge
              variant="outline"
              className="ml-2 inline-flex items-center gap-1 text-xs font-normal"
            >
              <Building2 size={12} />
              {activeBranch.name}
            </Badge>
          )}
        </>
      }
      subtitle="Track expenses by driver, vehicle, assignment, or transaction."
      actions={
        <NewButton
          size="md"
          prependIcon={<Fuel size={16} />}
          onClick={() => setFuelModalOpen(true)}
        >
          Add Fuel
        </NewButton>
      }
    >
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList aria-label="Khata ledger views">
            <TabsTrigger value={TAB_KEYS.dashboard} className="gap-1.5">
              <LayoutDashboard size={14} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value={TAB_KEYS.drivers} className="gap-1.5">
              <Users size={14} />
              Drivers
            </TabsTrigger>
            <TabsTrigger value={TAB_KEYS.trucks} className="gap-1.5">
              <Truck size={14} />
              Vehicles
            </TabsTrigger>
            <TabsTrigger value={TAB_KEYS.trips} className="gap-1.5">
              <Route size={14} />
              ERP Trips
            </TabsTrigger>
            <TabsTrigger value={TAB_KEYS.assignments} className="gap-1.5">
              <ClipboardList size={14} />
              Assignments
            </TabsTrigger>
            <TabsTrigger value={TAB_KEYS.all} className="gap-1.5">
              <Receipt size={14} />
              Transactions
            </TabsTrigger>
            <TabsTrigger value={TAB_KEYS.reports} className="gap-1.5">
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
    </PageShell>
  );
};

export default KhataLedgerPage;
