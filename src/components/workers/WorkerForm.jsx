import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  Button, 
  Card, 
  Row, 
  Col, 
  Spinner,
  Alert,
  Modal 
} from 'react-bootstrap';
import { workerService } from '../../services/workerService';
import { siteService } from '../../services/siteService';
import toast from 'react-hot-toast';

const WorkerForm = () => {
  const navigate = useNavigate();
  const { email } = useParams();
  const isEdit = !!email;
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [tempPassword, setTempPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [navigatingAway, setNavigatingAway] = useState(false);

  useEffect(() => {
    loadSites();
    if (isEdit) {
      loadWorker();
    }
  }, [email]);

  const loadSites = async () => {
    try {
      const data = await siteService.getSites();
      setSites(data);
    } catch (err) {
      console.error('Error loading sites:', err);
    }
  };

  const loadWorker = async () => {
    try {
      setLoading(true);
      const worker = await workerService.getWorker(email);
      
      // Set form values
      Object.keys(worker).forEach((key) => {
        setValue(key, worker[key]);
      });
    } catch (err) {
      toast.error('Failed to load worker');
      handleNavigation('/workers');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    setNavigatingAway(true);
    // Small delay to prevent auth context conflicts
    setTimeout(() => {
      navigate(path);
    }, 100);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Get site details
      const selectedSite = sites.find(s => s.id === data.siteId);
      if (selectedSite) {
        data.siteName = selectedSite.siteName;
      }

      if (isEdit) {
        await workerService.updateWorker(email, data);
        toast.success('Worker updated successfully');
        handleNavigation('/workers');
      } else {
        const result = await workerService.createWorker(data);
        
        if (result.tempPassword) {
          setTempPassword(result.tempPassword);
          setShowPasswordModal(true);
        }
        
        toast.success('Worker created successfully');
      }

    } catch (err) {
      toast.error(err.message || 'Failed to save worker');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    handleNavigation('/workers');
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      toast.success('Password copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy password');
    });
  };

  if (loading && isEdit) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (navigatingAway) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Redirecting...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{isEdit ? 'Edit Worker' : 'Add New Worker'}</h3>
        <Button 
          variant="secondary" 
          onClick={() => handleNavigation('/workers')}
          disabled={loading}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to List
        </Button>
      </div>

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    isInvalid={errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    isInvalid={errors.email}
                    disabled={isEdit}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    {...register('phoneNumber')}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned Site *</Form.Label>
                  <Form.Select
                    {...register('siteId', { required: 'Site is required' })}
                    isInvalid={errors.siteId}
                  >
                    <option value="">Select a site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.siteName}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.siteId?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pay Rate ($/hour) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    {...register('payRate', {
                      required: 'Pay rate is required',
                      min: { value: 0, message: 'Pay rate must be positive' }
                    })}
                    isInvalid={errors.payRate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.payRate?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {isEdit && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Check
                      type="switch"
                      label="Active"
                      {...register('isActive')}
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {isEdit ? 'Update Worker' : 'Create Worker'}
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleNavigation('/workers')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Temporary Password Modal */}
      <Modal 
        show={showPasswordModal} 
        onHide={handlePasswordModalClose}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header className="bg-success text-white">
          <Modal.Title>
            <i className="fas fa-user-plus me-2"></i>
            Worker Created Successfully
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success" className="mb-3">
            <i className="fas fa-check-circle me-2"></i>
            Worker account has been created successfully!
          </Alert>
          
          <div className="mb-3">
            <strong>Temporary Password:</strong>
            <div className="mt-2 p-3 bg-light border rounded d-flex justify-content-between align-items-center">
              <code className="text-danger fw-bold" style={{ fontSize: '1.1em' }}>
                {tempPassword}
              </code>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={copyPasswordToClipboard}
              >
                <i className="fas fa-copy me-1"></i>
                Copy
              </Button>
            </div>
          </div>

          <Alert variant="warning" className="mb-0">
            <small>
              <strong>Important:</strong> Please share this password securely with the worker. 
              They should change it upon first login.
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handlePasswordModalClose}>
            <i className="fas fa-check me-2"></i>
            Continue to Worker List
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WorkerForm;