import React, { useState } from 'react';
import { Card, Button, Form, Row, Col } from 'react-bootstrap';
import { attendanceService } from '../../services/attendanceService';
import { workerService } from '../../services/workerService';
import toast from 'react-hot-toast';

const QuickActions = () => {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const data = await workerService.getWorkers({ isActive: true });
      setWorkers(data);
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  };

  const handleQuickClockOut = async () => {
    if (!selectedWorker) {
      toast.error('Please select a worker');
      return;
    }

    try {
      setLoading(true);
      
      // Get current clock-in record
      const currentRecord = await attendanceService.getAttendanceRecords({
        userEmail: selectedWorker,
        startDate: new Date(),
        endDate: new Date()
      });

      const activeRecord = currentRecord.find(r => !r.clockOutTime);
      
      if (!activeRecord) {
        toast.error('Worker is not clocked in');
        return;
      }

      // Update with clock out time
      await attendanceService.updateAttendanceRecord(
        selectedWorker,
        activeRecord.id,
        {
          clockOutTime: new Date(),
          totalHours: (new Date() - activeRecord.clockInTime) / (1000 * 60 * 60)
        }
      );

      toast.success('Worker clocked out successfully');
      setSelectedWorker('');
    } catch (error) {
      toast.error('Failed to clock out worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Quick Actions</h5>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Quick Clock Out</Form.Label>
                <Form.Select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select Worker</option>
                  {workers.map(worker => (
                    <option key={worker.email} value={worker.email}>
                      {worker.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Label>&nbsp;</Form.Label>
              <Button
                variant="danger"
                className="w-100"
                onClick={handleQuickClockOut}
                disabled={loading || !selectedWorker}
              >
                <i className="fas fa-clock me-2"></i>
                Clock Out
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default QuickActions;