import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const WorkerStats = ({ workers }) => {
  const stats = {
    total: workers.length,
    active: workers.filter(w => w.isActive).length,
    inactive: workers.filter(w => !w.isActive).length,
    avgPayRate: workers.length > 0 
      ? (workers.reduce((sum, w) => sum + parseFloat(w.payRate), 0) / workers.length).toFixed(2)
      : 0
  };

  return (
    <Row className="mb-4">
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0">{stats.total}</h3>
            <small className="text-muted">Total Workers</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0 text-success">{stats.active}</h3>
            <small className="text-muted">Active</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0 text-danger">{stats.inactive}</h3>
            <small className="text-muted">Inactive</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0">${stats.avgPayRate}</h3>
            <small className="text-muted">Avg Pay Rate</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default WorkerStats;