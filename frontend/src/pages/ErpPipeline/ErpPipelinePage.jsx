import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/Erp/PageHeader';
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
    <div className="erp-page">
      <PageHeader
        title="Operations Pipeline"
        subtitle="Manage Delivery Orders, Placement Board, and Active Trips"
        breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Pipeline' }]}
      />

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
            Active Trips
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {activeTab === 'dos' && <DeliveryOrdersPage embedded={true} />}
        {activeTab === 'placement' && <PlacementBoardPage embedded={true} />}
        {activeTab === 'trips' && <TripDashboardPage embedded={true} />}
      </div>
    </div>
  );
};

export default ErpPipelinePage;
