import React from 'react';
import { Table, Card, Row, Col, Badge } from 'react-bootstrap';
import { format } from 'date-fns';

const SiteAnalysisReport = ({ data, startDate, endDate }) => {
  const totals = data.reduce((acc, site) => ({
    sites: acc.sites + 1,
    workers: acc.workers + site.totalWorkers,
    hours: acc.hours + site.totalHours,
    earnings: acc.earnings + site.totalEarnings
  }), { sites: 0, workers: 0, hours: 0, earnings: 0 });

  const getUtilizationBadge = (utilization) => {
    const rate = parseFloat(utilization);
    if (rate >= 80) return <Badge bg="success">{utilization}%</Badge>;
    if (rate >= 60) return <Badge bg="warning">{utilization}%</Badge>;
    return <Badge bg="danger">{utilization}%</Badge>;
  };

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Site Analysis Report</h5>
          <span className="text-muted">
            {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
          </span>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col md={3}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h3 className="mb-0">{totals.sites}</h3>
                <small className="text-muted">Active Sites</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h3 className="mb-0">{totals.workers}</h3>
                <small className="text-muted">Total Workers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h3 className="mb-0">{totals.hours.toFixed(1)}</h3>
                <small className="text-muted">Total Hours</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h3 className="mb-0">${totals.earnings.toFixed(2)}</h3>
                <small className="text-muted">Total Earnings</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="table-responsive">
          <Table hover>
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Address</th>
                <th>Workers</th>
                <th>Total Hours</th>
                <th>Avg Hours/Day</th>
                <th>Utilization</th>
                <th>Peak Day</th>
                <th>Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data.map((site, index) => (
                <tr key={index}>
                  <td>
                    <strong>{site.siteName}</strong>
                    <br />
                    <small className="text-muted">{site.siteId}</small>
                  </td>
                  <td>
                    <small>{site.address}</small>
                  </td>
                  <td className="text-center">
                    <Badge bg="primary">{site.totalWorkers}</Badge>
                  </td>
                  <td>{site.totalHours.toFixed(2)}</td>
                  <td>{site.averageHoursPerDay}</td>
                  <td>{getUtilizationBadge(site.utilization)}</td>
                  <td>
                    <small>
                      {site.peakDay.date}
                      <br />
                      <Badge bg="info" size="sm">
                        {site.peakDay.workers} workers
                      </Badge>
                    </small>
                  </td>
                  <td className="fw-bold">${site.totalEarnings.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-active fw-bold">
                <td colSpan="2">TOTAL</td>
                <td className="text-center">{totals.workers}</td>
                <td>{totals.hours.toFixed(2)}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>${totals.earnings.toFixed(2)}</td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SiteAnalysisReport;