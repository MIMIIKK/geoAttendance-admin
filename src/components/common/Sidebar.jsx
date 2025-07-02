import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Nav, Button } from 'react-bootstrap';
import './Sidebar.css';

const Sidebar = ({ collapsed, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/workers', icon: 'fas fa-users', label: 'Workers' },
    { path: '/sites', icon: 'fas fa-map-marker-alt', label: 'Sites' },
    { path: '/attendance', icon: 'fas fa-clock', label: 'Attendance' },
    { path: '/reports', icon: 'fas fa-chart-bar', label: 'Reports' },
    { path: '/settings', icon: 'fas fa-cog', label: 'Settings' },
  ];

  const handleLogout = () => {
    // Add your logout logic here
    // Example: Clear localStorage, call logout API, etc.
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Close sidebar on mobile after logout
    if (onClose) onClose();
    
    // Redirect to login or home page
    navigate('/login'); // Adjust path as needed
    
    // You can also show a confirmation dialog
    // if (window.confirm('Are you sure you want to logout?')) {
    //   // logout logic
    // }
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) onClose();
  };

  return (
    <div className={`sidebar ${collapsed ? 'show' : ''}`}>
      {/* Mobile Header with Close Button */}
      <div className="sidebar-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="fas fa-map-marker-alt me-2"></i>
              GeoAttendance
            </h5>
            <small className="text-white-50 d-block">Admin Panel</small>
          </div>
          {/* Close button for mobile */}
          <button 
            className="btn btn-sm btn-outline-light d-md-none sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
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
              onClick={handleLinkClick}
            >
              <i className={`${item.icon} sidebar-icon`}></i>
              <span className="sidebar-text">{item.label}</span>
              {isActive && <div className="active-indicator"></div>}
            </Nav.Link>
          );
        })}
      </Nav>

      {/* User Section with Logout */}
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
        
        {/* Logout Button */}
        <Button
          variant="outline-light"
          size="sm"
          className="logout-btn w-100 mt-2"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt me-2"></i>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;