import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { workerService } from '../../services/workerService';
import { attendanceService } from '../../services/attendanceService';
import toast from 'react-hot-toast';

const QuickActions = () => {
  const [workers, setWorkers] = useState([]);
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [loading, setLoading] = useState(true);
  const [clockingOut, setClockingOut] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWorkersAndActiveStatus();
  }, []);

  const loadWorkersAndActiveStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all workers
      const allWorkers = await workerService.getWorkers();
      console.log('📋 Workers loaded for quick actions:', allWorkers.length);
      setWorkers(allWorkers);

      if (allWorkers.length === 0) {
        setError('No workers found in the system');
        setLoading(false);
        return;
      }

      // Load today's attendance to find currently active workers
      const todayRecords = await attendanceService.getTodayAttendance();
      console.log('📊 Today\'s records:', todayRecords.length);

      // Find workers who are currently clocked in (no clock out time)
      const currentlyActive = todayRecords
        .filter(record => !record.clockOutTime)
        .map(record => {
          const worker = allWorkers.find(w => w.email === record.userEmail);
          return {
            ...record,
            workerName: worker?.name || 'Unknown Worker',
            workerEmail: record.userEmail
          };
        });

      console.log('👥 Currently active workers:', currentlyActive.length);
      setActiveWorkers(currentlyActive);
      
    } catch (error) {
      console.error('Error loading workers:', error);
      setError('Failed to load workers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedWorker) {
      toast.error('Please select a worker to clock out');
      return;
    }

    try {
      setClockingOut(true);
      console.log('🚀 Starting clock out process for:', selectedWorker);

      // Find the active record for this worker
      const activeRecord = activeWorkers.find(record => record.userEmail === selectedWorker);
      
      if (!activeRecord) {
        toast.error('No active session found for this worker');
        return;
      }

      console.log('📋 Active record found:', activeRecord);

      // Get worker details for pay rate
      const worker = workers.find(w => w.email === selectedWorker);
      const payRate = worker?.payRate || 0;

      console.log('👤 Worker details:', { name: worker?.name, payRate });

      // Determine the correct record ID to use
      const recordIdToUse = activeRecord.recordId || activeRecord.id;
      
      console.log('🆔 Using record ID:', recordIdToUse);

      // Clock out the worker
      const result = await attendanceService.clockOut(
        selectedWorker,
        recordIdToUse,
        {
          payRate,
          clockOutLatitude: null, // Admin clock out - no location
          clockOutLongitude: null,
          notes: 'Clocked out by admin'
        }
      );

      console.log('✅ Clock out result:', result);

      if (result.success) {
        toast.success(`Successfully clocked out ${worker?.name || selectedWorker}`);
        toast.info(`Total hours: ${result.totalHours.toFixed(2)}h`);
        setSelectedWorker('');
        
        // Reload active workers
        await loadWorkersAndActiveStatus();
      } else {
        toast.error('Failed to clock out worker');
      }

    } catch (error) {
      console.error('❌ Clock out error:', error);
      
      // More specific error messages
      if (error.message.includes('not found')) {
        toast.error('Attendance record not found. Worker may already be clocked out.');
      } else if (error.message.includes('already clocked out')) {
        toast.error('Worker is already clocked out.');
      } else {
        toast.error('Failed to clock out: ' + error.message);
      }
    } finally {
      setClockingOut(false);
    }
  };

  const handleManualClockIn = () => {
    // You can add manual clock in functionality here
    toast.info('Manual clock in feature - to be implemented');
  };

  const handleRefresh = () => {
    loadWorkersAndActiveStatus();
    toast.success('Workers refreshed');
  };

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">Quick Actions</h5>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Loading workers...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">Quick Actions</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p className="mb-0">{error}</p>
            <Button variant="outline-danger" size="sm" onClick={loadWorkersAndActiveStatus} className="mt-2">
              Try Again
            </Button>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Quick Actions</h5>
          <Button variant="outline-secondary" size="sm" onClick={handleRefresh}>
            <i className="fas fa-sync-alt"></i>
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Quick Clock Out */}
        <div className="mb-4">
          <h6 className="mb-3">
            Quick Clock Out
            <Badge bg="info" className="ms-2">
              {activeWorkers.length} Active
            </Badge>
          </h6>
          
          {activeWorkers.length === 0 ? (
            <Alert variant="info" className="small">
              <i className="fas fa-info-circle me-2"></i>
              No workers currently clocked in
            </Alert>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="small">Select Worker</Form.Label>
                <Form.Select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  size="sm"
                >
                  <option value="">Choose worker to clock out...</option>
                  {activeWorkers.map((record) => (
                    <option key={record.userEmail} value={record.userEmail}>
                      {record.workerName} - {record.siteName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Button
                variant="danger"
                size="sm"
                onClick={handleClockOut}
                disabled={!selectedWorker || clockingOut}
                className="w-100"
              >
                {clockingOut ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Clocking Out...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Clock Out Selected Worker
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Active Workers List */}
        {activeWorkers.length > 0 && (
          <div className="mb-4">
            <h6 className="mb-3">Currently Active</h6>
            <div className="active-workers-list">
              {activeWorkers.map((record, index) => (
                <div key={record.userEmail} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <strong className="small">{record.workerName}</strong>
                    <br />
                    <small className="text-muted">{record.siteName}</small>
                  </div>
                  <Badge bg="success" size="sm">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="quick-stats">
          <h6 className="mb-3">Quick Stats</h6>
          <div className="row text-center">
            <div className="col-6">
              <div className="stat-box p-2 bg-light rounded">
                <h6 className="mb-1">{workers.length}</h6>
                <small className="text-muted">Total Workers</small>
              </div>
            </div>
            <div className="col-6">
              <div className="stat-box p-2 bg-light rounded">
                <h6 className="mb-1">{activeWorkers.length}</h6>
                <small className="text-muted">Currently Working</small>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-4">
          <h6 className="mb-3">More Actions</h6>
          <div className="d-grid gap-2">
            <Button variant="outline-primary" size="sm" onClick={handleManualClockIn}>
              <i className="fas fa-plus me-2"></i>
              Manual Clock In
            </Button>
            <Button variant="outline-info" size="sm" onClick={() => window.location.href = '/attendance'}>
              <i className="fas fa-list me-2"></i>
              View All Attendance
            </Button>
          </div>
        </div>
      </Card.Body>

      <style jsx>{`
        .active-workers-list .border-bottom:last-child {
          border-bottom: none !important;
        }
        
        .stat-box {
          transition: transform 0.2s;
        }
        
        .stat-box:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </Card>
  );
};

export default QuickActions;