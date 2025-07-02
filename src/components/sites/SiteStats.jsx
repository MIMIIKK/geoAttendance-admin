import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const SiteStats = ({ sites }) => {
  const stats = {
    total: sites.length,
    active: sites.filter(s => s.isActive).length,
    inactive: sites.filter(s => !s.isActive).length,
    totalWorkers: sites.reduce((sum, s) => sum + (s.workerCount || 0), 0)
  };

  return (
    <Row className="mb-4">
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0">{stats.total}</h3>
            <small className="text-muted">Total Sites</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0 text-success">{stats.active}</h3>
            <small className="text-muted">Active Sites</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0 text-danger">{stats.inactive}</h3>
            <small className="text-muted">Inactive Sites</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="mb-0 text-primary">{stats.totalWorkers}</h3>
            <small className="text-muted">Total Workers</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default SiteStats;