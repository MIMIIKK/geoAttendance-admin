import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Sites from './pages/Sites';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ErrorBoundary from './components/common/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="container mt-4">
          <nav className="mb-4">
            <ul className="nav nav-pills">
              <li className="nav-item"><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
              <li className="nav-item"><Link to="/workers" className="nav-link">Workers</Link></li>
              <li className="nav-item"><Link to="/sites" className="nav-link">Sites</Link></li>
              <li className="nav-item"><Link to="/attendance" className="nav-link">Attendance</Link></li>
              <li className="nav-item"><Link to="/reports" className="nav-link">Reports</Link></li>
              <li className="nav-item"><Link to="/settings" className="nav-link">Settings</Link></li>
            </ul>
          </nav>

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
      </Router>
    </ErrorBoundary>
  );
};

export default App;
