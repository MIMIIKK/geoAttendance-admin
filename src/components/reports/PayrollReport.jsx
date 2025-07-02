import React from 'react';
import { Table, Card, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';

const PayrollReport = ({ data, startDate, endDate }) => {
  const totals = data.reduce((acc, worker) => ({
    hours: acc.hours + worker.totalHours,
    earnings: acc.earnings + worker.totalEarnings,
    workers: acc.workers + 1
  }), { hours: 0, earnings: 0, workers: 0 });

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Payroll Report</h5>
          <span className="text-muted">
            {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
          </span>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col md={4}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h3 className="mb-0">{totals.workers}</h3>
                <small className="text-muted">Total Workers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h3 className="mb-0">{totals.hours.toFixed(1)}</h3>
                <small className="text-muted">Total Hours</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card bg="light">
              <Card.Body className="text-center">
                <h3 className="mb-0">${totals.earnings.toFixed(2)}</h3>
                <small className="text-muted">Total Payroll</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="table-responsive">
          <Table hover>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Pay Rate</th>
                <th>Days Worked</th>
                <th>Total Hours</th>
                <th>Avg Hours/Day</th>
                <th>Total Pay</th>
              </tr>
            </thead>
            <tbody>
              {data.map((worker, index) => (
                <tr key={index}>
                  <td>{worker.name}</td>
                  <td>{worker.email}</td>
                  <td>${worker.payRate.toFixed(2)}/hr</td>
                  <td>{worker.daysWorked}</td>
                  <td>{worker.totalHours.toFixed(2)}</td>
                  <td>{worker.avgHoursPerDay}</td>
                  <td className="fw-bold">${worker.totalEarnings.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-active fw-bold">
                <td colSpan="4">TOTAL</td>
                <td>{totals.hours.toFixed(2)}</td>
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

export default PayrollReport;