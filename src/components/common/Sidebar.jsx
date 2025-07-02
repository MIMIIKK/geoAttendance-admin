import React from 'react';
import { NavLink } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/workers', icon: 'fas fa-users', label: 'Workers' },
    { path: '/sites', icon: 'fas fa-map-marker-alt', label: 'Sites' },
    { path: '/attendance', icon: 'fas fa-clock', label: 'Attendance' },
    { path: '/reports', icon: 'fas fa-chart-bar', label: 'Reports' },
    { path: '/settings', icon: 'fas fa-cog', label: 'Settings' },
  ];

  return (
    <div className="sidebar bg-dark">
      <div className="sidebar-header p-3 text-white">
        <h5 className="mb-0">
          <i className="fas fa-map-marker-alt me-2"></i>
          GeoAttendance
        </h5>
      </div>
      
      <Nav className="flex-column">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={NavLink}
            to={item.path}
            className="text-white-50 py-3 px-4"
          >
            <i className={`${item.icon} me-3`}></i>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};

export default Sidebar;