import React from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AttendanceFilters = ({ filters, onFilterChange, workers }) => {
  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handleReset = () => {
    onFilterChange({
      startDate: new Date(),
      endDate: new Date(),
      userEmail: '',
      siteId: ''
    });
  };

  return (
    <Row>
      <Col md={3}>
        <Form.Group>
          <Form.Label>Start Date</Form.Label>
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleChange('startDate', date)}
            className="form-control"
            dateFormat="MMM dd, yyyy"
          />
        </Form.Group>
      </Col>
      
      <Col md={3}>
        <Form.Group>
          <Form.Label>End Date</Form.Label>
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleChange('endDate', date)}
            className="form-control"
            dateFormat="MMM dd, yyyy"
            minDate={filters.startDate}
          />
        </Form.Group>
      </Col>
      
      <Col md={3}>
        <Form.Group>
          <Form.Label>Worker</Form.Label>
          <Form.Select
            value={filters.userEmail}
            onChange={(e) => handleChange('userEmail', e.target.value)}
          >
            <option value="">All Workers</option>
            {workers.map(worker => (
              <option key={worker.email} value={worker.email}>
                {worker.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      
      <Col md={3}>
        <Form.Group>
          <Form.Label>&nbsp;</Form.Label>
          <div>
            <Button
              variant="secondary"
              onClick={handleReset}
              className="w-100"
            >
              Reset Filters
            </Button>
          </div>
        </Form.Group>
      </Col>
    </Row>
  );
};

export default AttendanceFilters;