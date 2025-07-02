import React, { useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import AttendanceList from '../components/attendance/AttendanceList';
import LiveTracking from '../components/attendance/LiveTracking';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div>
      <h2 className="mb-4">Attendance Management</h2>
      
      <Tabs
        id="attendance-tabs"
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="list" title="Attendance Records">
          <AttendanceList />
        </Tab>
        <Tab eventKey="live" title="Live Tracking">
          <LiveTracking />
        </Tab>
        <Tab eventKey="calendar" title="Calendar View">
          <AttendanceCalendar />
        </Tab>
      </Tabs>
    </div>
  );
};

export default Attendance;