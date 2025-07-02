import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';

// Context and Authentication
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Components
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Sites from './pages/Sites';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ErrorBoundary from './components/common/ErrorBoundary';

// Main App Layout Component
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main Content Area */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={closeSidebar}
      ></div>

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
          
          .main-content.sidebar-open {
            overflow: hidden;
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
          
          .main-content.sidebar-open {
            overflow: auto;
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
          
          .sidebar-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/*" 
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              } 
            />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#dc3545',
                  color: '#fff',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;