import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Badge,
  Table,
  Spinner,
  Tab,
  Tabs
} from 'react-bootstrap';
import { siteService } from '../../services/siteService';
import { workerService } from '../../services/workerService';
import SiteMap from './SiteMap';
import { format } from 'date-fns';

const SiteDetail = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSiteData();
  }, [siteId]);

  const loadSiteData = async () => {
    try {
      setLoading(true);
      
      // Load site details
      const siteData = await siteService.getSite(siteId);
      setSite(siteData);
      
      // Load workers assigned to this site
      const workersData = await workerService.getWorkers({ siteId });
      setWorkers(workersData);
    } catch (err) {
      console.error('Error loading site:', err);
      navigate('/sites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!site) {
    return null;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>{site.siteName}</h3>
          <Badge bg={site.isActive ? 'success' : 'danger'}>
            {site.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div>
          <Button 
            variant="primary" 
            className="me-2"
            onClick={() => navigate(`/sites/${siteId}/edit`)}
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button 
            variant="secondary"
            onClick={() => navigate('/sites')}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Site Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={6}>
                  <div className="mb-3">
                    <small className="text-muted">Site Name</small>
                    <p className="mb-0 fs-5">{site.siteName}</p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="mb-3">
                    <small className="text-muted">Geofence Radius</small>
                    <p className="mb-0 fs-5">{site.radiusInMeters} meters</p>
                  </div>
                </Col>
                <Col sm={12}>
                  <div className="mb-3">
                    <small className="text-muted">Address</small>
                    <p className="mb-0">{site.address}</p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="mb-3">
                    <small className="text-muted">Coordinates</small>
                    <p className="mb-0">
                      {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                    </p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="mb-3">
                    <small className="text-muted">Created Date</small>
                    <p className="mb-0">
                      {site.createdAt ? format(new Date(site.createdAt), 'PPP') : 'N/A'}
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Statistics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={6} className="text-center border-end">
                  <h3 className="mb-0">{workers.length}</h3>
                  <small className="text-muted">Assigned Workers</small>
                </Col>
                <Col xs={6} className="text-center">
                  <h3 className="mb-0">0</h3>
                  <small className="text-muted">Active Today</small>
                </Col>
              </Row>
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
                initialLocation={[site.latitude, site.longitude]}
                radius={site.radiusInMeters}
                height="350px"
                readOnly
                zoom={16}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <Tabs defaultActiveKey="workers" className="mb-3">
            <Tab eventKey="workers" title={`Assigned Workers (${workers.length})`}>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                   <tr>
                     <th>Name</th>
                     <th>Email</th>
                     <th>Phone</th>
                     <th>Pay Rate</th>
                     <th>Status</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {workers.length === 0 ? (
                     <tr>
                       <td colSpan="6" className="text-center py-4">
                         No workers assigned to this site
                       </td>
                     </tr>
                   ) : (
                     workers.map((worker) => (
                       <tr key={worker.id}>
                         <td>{worker.name}</td>
                         <td>{worker.email}</td>
                         <td>{worker.phoneNumber || '-'}</td>
                         <td>${worker.payRate}/hr</td>
                         <td>
                           <Badge bg={worker.isActive ? 'success' : 'danger'}>
                             {worker.isActive ? 'Active' : 'Inactive'}
                           </Badge>
                         </td>
                         <td>
                           <Button
                             variant="outline-primary"
                             size="sm"
                             onClick={() => navigate(`/workers/${worker.email}`)}
                           >
                             View
                           </Button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </Table>
             </div>
           </Tab>

           <Tab eventKey="activity" title="Recent Activity">
             <div className="text-center py-4">
               <i className="fas fa-clock fa-3x text-muted mb-3"></i>
               <p className="text-muted">Activity tracking coming soon</p>
             </div>
           </Tab>
         </Tabs>
       </Card.Body>
     </Card>
   </div>
 );
};

export default SiteDetail;