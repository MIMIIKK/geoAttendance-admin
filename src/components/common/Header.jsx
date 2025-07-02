import React from 'react';
import { Navbar, Dropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RealtimeSync from './RealtimeSync';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Navbar bg="white" className="border-bottom px-4" expand="md">
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-between">
        {/* Left side: RealtimeSync component */}
        <RealtimeSync />

        {/* Right side: User dropdown */}
        <Dropdown>
          <Dropdown.Toggle variant="link" className="text-decoration-none text-dark">
            <i className="fas fa-user-circle me-2"></i>
            {currentUser?.email}
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
            <Dropdown.Item onClick={() => navigate('/settings')}>
              <i className="fas fa-cog me-2"></i>
              Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;
