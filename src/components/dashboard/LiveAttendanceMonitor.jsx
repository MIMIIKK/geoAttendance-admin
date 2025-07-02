import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { collection, query, where, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { workerService } from '../../services/workerService';
import { format } from 'date-fns';

const LiveAttendanceMonitor = () => {
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    let refreshInterval = null;

    const setupLiveMonitoring = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get workers data first
        const workers = await workerService.getWorkers();
        console.log('📋 Workers loaded for live monitoring:', workers.length);

        if (workers.length === 0) {
          setError('No workers found in the system');
          setLoading(false);
          return;
        }

        const workerMap = {};
        workers.forEach(worker => {
          workerMap[worker.email] = worker;
        });

        // Function to load live data
        const loadLiveData = async () => {
          try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const allRecords = [];

            // Load attendance for each worker individually
            for (const worker of workers) {
              try {
                const userAttendanceRef = collection(db, 'attendance', worker.email, 'records');
                const q = query(
                  userAttendanceRef,
                  where('clockInTime', '>=', Timestamp.fromDate(today))
                );
                
                const snapshot = await getDocs(q);
                
                snapshot.forEach(doc => {
                  const data = doc.data();
                  allRecords.push({
                    id: doc.id,
                    userEmail: worker.email,
                    ...data,
                    workerName: worker.name || 'Unknown Worker',
                    siteName: worker.siteName || data.siteName || 'Unknown Site',
                    payRate: worker.payRate || 0,
                    clockInTime: data.clockInTime?.toDate() || null,
                    clockOutTime: data.clockOutTime?.toDate() || null
                  });
                });
              } catch (workerError) {
                console.warn(`No attendance data for ${worker.email}:`, workerError.message);
              }
            }

            // Sort by clock in time (most recent first)
            allRecords.sort((a, b) => {
              if (!a.clockInTime) return 1;
              if (!b.clockInTime) return -1;
              return b.clockInTime - a.clockInTime;
            });

            setLiveAttendance(allRecords);
            setLastUpdated(new Date());
            setLoading(false);
            
            console.log('✅ Live attendance updated:', allRecords.length, 'records');
          } catch (error) {
            console.error('Error loading live data:', error);
            setError('Failed to load live data: ' + error.message);
            setLoading(false);
          }
        };

        // Initial load
        await loadLiveData();

        // Set up polling every 30 seconds
        refreshInterval = setInterval(loadLiveData, 30000);

        console.log('🔄 Live monitoring setup complete with 30s polling');

      } catch (err) {
        console.error('Setup error:', err);
        setError('Failed to setup live monitoring: ' + err.message);
        setLoading(false);
      }
    };

    setupLiveMonitoring();

    // Cleanup on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const calculateWorkingTime = (clockInTime) => {
    if (!clockInTime) return '0h 0m';
    
    const now = new Date();
    const diff = now - clockInTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateCurrentEarnings = (clockInTime, payRate) => {
    if (!clockInTime || !payRate) return '0.00';
    
    const now = new Date();
    const diff = now - clockInTime;
    const hours = diff / (1000 * 60 * 60);
    return (hours * payRate).toFixed(2);
  };

  // Filter active workers (currently clocked in)
  const activeWorkers = liveAttendance.filter(record => !record.clockOutTime);
  
  // Recent activity (all records, including completed ones)
  const recentActivity = liveAttendance.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">Live Attendance Monitor</h5>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Loading live data...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">Live Attendance Monitor</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            <Alert.Heading>Live Monitoring</Alert.Heading>
            <p className="mb-0">Using polling mode for live updates (refreshes every 30 seconds)</p>
            <small className="text-muted mt-2 d-block">
              {error}
            </small>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-sync-alt me-2 text-primary"></i>
            Live Attendance Monitor
          </h5>
          <div className="d-flex align-items-center">
            <Badge bg="success" className="me-2">
              {activeWorkers.length} Active
            </Badge>
            <small className="text-muted">
              Updated: {format(lastUpdated, 'HH:mm:ss')}
            </small>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {activeWorkers.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-users fa-2x text-muted mb-3"></i>
            <p className="text-muted mb-0">No workers currently clocked in</p>
            <small className="text-muted">Active workers will appear here (updates every 30s)</small>
          </div>
        ) : (
          <div className="table-responsive">
            <Table size="sm" hover>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Site</th>
                  <th>Clock In</th>
                  <th>Working Time</th>
                  <th>Current Earnings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeWorkers.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div>
                        <strong>{record.workerName}</strong>
                        <br />
                        <small className="text-muted">{record.userEmail}</small>
                      </div>
                    </td>
                    <td>{record.siteName}</td>
                    <td>
                      {record.clockInTime ? 
                        format(record.clockInTime, 'HH:mm') : 
                        'N/A'
                      }
                    </td>
                    <td>
                      <strong>{calculateWorkingTime(record.clockInTime)}</strong>
                    </td>
                    <td>
                      <strong>${calculateCurrentEarnings(record.clockInTime, record.payRate)}</strong>
                    </td>
                    <td>
                      <Badge bg="success">
                        <i className="fas fa-circle me-1"></i>
                        Working
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Recent Activity Section */}
        {recentActivity.length > 0 && (
          <div className="mt-4">
            <h6 className="text-muted mb-3">Recent Activity (Today)</h6>
            <div className="recent-activity">
              {recentActivity.map((record, index) => (
                <div key={record.id} className="d-flex align-items-center py-2 border-bottom">
                  <div className="me-3">
                    <i className={`fas fa-${record.clockOutTime ? 'sign-out-alt' : 'sign-in-alt'} text-${record.clockOutTime ? 'danger' : 'success'}`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{record.workerName}</strong>
                        <span className="text-muted ms-2">
                          {record.clockOutTime ? 'clocked out' : 'clocked in'}
                        </span>
                      </div>
                      <small className="text-muted">
                        {record.clockInTime ? format(record.clockInTime, 'HH:mm') : 'N/A'}
                      </small>
                    </div>
                    <small className="text-muted">
                      {record.siteName}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 text-center">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            Data refreshes automatically every 30 seconds
          </small>
        </div>
      </Card.Body>

      <style jsx>{`
        .recent-activity .border-bottom:last-child {
          border-bottom: none !important;
        }
      `}</style>
    </Card>
  );
};

export default LiveAttendanceMonitor;