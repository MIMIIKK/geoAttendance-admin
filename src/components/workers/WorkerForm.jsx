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
  Alert 
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
      navigate('/workers');
    } finally {
      setLoading(false);
    }
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
      } else {
        const result = await workerService.createWorker(data);
        setTempPassword(result.tempPassword);
        toast.success('Worker created successfully');
      }

      if (!isEdit && tempPassword) {
        // Show password in a modal or alert
        alert(`Temporary password for ${data.email}: ${tempPassword}\n\nPlease share this securely with the worker.`);
      }

      navigate('/workers');
    } catch (err) {
      toast.error(err.message || 'Failed to save worker');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{isEdit ? 'Edit Worker' : 'Add New Worker'}</h3>
        <Button variant="secondary" onClick={() => navigate('/workers')}>
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
                onClick={() => navigate('/workers')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default WorkerForm;