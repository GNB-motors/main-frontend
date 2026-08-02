import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TripService from '../Trip/services/TripService';
import AllTransactionsTab from './components/AllTransactionsTab';
import DriversTab from './components/DriversTab';
import TrucksTab from './components/TrucksTab';
import AssignmentsTab from './components/AssignmentsTab';

const TAB_KEYS = {
  all: 'all',
  drivers: 'drivers',
  trucks: 'trucks',
  assignments: 'assignments',
};

const KhataLedgerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || TAB_KEYS.all);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  useEffect(() => {
    const loadDropdowns = async () => {
      setDropdownsLoading(true);
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setVehicles(vRes?.data || vRes?.results || vRes || []);
        setDrivers(dRes?.data || dRes?.results || dRes || []);
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
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-5 p-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookOpen size={24} style={{ color: 'var(--primary-color, #4f46e5)' }} />
            Khata Ledger
          </h1>
          <p className="text-sm text-muted-foreground">Track all expenses by driver, truck, assignment, or as a flat list</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value={TAB_KEYS.drivers}>Drivers</TabsTrigger>
          <TabsTrigger value={TAB_KEYS.trucks}>Trucks</TabsTrigger>
          <TabsTrigger value={TAB_KEYS.assignments}>Assignments</TabsTrigger>
          <TabsTrigger value={TAB_KEYS.all}>All Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_KEYS.all}>
          <AllTransactionsTab vehicles={vehicles} drivers={drivers} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.drivers}>
          <DriversTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.trucks}>
          <TrucksTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>

        <TabsContent value={TAB_KEYS.assignments}>
          <AssignmentsTab vehicles={vehicles} drivers={drivers} loading={dropdownsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KhataLedgerPage;
