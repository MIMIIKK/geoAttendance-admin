import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const AttendanceStats = ({ stats }) => {
  return (
    <Row className="mb-4">
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="mb-0">{stats.totalRecords}</h4>
            <small className="text-muted">Total Records</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="mb-0">{stats.totalHours.toFixed(1)}</h4>
            <small className="text-muted">Total Hours</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="mb-0">${stats.totalEarnings.toFixed(2)}</h4>
            <small className="text-muted">Total Earnings</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="mb-0">{stats.uniqueWorkers}</h4>
            <small className="text-muted">Active Workers</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default AttendanceStats;