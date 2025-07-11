import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Nav, Button, Modal } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext'; // ADD THIS IMPORT
import './Sidebar.css';

const Sidebar = ({ collapsed, onClose }) => {
  const location = useLocation();
  const { logout, currentUser } = useAuth(); // USE AUTH CONTEXT
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const menuItems = [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/workers', icon: 'fas fa-users', label: 'Workers' },
    { path: '/sites', icon: 'fas fa-map-marker-alt', label: 'Sites' },
    { path: '/attendance', icon: 'fas fa-clock', label: 'Attendance' },
    { path: '/reports', icon: 'fas fa-chart-bar', label: 'Reports' },
    { path: '/settings', icon: 'fas fa-cog', label: 'Settings' },
  ];

  // PROPER LOGOUT FUNCTION USING AUTH CONTEXT
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true);
      console.log('Starting logout process...');
      
      // Use AuthContext logout function
      await logout();
      
      console.log('Logout successful, closing sidebar...');
      // Close sidebar on mobile after logout
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) onClose();
  };

  // Get user display info
  const userDisplayName = currentUser?.displayName || 
                         currentUser?.email?.split('@')[0] || 
                         'Admin User';
  const userEmail = currentUser?.email || 'admin@example.com';

  return (
    <>
      <div className={`sidebar ${collapsed ? 'show' : ''}`}>
        {/* Mobile Header with Close Button */}
        <div className="sidebar-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">
                <i className="fas fa-map-marker-alt me-2"></i>
                Company Name
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
              <div className="user-name" title={userDisplayName}>
                {userDisplayName}
              </div>
              <div className="user-role" title={userEmail}>
                Administrator
              </div>
            </div>
          </div>
          
          {/* Logout Button - UPDATED TO USE AUTH CONTEXT */}
          <Button
            variant="outline-light"
            size="sm"
            className="logout-btn w-100 mt-2"
            onClick={handleLogoutClick} // CHANGED FROM handleLogout
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Logging out...
              </>
            ) : (
              <>
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal 
        show={showLogoutModal} 
        onHide={handleLogoutCancel}
        backdrop="static"
        keyboard={false}
        centered
        size="sm"
      >
        <Modal.Header className="bg-danger text-white border-0">
          <Modal.Title className="d-flex align-items-center">
            <i className="fas fa-sign-out-alt me-2"></i>
            Confirm Logout
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <div className="user-avatar-large mb-3 mx-auto">
              <i className="fas fa-user-circle text-muted" style={{ fontSize: '3rem' }}></i>
            </div>
            <h6 className="mb-2">{userDisplayName}</h6>
            <small className="text-muted">{userEmail}</small>
          </div>
          
          <p className="mb-4 text-muted">
            Are you sure you want to logout? You'll need to sign in again to access the admin panel.
          </p>
          
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="outline-secondary"
              onClick={handleLogoutCancel}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Logging out...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </>
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Sidebar;