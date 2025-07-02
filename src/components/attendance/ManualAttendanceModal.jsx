import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { siteService } from '../../services/siteService';
import toast from 'react-hot-toast';

const ManualAttendanceModal = ({ show, onHide, onSave, workers }) => {
  const [formData, setFormData] = useState({
    userEmail: '',
    siteId: '',
    clockInDate: new Date(),
    clockInTime: '09:00',
    clockOutTime: '17:00',
    isLocationVerified: true,
    notes: ''
  });
  const [sites, setSites] = useState([]);

  React.useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const data = await siteService.getSites();
      setSites(data);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.userEmail) {
      toast.error('Please select a worker');
      return;
    }

    // Combine date and time
    const clockInDateTime = new Date(formData.clockInDate);
    const [inHours, inMinutes] = formData.clockInTime.split(':');
    clockInDateTime.setHours(parseInt(inHours), parseInt(inMinutes));

    const clockOutDateTime = new Date(formData.clockInDate);
    const [outHours, outMinutes] = formData.clockOutTime.split(':');
    clockOutDateTime.setHours(parseInt(outHours), parseInt(outMinutes));

    // Calculate duration
    const durationMs = clockOutDateTime - clockInDateTime;
    const totalHours = durationMs / (1000 * 60 * 60);

    // Get worker pay rate
    const worker = workers.find(w => w.email === formData.userEmail);
    const payAmount = totalHours * (worker?.payRate || 0);

    const attendanceData = {
      userEmail: formData.userEmail,
      siteId: formData.siteId,
      clockInTime: clockInDateTime,
      clockOutTime: clockOutDateTime,
      totalHours,
      payAmount,
      isLocationVerified: formData.isLocationVerified,
      notes: formData.notes
    };

    onSave(attendanceData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Manual Attendance Entry</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Worker *</Form.Label>
                <Form.Select
                  value={formData.userEmail}
                  onChange={(e) => handleChange('userEmail', e.target.value)}
                  required
                >
                  <option value="">Select Worker</option>
                  {workers.map(worker => (
                    <option key={worker.email} value={worker.email}>
                      {worker.name} - ${worker.payRate}/hr
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Site *</Form.Label>
                <Form.Select
                  value={formData.siteId}
                  onChange={(e) => handleChange('siteId', e.target.value)}
                  required
                >
                  <option value="">Select Site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.siteName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Date *</Form.Label>
                <DatePicker
                  selected={formData.clockInDate}
                  onChange={(date) => handleChange('clockInDate', date)}
                  className="form-control"
                  dateFormat="MMM dd, yyyy"
                  maxDate={new Date()}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Clock In Time *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.clockInTime}
                  onChange={(e) => handleChange('clockInTime', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Clock Out Time *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.clockOutTime}
                  onChange={(e) => handleChange('clockOutTime', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Location Verified"
                  checked={formData.isLocationVerified}
                  onChange={(e) => handleChange('isLocationVerified', e.target.checked)}
                />
              </Form.Group>
            </Col>
            
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add any notes about this entry"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Record
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ManualAttendanceModal;