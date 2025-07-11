import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && isAdmin) {
      navigate('/dashboard');
    }
  }, [currentUser, isAdmin, navigate]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      await login(data.email, data.password);
      
      // Navigation will be handled by the useEffect above
      // or by the AuthContext redirect
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Row className="w-100">
          <Col md={6} lg={5} xl={4} className="mx-auto">
            <Card className="login-card shadow-lg border-0">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="logo-container mb-3">
                    <i className="fas fa-map-marker-alt text-primary" style={{ fontSize: '48px' }}></i>
                  </div>
                  <h2 className="mb-2 fw-bold">Company name</h2>
                  <p className="text-muted mb-0">Admin Panel Access</p>
                  <small className="text-muted">Sign in to manage your workforce</small>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="fas fa-envelope me-2"></i>
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="admin@example.com"
                      size="lg"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      isInvalid={errors.email}
                      className="form-control-custom"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">
                      <i className="fas fa-lock me-2"></i>
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      size="lg"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      isInvalid={errors.password}
                      className="form-control-custom"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    className="w-100 login-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>

                  <div className="text-center mt-3">
                    <Link to="/forgot-password" className="text-decoration-none text-primary">
                      <i className="fas fa-key me-1"></i>
                      Forgot Password?
                    </Link>
                  </div>
                </Form>

                <hr className="my-4" />
                
                <div className="text-center">
                  <div className="security-info">
                    <i className="fas fa-shield-alt text-success me-2"></i>
                    <small className="text-muted">
                      Secure admin access only
                    </small>
                  </div>
                  <small className="text-muted d-block mt-2">
                    Only authorized administrators can access this panel
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .login-page {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          position: relative;
        }

        .login-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><polygon fill="rgba(255,255,255,0.05)" points="0,1000 1000,0 1000,1000"/></svg>');
          background-size: cover;
        }

        .login-card {
          position: relative;
          z-index: 1;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
          border-radius: 1rem;
          overflow: hidden;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .logo-container {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .form-control-custom {
          border: 2px solid #e9ecef;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }

        .form-control-custom:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
          transform: translateY(-2px);
        }

        .login-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .security-info {
          display: inline-flex;
          align-items: center;
          background: rgba(25, 135, 84, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 50px;
          border: 1px solid rgba(25, 135, 84, 0.2);
        }

        .form-label {
          color: #495057;
          font-weight: 500;
        }

        .text-primary {
          color: #667eea !important;
        }

        .alert-danger {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.2);
          border-radius: 0.5rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .login-card {
            margin: 1rem;
          }
          
          .logo-container i {
            font-size: 40px !important;
          }
          
          .login-card .card-body {
            padding: 2rem 1.5rem !important;
          }
        }

        @media (max-width: 576px) {
          .login-card {
            margin: 0.5rem;
          }
          
          .login-card .card-body {
            padding: 1.5rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;