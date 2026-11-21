import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Fuel } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageShell from '@/components/ui/PageShell';
import NewButton from '@/components/ui/NewButton';
import TripService from '../Trip/services/TripService';
import { getVehicleList } from '../../services/vehicleListService';
import KhataDashboardTab from './components/KhataDashboardTab';
import DriversTab from './components/DriversTab';
import TrucksTab from './components/TrucksTab';
import ErpTripsTab from './components/ErpTripsTab';
import AssignmentsTab from './components/AssignmentsTab';
import AllTransactionsTab from './components/AllTransactionsTab';
import KhataReportsTab from './components/KhataReportsTab';
import AddFuelLogModal from './components/AddFuelLogModal';
import { KhataPill } from './components/khataUi';
import useErpAvailable from './useErpAvailable';
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

const TABS = [
  [TAB_KEYS.dashboard, 'Dashboard'],
  [TAB_KEYS.drivers, 'Drivers'],
  [TAB_KEYS.trucks, 'Vehicles'],
  [TAB_KEYS.trips, 'ERP trips'],
  [TAB_KEYS.assignments, 'Assignments'],
  [TAB_KEYS.all, 'Transactions'],
  [TAB_KEYS.reports, 'Reports'],
];

const KhataLedgerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab = rawTab && TAB_KEYS[rawTab] ? rawTab : TAB_KEYS.dashboard;
  const [activeTab, setActiveTab] = useState(initialTab);

  const { activeBranch } = useActiveBranch();
  // The ERP trips tab and every ERP figure stay hidden until the location has an ERP trip.
  const erpAvailable = useErpAvailable();
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
          getVehicleList(),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setVehicles(Array.isArray(vRes) ? vRes : []);
        setDrivers(dRes?.data || dRes?.results || (Array.isArray(dRes) ? dRes : []));
      } catch {
        // Non-critical; child tabs may re-fetch as needed
      } finally {
        setDropdownsLoading(false);
      }
    };
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (erpAvailable !== false || activeTab !== TAB_KEYS.trips) return;
    setActiveTab(TAB_KEYS.dashboard);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', TAB_KEYS.dashboard);
        return next;
      },
      { replace: true },
    );
  }, [erpAvailable, activeTab, setSearchParams]);

  const tabs = TABS.filter(([key]) => key !== TAB_KEYS.trips || erpAvailable === true);

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
          Khata ledger
          {activeBranch?.name ? <KhataPill>{activeBranch.name}</KhataPill> : null}
        </>
      }
      subtitle="Expenses by driver, vehicle, trip and assignment."
      // Add fuel belongs to the overview. Drivers and Vehicles add fuel per row, and
      // Transactions has its own button beside Add expense.
      actions={
        activeTab === TAB_KEYS.dashboard ? (
          <NewButton
            size="md"
            prependIcon={<Fuel size={16} />}
            onClick={() => setFuelModalOpen(true)}
          >
            Add fuel
          </NewButton>
        ) : null
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="khata-tabs" aria-label="Khata ledger views">
          {tabs.map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="khata-tab">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={TAB_KEYS.dashboard} className="khata-panel">
          <KhataDashboardTab vehicles={vehicles} drivers={drivers} erpAvailable={erpAvailable} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.drivers} className="khata-panel">
          <DriversTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.trucks} className="khata-panel">
          <TrucksTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        {erpAvailable === true ? (
          <TabsContent value={TAB_KEYS.trips} className="khata-panel">
            <ErpTripsTab vehicles={vehicles} drivers={drivers} />
          </TabsContent>
        ) : null}

        <TabsContent value={TAB_KEYS.assignments} className="khata-panel">
          <AssignmentsTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.all} className="khata-panel">
          <AllTransactionsTab vehicles={vehicles} drivers={drivers} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.reports} className="khata-panel">
          <KhataReportsTab vehicles={vehicles} drivers={drivers} erpAvailable={erpAvailable} />
        </TabsContent>
      </Tabs>

      <AddFuelLogModal open={fuelModalOpen} onClose={() => setFuelModalOpen(false)} />
    </PageShell>
  );
};

export default KhataLedgerPage;
