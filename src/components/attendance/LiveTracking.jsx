import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { format } from 'date-fns';
import { attendanceService } from '../../services/attendanceService';
import { workerService } from '../../services/workerService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker for active workers
const activeWorkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LiveTracking = () => {
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    
    return () => {
      // Cleanup subscription on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh && workers.length > 0) {
      setupLiveTracking();
    } else {
      // Stop live tracking
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [autoRefresh, workers]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load workers first
      console.log('Loading workers...');
      const workersData = await workerService.getWorkers();
      console.log('Workers loaded:', workersData.length);
      setWorkers(workersData);

      // Load today's attendance
      console.log('Loading today\'s attendance...');
      const todayRecords = await attendanceService.getTodayAttendance();
      console.log('Today\'s records:', todayRecords.length);
      
      processAttendanceData(todayRecords, workersData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load attendance data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupLiveTracking = () => {
    try {
      console.log('Setting up live tracking...');
      
      // Clean up existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Subscribe to live updates
      unsubscribeRef.current = attendanceService.subscribeToLiveAttendance((records) => {
        console.log('Live update received:', records.length, 'records');
        processAttendanceData(records, workers);
        setLastUpdated(new Date());
      });
      
    } catch (error) {
      console.error('Error setting up live tracking:', error);
      setError('Failed to setup live tracking: ' + error.message);
    }
  };

  const processAttendanceData = (records, workersData) => {
    try {
      // Filter currently clocked in workers (no clockOutTime)
      const active = records
        .filter(record => !record.clockOutTime)
        .map(record => {
          const worker = workersData.find(w => w.email === record.userEmail);
          return {
            ...record,
            workerName: worker?.name || 'Unknown Worker',
            siteName: worker?.siteName || record.siteName || 'Unknown Site',
            payRate: worker?.payRate || record.payRate || 0
          };
        });

      console.log('Active workers processed:', active.length);
      setActiveWorkers(active);
    } catch (error) {
      console.error('Error processing attendance data:', error);
    }
  };

  const manualRefresh = async () => {
    setAutoRefresh(false); // Stop auto refresh temporarily
    await loadInitialData();
    setAutoRefresh(true); // Resume auto refresh
  };

  const calculateWorkingTime = (clockInTime) => {
    if (!clockInTime) return '0h 0m';
    
    const now = new Date();
    const diff = now - new Date(clockInTime);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateCurrentEarnings = (clockInTime, payRate) => {
    if (!clockInTime || !payRate) return '0.00';
    
    const now = new Date();
    const diff = now - new Date(clockInTime);
    const hours = diff / (1000 * 60 * 60);
    return (hours * payRate).toFixed(2);
  };

  if (loading && activeWorkers.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading live tracking data...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadInitialData}>
            Try Again
          </Button>
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">
                Live Tracking - {activeWorkers.length} Active Workers
              </h5>
              <small className="text-muted">
                Last updated: {format(lastUpdated, 'HH:mm:ss')}
              </small>
            </div>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={manualRefresh}
                disabled={loading}
              >
                <i className="fas fa-refresh me-2"></i>
                Refresh
              </Button>
              <Button
                variant={autoRefresh ? 'primary' : 'outline-primary'}
                size="sm"
                className="ms-2"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <i className={`fas fa-${autoRefresh ? 'pause' : 'play'} me-2`}></i>
                Live: {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {loading && activeWorkers.length === 0 ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : activeWorkers.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted mb-0">No workers currently clocked in</p>
              <small className="text-muted">Workers will appear here when they clock in</small>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Site</th>
                    <th>Clock In</th>
                    <th>Working Time</th>
                    <th>Current Earnings</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeWorkers.map((worker) => (
                    <tr key={worker.id}>
                      <td>
                        <div>
                          <strong>{worker.workerName}</strong>
                          <br />
                          <small className="text-muted">{worker.userEmail}</small>
                        </div>
                      </td>
                      <td>{worker.siteName}</td>
                      <td>
                        {worker.clockInTime ? 
                          format(worker.clockInTime, 'HH:mm') : 
                          'N/A'
                        }
                      </td>
                      <td>
                        <strong>{calculateWorkingTime(worker.clockInTime)}</strong>
                      </td>
                      <td>
                        <strong>${calculateCurrentEarnings(worker.clockInTime, worker.payRate)}</strong>
                      </td>
                      <td>
                        {worker.isLocationVerified ? (
                          <Badge bg="success">
                            <i className="fas fa-check me-1"></i>
                            Verified
                          </Badge>
                        ) : (
                          <Badge bg="warning">
                            <i className="fas fa-question me-1"></i>
                            Unverified
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="info" className="pulse">
                          <i className="fas fa-clock me-1"></i>
                          Working
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-map-marker-alt me-2"></i>
            Active Workers Map
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div style={{ height: '400px', width: '100%' }}>
            <MapContainer
              center={[27.7172, 85.3240]} // Kathmandu coordinates
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {activeWorkers.map((worker) => {
                if (worker.clockInLatitude && worker.clockInLongitude) {
                  return (
                    <Marker
                      key={worker.id}
                      position={[worker.clockInLatitude, worker.clockInLongitude]}
                      icon={activeWorkerIcon}
                    >
                      <Popup>
                        <div>
                          <h6 className="mb-2">{worker.workerName}</h6>
                          <p className="mb-1">
                            <strong>Site:</strong> {worker.siteName}
                          </p>
                          <p className="mb-1">
                            <strong>Since:</strong> {worker.clockInTime ? format(worker.clockInTime, 'HH:mm') : 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Working:</strong> {calculateWorkingTime(worker.clockInTime)}
                          </p>
                          <p className="mb-0">
                            <strong>Earnings:</strong> ${calculateCurrentEarnings(worker.clockInTime, worker.payRate)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>
          {activeWorkers.length > 0 && (
            <div className="p-3 bg-light">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Showing {activeWorkers.filter(w => w.clockInLatitude && w.clockInLongitude).length} of {activeWorkers.length} workers with location data
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      <style jsx>{`
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveTracking;