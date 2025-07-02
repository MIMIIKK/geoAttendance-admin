import React, { useEffect, useState } from 'react';
import { Badge } from 'react-bootstrap';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

const RealtimeSync = () => {
  const [syncStatus, setSyncStatus] = useState('connected');
  const [activeWorkers, setActiveWorkers] = useState(0);

  useEffect(() => {
    // Monitor real-time attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unsubscribe = onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        // Count active workers
        let active = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Check each user's records subcollection
          // This is simplified - you'd need to check subcollections
        });
        
        setActiveWorkers(active);
        setSyncStatus('connected');
      },
      (error) => {
        console.error('Sync error:', error);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="d-flex align-items-center">
      <Badge 
        bg={syncStatus === 'connected' ? 'success' : 'danger'} 
        className="me-2"
      >
        {syncStatus === 'connected' ? '● Live' : '○ Offline'}
      </Badge>
      {activeWorkers > 0 && (
        <small className="text-muted">
          {activeWorkers} active
        </small>
      )}
    </div>
  );
};

export default RealtimeSync;