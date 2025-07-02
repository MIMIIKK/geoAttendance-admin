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
import { workerService } from '../../services/workerService';
import { format } from 'date-fns';

const WorkerDetail = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    loadWorker();
  }, [email]);

  const loadWorker = async () => {
    try {
      setLoading(true);
      const data = await workerService.getWorker(email);
      setWorker(data);
      // TODO: Load attendance records
    } catch (err) {
      console.error('Error loading worker:', err);
      navigate('/workers');
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

  if (!worker) {
    return null;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Worker Details</h3>
        <div>
          <Button 
            variant="primary" 
            className="me-2"
            onClick={() => navigate(`/workers/${email}/edit`)}
          >
            <i className="fas fa-edit me-2"></i>
            Edit
          </Button>
          <Button 
            variant="secondary"
            onClick={() => navigate('/workers')}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-user-circle fa-5x text-muted"></i>
              </div>
              <h4>{worker.name}</h4>
              <p className="text-muted">{worker.email}</p>
              <Badge bg={worker.isActive ? 'success' : 'danger'}>
                {worker.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h5 className="mb-3">Contact Information</h5>
              <div className="mb-2">
                <small className="text-muted">Email</small>
                <p className="mb-0">{worker.email}</p>
              </div>
              <div className="mb-2">
                <small className="text-muted">Phone</small>
                <p className="mb-0">{worker.phoneNumber || 'Not provided'}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card>
            <Card.Body>
              <Tabs defaultActiveKey="details" className="mb-3">
                <Tab eventKey="details" title="Details">
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Assigned Site</small>
                        <p className="mb-0 fs-5">{worker.siteName || 'Not Assigned'}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Pay Rate</small>
                        <p className="mb-0 fs-5">${worker.payRate}/hour</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Created Date</small>
                        <p className="mb-0">
                          {worker.createdAt ? format(new Date(worker.createdAt), 'PPP') : 'N/A'}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <small className="text-muted">Last Updated</small>
                        <p className="mb-0">
                          {worker.updatedAt ? format(new Date(worker.updatedAt), 'PPP') : 'N/A'}
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="attendance" title="Attendance History">
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Clock In</th>
                          <th>Clock Out</th>
                          <th>Hours</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            No attendance records found
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WorkerDetail;