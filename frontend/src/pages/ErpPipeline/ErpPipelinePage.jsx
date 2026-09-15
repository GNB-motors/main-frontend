import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/Erp/PageShell';
import DeliveryOrdersPage from '../ErpDeliveryOrders/DeliveryOrdersPage';
import PlacementBoardPage from '../ErpPlacement/PlacementBoardPage';
import TripDashboardPage from '../ErpTrips/TripDashboardPage';

const ErpPipelinePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dos');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <PageShell
      title="Operations Pipeline"
      subtitle="Release orders, assign vehicles, and follow every trip to payment"
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Pipeline' }]}
    >
      <div className="erp-toolbar" style={{ marginTop: 0, marginBottom: '20px' }}>
        <div className="erp-tabs" style={{ margin: 0 }}>
          <button
            className={`erp-tab ${activeTab === 'dos' ? 'active' : ''}`}
            onClick={() => handleTabChange('dos')}
          >
            Delivery Orders
          </button>
          <button
            className={`erp-tab ${activeTab === 'placement' ? 'active' : ''}`}
            onClick={() => handleTabChange('placement')}
          >
            Placement Board
          </button>
          <button
            className={`erp-tab ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => handleTabChange('trips')}
          >
            Trip Pipeline
          </button>
        </div>
      </div>

      <div className="erp-hub-panel">
        {activeTab === 'dos' && <DeliveryOrdersPage embedded={true} />}
        {activeTab === 'placement' && <PlacementBoardPage embedded={true} />}
        {activeTab === 'trips' && <TripDashboardPage embedded={true} />}
      </div>
    </PageShell>
  );
};

export default ErpPipelinePage;
