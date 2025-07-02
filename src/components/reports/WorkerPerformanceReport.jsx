import React from 'react';
import { Table, Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { format } from 'date-fns';

const WorkerPerformanceReport = ({ data, startDate, endDate }) => {
  const totals = data.reduce((acc, worker) => ({
    workers: acc.workers + 1,
    hours: acc.hours + worker.totalHours,
    earnings: acc.earnings + worker.totalEarnings,
    avgPunctuality: acc.avgPunctuality + parseFloat(worker.punctualityRate)
  }), { workers: 0, hours: 0, earnings: 0, avgPunctuality: 0 });

  const avgPunctuality = totals.workers > 0 ? (totals.avgPunctuality / totals.workers).toFixed(1) : 0;

  const getPunctualityBadge = (rate) => {
    const punctuality = parseFloat(rate);
    if (punctuality >= 90) return <Badge bg="success">{rate}%</Badge>;
    if (punctuality >= 75) return <Badge bg="warning">{rate}%</Badge>;
    return <Badge bg="danger">{rate}%</Badge>;
  };

  const getProductivityBadge = (rate) => {
    const productivity = parseFloat(rate);
    if (productivity >= 80) return <Badge bg="success">{rate}%</Badge>;
    if (productivity >= 60) return <Badge bg="warning">{rate}%</Badge>;
    return <Badge bg="danger">{rate}%</Badge>;
  };

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Worker Performance Report</h5>
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
                <h3 className="mb-0">{avgPunctuality}%</h3>
                <small className="text-muted">Avg Punctuality</small>
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
                <th>Worker</th>
                <th>Site</th>
                <th>Days</th>
                <th>Hours</th>
                <th>Avg/Day</th>
                <th>Punctuality</th>
                <th>Productivity</th>
                <th>Last Worked</th>
                <th>Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data.map((worker, index) => (
                <tr key={index}>
                  <td>
                    <div>
                      <strong>{worker.name}</strong>
                      <br />
                      <small className="text-muted">{worker.email}</small>
                    </div>
                  </td>
                  <td>
                    <small>{worker.siteName}</small>
                  </td>
                  <td className="text-center">
                    <Badge bg="primary">{worker.daysWorked}</Badge>
                  </td>
                  <td>{worker.totalHours.toFixed(2)}</td>
                  <td>{worker.averageHoursPerDay}</td>
                  <td>{getPunctualityBadge(worker.punctualityRate)}</td>
                  <td>{getProductivityBadge(worker.productivity)}</td>
                  <td>
                    <small>{worker.lastWorked}</small>
                  </td>
                  <td className="fw-bold">${worker.totalEarnings.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-active fw-bold">
                <td colSpan="2">TOTAL</td>
                <td className="text-center">{totals.workers}</td>
                <td>{totals.hours.toFixed(2)}</td>
                <td>-</td>
                <td>{avgPunctuality}%</td>
                <td>-</td>
                <td>-</td>
                <td>${totals.earnings.toFixed(2)}</td>
              </tr>
            </tfoot>
          </Table>
        </div>

        {/* Performance Insights */}
        <Row className="mt-4">
          <Col md={12}>
            <Card bg="light">
              <Card.Body>
                <h6>Performance Insights:</h6>
                <ul className="mb-0">
                  <li>
                    <strong>Top Performer:</strong> {data[0]?.name} with {data[0]?.totalHours.toFixed(2)} hours
                  </li>
                  <li>
                    <strong>Most Punctual:</strong> {
                      data.reduce((prev, current) => 
                        parseFloat(prev.punctualityRate) > parseFloat(current.punctualityRate) ? prev : current
                      )?.name
                    } ({
                      data.reduce((prev, current) => 
                        parseFloat(prev.punctualityRate) > parseFloat(current.punctualityRate) ? prev : current
                      )?.punctualityRate
                    }% on time)
                  </li>
                  <li>
                    <strong>Average Hours per Worker:</strong> {totals.workers > 0 ? (totals.hours / totals.workers).toFixed(2) : 0} hours
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default WorkerPerformanceReport;