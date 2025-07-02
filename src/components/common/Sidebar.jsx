import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import './Sidebar.css';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/workers', icon: 'fas fa-users', label: 'Workers' },
    { path: '/sites', icon: 'fas fa-map-marker-alt', label: 'Sites' },
    { path: '/attendance', icon: 'fas fa-clock', label: 'Attendance' },
    { path: '/reports', icon: 'fas fa-chart-bar', label: 'Reports' },
    { path: '/settings', icon: 'fas fa-cog', label: 'Settings' },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'show' : ''}`}>
      <div className="sidebar-header">
        <h5 className="mb-0">
          <i className="fas fa-map-marker-alt me-2"></i>
          GeoAttendance
        </h5>
        <small className="text-white-50 d-block">Admin Panel</small>
      </div>
      
      <Nav className="flex-column sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Nav.Link
              key={item.path}
              as={NavLink}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <i className={`${item.icon} sidebar-icon`}></i>
              <span className="sidebar-text">{item.label}</span>
              {isActive && <div className="active-indicator"></div>}
            </Nav.Link>
          );
        })}
      </Nav>

      {/* User Section */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="user-details">
            <div className="user-name">Admin User</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;