import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Sidebar from './components/common/Sidebar'; // Adjust path as needed
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Sites from './pages/Sites';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ErrorBoundary from './components/common/ErrorBoundary';

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="app-container">
          {/* Sidebar */}
          <Sidebar collapsed={sidebarCollapsed} />
          
          {/* Main Content Area */}
          <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Mobile Header */}
            <div className="mobile-header d-md-none">
              <button 
                className="btn btn-outline-primary" 
                onClick={toggleSidebar}
                id="sidebarToggle"
              >
                <i className="fas fa-bars"></i>
              </button>
              <span className="ms-2 fw-bold">GeoAttendance</span>
            </div>

            {/* Page Content */}
            <div className="content-wrapper">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/workers/*" element={<Workers />} />
                <Route path="/sites/*" element={<Sites />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          <div 
            className={`sidebar-overlay ${sidebarCollapsed ? 'show' : ''} d-md-none`}
            onClick={toggleSidebar}
          ></div>
        </div>

        <style jsx>{`
          .app-container {
            display: flex;
            width: 100%;
            height: 100vh;
            min-height: 100vh;
          }

          .main-content {
            flex: 1;
            width: 100%;
            height: 100vh;
            margin-left: 240px;
            overflow-x: hidden;
            overflow-y: auto;
            background-color: #f8f9fa;
            transition: margin-left 0.3s ease-in-out;
          }

          .main-content.sidebar-collapsed {
            margin-left: 0;
          }

          .mobile-header {
            background-color: white;
            padding: 1rem;
            border-bottom: 1px solid #dee2e6;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
            display: flex;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 999;
          }

          .content-wrapper {
            padding: 2rem;
            min-height: calc(100vh - 70px);
          }

          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1040;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease-in-out;
            backdrop-filter: blur(3px);
          }

          .sidebar-overlay.show {
            opacity: 1;
            visibility: visible;
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            
            .content-wrapper {
              padding: 1rem;
            }
            
            .mobile-header {
              display: flex !important;
            }
          }

          @media (max-width: 576px) {
            .content-wrapper {
              padding: 0.5rem;
            }
          }

          /* Desktop Layout */
          @media (min-width: 769px) {
            .mobile-header {
              display: none;
            }
            
            .sidebar-overlay {
              display: none;
            }
          }

          /* Print Styles */
          @media print {
            .main-content {
              margin-left: 0 !important;
            }
            
            .mobile-header {
              display: none !important;
            }
          }
        `}</style>
      </Router>
    </ErrorBoundary>
  );
};

export default App;