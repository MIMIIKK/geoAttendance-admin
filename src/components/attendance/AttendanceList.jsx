import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Badge,
  Spinner,
  Card,
  Row,
  Col
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
      
      // Load workers for dropdown
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
          siteName: worker?.siteName || 'Unknown'
        };
      });

      setAttendance(enrichedRecords);

      // Load statistics
      const statsData = await attendanceService.getAttendanceStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading attendance:', error);
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Attendance Management</h3>
        <Button variant="primary" onClick={() => setShowManualModal(true)}>
          <i className="fas fa-plus me-2"></i>
          Manual Entry
        </Button>
      </div>

      {stats && <AttendanceStats stats={stats} />}

      <Card className="mb-4">
        <Card.Body>
          <AttendanceFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            workers={workers}
          />
        </Card.Body>
      </Card>

      <Card>
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
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id}>
                      <td>{format(record.clockInTime, 'MMM dd, yyyy')}</td>
                      <td>{record.workerName}</td>
                      <td>{record.siteName}</td>
                      <td>{format(record.clockInTime, 'hh:mm a')}</td>
                      <td>
                        {record.clockOutTime 
                          ? format(record.clockOutTime, 'hh:mm a')
                          : '-'
                        }
                      </td>
                      <td>{calculateDuration(record)}</td>
                      <td>${record.payAmount?.toFixed(2) || '0.00'}</td>
                      <td>{getStatusBadge(record)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {/* TODO: Edit modal */}}
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