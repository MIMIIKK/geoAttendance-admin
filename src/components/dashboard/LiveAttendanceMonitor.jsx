import React, { useEffect, useState } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';

const LiveAttendanceMonitor = () => {
  const [liveAttendance, setLiveAttendance] = useState([]);

  useEffect(() => {
    const fetchLiveData = async () => {
      // Get all users first
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = {};
      usersSnapshot.forEach(doc => {
        users[doc.id] = doc.data();
      });

      // Monitor attendance for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // For each user, monitor their attendance
      const unsubscribes = [];
      
      Object.keys(users).forEach(userEmail => {
        const unsubscribe = onSnapshot(
          query(
            collection(db, 'attendance', userEmail, 'records'),
            where('clockInTime', '>=', Timestamp.fromDate(today))
          ),
          (snapshot) => {
            const records = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              records.push({
                id: doc.id,
                ...data,
                workerName: users[userEmail].name,
                siteName: users[userEmail].siteName,
                clockInTime: data.clockInTime?.toDate(),
                clockOutTime: data.clockOutTime?.toDate()
              });
            });
            
            // Update live attendance
            setLiveAttendance(prev => {
              const filtered = prev.filter(r => r.userEmail !== userEmail);
              return [...filtered, ...records];
            });
          }
        );
        
        unsubscribes.push(unsubscribe);
      });

      return () => unsubscribes.forEach(unsub => unsub());
    };

    fetchLiveData();
  }, []);

  const activeWorkers = liveAttendance.filter(r => !r.clockOutTime);

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          Live Attendance Monitor - {activeWorkers.length} Active
        </h5>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table size="sm">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Site</th>
                <th>Clock In</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeWorkers.map(record => (
                <tr key={record.id}>
                  <td>{record.workerName}</td>
                  <td>{record.siteName}</td>
                  <td>{format(record.clockInTime, 'hh:mm a')}</td>
                  <td>
                    <Badge bg="success" className="pulse">
                      Working
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default LiveAttendanceMonitor;