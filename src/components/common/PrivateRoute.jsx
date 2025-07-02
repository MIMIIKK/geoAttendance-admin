// components/common/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const PrivateRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <div className="mt-3">
            <h5 className="text-muted">Loading...</h5>
            <p className="text-muted">Verifying authentication</p>
          </div>
        </div>
        
        <style jsx>{`
          .spinner-border-lg {
            width: 3rem;
            height: 3rem;
          }
        `}</style>
      </Container>
    );
  }

  // Check if user is authenticated and has admin privileges
  if (!currentUser) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // User is authenticated but not an admin
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="mb-4">
            <i className="fas fa-shield-alt text-danger" style={{ fontSize: '4rem' }}></i>
          </div>
          <h3 className="text-danger mb-3">Access Denied</h3>
          <p className="text-muted mb-4">
            You don't have administrator privileges to access this panel.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Go Back
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => {
                // You can call logout here if needed
                window.location.href = '/login';
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Sign Out
            </button>
          </div>
        </div>
      </Container>
    );
  }

  // User is authenticated and is an admin
  return children;
};

export default PrivateRoute;