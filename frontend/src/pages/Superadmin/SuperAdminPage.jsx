import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Car, Activity } from 'lucide-react';
import './SuperAdminPage.css';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    // Check if user is actually a super admin
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'SUPER_ADMIN') {
      // Redirect non-super-admins away
      navigate('/overview');
      return;
    }

    // Load user data from localStorage
    setUser({
      firstName: localStorage.getItem('user_firstName') || '',
      lastName: localStorage.getItem('user_lastName') || '',
      email: localStorage.getItem('user_email') || '',
      role: localStorage.getItem('user_role') || '',
      userId: localStorage.getItem('user_id') || '',
    });
  }, [navigate]);

  return (
    <div className="super-admin-dashboard">
      <div className="welcome-section">
        <h1>Welcome back, {user.firstName}! 👋</h1>
        <p>Here's what's happening with your system today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value">-</h3>
            <span className="stat-change positive">Coming soon</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Organizations</p>
            <h3 className="stat-value">-</h3>
            <span className="stat-change positive">Coming soon</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Car size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Vehicles</p>
            <h3 className="stat-value">-</h3>
            <span className="stat-change positive">Coming soon</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">System Status</p>
            <h3 className="stat-value">Active</h3>
            <span className="stat-change positive">All systems operational</span>
          </div>
        </div>
      </div>

      <div className="content-section">
        <div className="content-card">
          <h3>Recent Activity</h3>
          <div className="empty-state">
            <p>No recent activity to display</p>
          </div>
        </div>

        <div className="content-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button 
              className="action-btn"
              onClick={() => navigate('/superadmin/add-user')}
            >
              <Users size={20} />
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
