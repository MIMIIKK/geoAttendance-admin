import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Badge,
  Spinner,
  Card,
  Row,
  Col,
  Alert
} from 'react-bootstrap';
import { format } from 'date-fns';
import { attendanceService } from '../../services/attendanceService';
import { workerService } from '../../services/workerService';
import AttendanceFilters from './AttendanceFilters';
import AttendanceStats from './AttendanceStats';
import ManualAttendanceModal from './ManualAttendanceModal';
import toast from 'react-hot-toast';

const AttendanceList = () => {
  const [attendance, setAttendance] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    userEmail: '',
    siteId: ''
  });
  const [stats, setStats] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load workers
      const workersData = await workerService.getWorkers();
      setWorkers(workersData);

      // Load attendance records
      const records = await attendanceService.getAttendanceRecords(filters);
      
      // Enrich with worker data
      const enrichedRecords = records.map(record => {
        const worker = workersData.find(w => w.email === record.userEmail);
        return {
          ...record,
          workerName: worker?.name || 'Unknown',
          siteName: worker?.siteName || record.siteName || 'Unknown'
        };
      });

      setAttendance(enrichedRecords);

      // Load statistics
      const statsData = await attendanceService.getAttendanceStats(filters);
      setStats(statsData);

    } catch (error) {
      console.error('Error loading attendance:', error);
      setError(`Failed to load attendance data: ${error.message}`);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleManualEntry = async (data) => {
    try {
      await attendanceService.createManualAttendance(data);
      toast.success('Manual attendance record created');
      loadData();
      setShowManualModal(false);
    } catch (error) {
      toast.error('Failed to create attendance record');
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: new Date(),
      endDate: new Date(),
      userEmail: '',
      siteId: ''
    });
  };

  const getStatusBadge = (record) => {
    if (!record.clockOutTime) {
      return <Badge bg="info">Working</Badge>;
    }
    if (record.isManual) {
      return <Badge bg="warning">Manual</Badge>;
    }
    if (record.isLocationVerified) {
      return <Badge bg="success">Verified</Badge>;
    }
    return <Badge bg="secondary">Unverified</Badge>;
  };

  const calculateDuration = (record) => {
    if (!record.clockOutTime) return 'In Progress';
    
    const duration = record.totalHours || 0;
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'HH:mm');
    } catch (error) {
      return 'Invalid Time';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Attendance Management</h3>
        <div>
          <Button variant="outline-primary" onClick={handleRefresh} className="me-2">
            <i className="fas fa-refresh me-2"></i>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowManualModal(true)}>
            <i className="fas fa-plus me-2"></i>
            Manual Entry
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error Loading Data</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={handleRefresh}>
            Try Again
          </Button>
        </Alert>
      )}

      {stats && <AttendanceStats stats={stats} />}

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">Filters</h6>
        </Card.Header>
        <Card.Body>
          <AttendanceFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            workers={workers}
          />
          <div className="mt-3">
            <Button variant="outline-secondary" size="sm" onClick={handleResetFilters}>
              <i className="fas fa-times me-1"></i>
              Reset Filters
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Attendance Records</h6>
            <small className="text-muted">
              Showing {attendance.length} records
            </small>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Worker</th>
                  <th>Site</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Duration</th>
                  <th>Earnings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div>
                        <i className="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                        <p className="text-muted mb-2">No attendance records found</p>
                        <small className="text-muted">
                          {workers.length === 0 
                            ? "No workers found. Please add workers first."
                            : "Try adjusting your date range or filters."
                          }
                        </small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.clockInTime)}</td>
                      <td>
                        <div>
                          <strong>{record.workerName}</strong>
                          <br />
                          <small className="text-muted">{record.userEmail}</small>
                        </div>
                      </td>
                      <td>{record.siteName}</td>
                      <td>{formatTime(record.clockInTime)}</td>
                      <td>{formatTime(record.clockOutTime)}</td>
                      <td>
                        <strong>{calculateDuration(record)}</strong>
                      </td>
                      <td>
                        <strong>${record.payAmount?.toFixed(2) || '0.00'}</strong>
                      </td>
                      <td>{getStatusBadge(record)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement edit modal
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <ManualAttendanceModal
        show={showManualModal}
        onHide={() => setShowManualModal(false)}
        onSave={handleManualEntry}
        workers={workers}
      />
    </div>
  );
};

export default AttendanceList;