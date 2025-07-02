import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
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
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load workers
      const workersData = await workerService.getWorkers();
      setWorkers(workersData);

      // Load today's attendance
      const todayRecords = await attendanceService.getTodayAttendance();
      
      // Filter currently clocked in workers
      const active = todayRecords
        .filter(record => !record.clockOutTime)
        .map(record => {
          const worker = workersData.find(w => w.email === record.userEmail);
          return {
            ...record,
            workerName: worker?.name || 'Unknown',
            siteName: worker?.siteName || 'Unknown',
            payRate: worker?.payRate || 0
          };
        });

      setActiveWorkers(active);
    } catch (error) {
      console.error('Error loading live data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkingTime = (clockInTime) => {
    const now = new Date();
    const diff = now - new Date(clockInTime);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateCurrentEarnings = (clockInTime, payRate) => {
    const now = new Date();
    const diff = now - new Date(clockInTime);
    const hours = diff / (1000 * 60 * 60);
    return (hours * payRate).toFixed(2);
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Live Tracking - {activeWorkers.length} Active Workers
            </h5>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={loadData}
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
                <i className="fas fa-sync me-2"></i>
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
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
            <p className="text-center text-muted py-3">
              No workers currently clocked in
            </p>
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
                      <td>{worker.workerName}</td>
                      <td>{worker.siteName}</td>
                      <td>{format(worker.clockInTime, 'hh:mm a')}</td>
                      <td>{calculateWorkingTime(worker.clockInTime)}</td>
                      <td>${calculateCurrentEarnings(worker.clockInTime, worker.payRate)}</td>
                      <td>
                        {worker.isLocationVerified ? (
                          <Badge bg="success">Verified</Badge>
                        ) : (
                          <Badge bg="warning">Unverified</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="info" className="pulse">
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
          <h5 className="mb-0">Active Workers Map</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div style={{ height: '400px', width: '100%' }}>
            <MapContainer
              center={[27.7172, 85.3240]}
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
                         <h6>{worker.workerName}</h6>
                         <p className="mb-1">Site: {worker.siteName}</p>
                         <p className="mb-1">Since: {format(worker.clockInTime, 'hh:mm a')}</p>
                         <p className="mb-0">Working: {calculateWorkingTime(worker.clockInTime)}</p>
                       </div>
                     </Popup>
                   </Marker>
                 );
               }
               return null;
             })}
           </MapContainer>
         </div>
       </Card.Body>
     </Card>
   </div>
 );
};

export default LiveTracking;