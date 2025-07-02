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
import { siteService } from '../../services/siteService';
import SiteMap from './SiteMap';
import toast from 'react-hot-toast';

const SiteForm = () => {
  const navigate = useNavigate();
  const { siteId } = useParams();
  const isEdit = !!siteId;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      radiusInMeters: 15
    }
  });

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (isEdit) {
      loadSite();
    }
  }, [siteId]);

  const loadSite = async () => {
    try {
      setLoading(true);
      const site = await siteService.getSite(siteId);

      Object.keys(site).forEach((key) => {
        setValue(key, site[key]);
      });

      if (site.latitude && site.longitude) {
        setLocation({ latitude: site.latitude, longitude: site.longitude });
        setMapKey(prev => prev + 1);
      }
    } catch (err) {
      toast.error('Failed to load site');
      navigate('/sites');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!location?.latitude || !location?.longitude) {
      toast.error('Please select a location on the map');
      return;
    }

    try {
      setLoading(true);

      const siteData = {
        ...data,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusInMeters: parseFloat(data.radiusInMeters)
      };

      if (isEdit) {
        await siteService.updateSite(siteId, siteData);
        toast.success('Site updated successfully');
      } else {
        await siteService.createSite(siteData);
        toast.success('Site created successfully');
      }

      navigate('/sites');
    } catch (err) {
      toast.error(err.message || 'Failed to save site');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
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
        <h3>{isEdit ? 'Edit Site' : 'Add New Site'}</h3>
        <Button variant="secondary" onClick={() => navigate('/sites')}>
          <i className="fas fa-arrow-left me-2"></i>
          Back to List
        </Button>
      </div>

      <Row>
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Site Details</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3">
                  <Form.Label>Site Name *</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('siteName', { required: 'Site name is required' })}
                    isInvalid={errors.siteName}
                    placeholder="e.g., Construction Site 42"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.siteName?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    {...register('address', { required: 'Address is required' })}
                    isInvalid={errors.address}
                    placeholder="Enter full address"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.address?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Geofence Radius (meters) *</Form.Label>
                      <Form.Control
                        type="number"
                        {...register('radiusInMeters', {
                          required: 'Radius is required',
                          min: { value: 5, message: 'Minimum radius is 5 meters' },
                          max: { value: 100, message: 'Maximum radius is 100 meters' }
                        })}
                        isInvalid={errors.radiusInMeters}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.radiusInMeters?.message}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Workers must be within this radius to clock in/out
                      </Form.Text>
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
                        {isEdit ? 'Update Site' : 'Create Site'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/sites')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Site Location</h5>
            </Card.Header>
            <Card.Body>
              <SiteMap
                key={mapKey}
                initialLocation={location}
                radius={parseFloat(watch('radiusInMeters') || 15)}
                onLocationChange={handleLocationChange}
                height="400px"
              />
              {!location && (
                <Alert variant="info" className="mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Click on the map to set the site location
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SiteForm;
