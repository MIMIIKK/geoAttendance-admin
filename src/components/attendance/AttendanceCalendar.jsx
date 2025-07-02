import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, Table } from 'react-bootstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay } from 'date-fns';
import { attendanceService } from '../../services/attendanceService';
import { workerService } from '../../services/workerService';
import './AttendanceCalendar.css';

const AttendanceCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDateRecords, setSelectedDateRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthData();
  }, [date]);

  const loadMonthData = async () => {
    try {
      setLoading(true);
      
      // Get start and end of month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Load attendance for the month
      const records = await attendanceService.getAttendanceRecords({
        startDate: startOfMonth,
        endDate: endOfMonth
      });

      // Load workers for names
      const workers = await workerService.getWorkers();
      const workerMap = {};
      workers.forEach(w => workerMap[w.email] = w);

      // Group by date
      const groupedData = {};
      records.forEach(record => {
        const dateKey = format(record.clockInTime, 'yyyy-MM-dd');
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = {
            records: [],
            totalWorkers: new Set(),
            totalHours: 0
          };
        }
        
        record.workerName = workerMap[record.userEmail]?.name || 'Unknown';
        record.siteName = workerMap[record.userEmail]?.siteName || 'Unknown';
        
        groupedData[dateKey].records.push(record);
        groupedData[dateKey].totalWorkers.add(record.userEmail);
        groupedData[dateKey].totalHours += record.totalHours || 0;
      });

      // Convert Set to count
      Object.keys(groupedData).forEach(key => {
        groupedData[key].workerCount = groupedData[key].totalWorkers.size;
      });

      setAttendanceData(groupedData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateKey = format(date, 'yyyy-MM-dd');
    const dayData = attendanceData[dateKey];

    if (!dayData) return null;

    return (
      <div className="calendar-tile-content">
        <Badge bg="primary" pill className="mb-1">
          {dayData.workerCount}
        </Badge>
        <div className="small text-muted">
          {dayData.totalHours.toFixed(1)}h
        </div>
      </div>
    );
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateKey = format(date, 'yyyy-MM-dd');
    const dayData = attendanceData[dateKey];

    if (dayData && dayData.workerCount > 0) {
      return 'has-attendance';
    }
    return null;
  };

  const handleDateClick = (value) => {
    const dateKey = format(value, 'yyyy-MM-dd');
    const dayData = attendanceData[dateKey];

    if (dayData && dayData.records.length > 0) {
      setSelectedDate(value);
      setSelectedDateRecords(dayData.records);
      setShowModal(true);
    }
  };

  return (
    <>
      <Card>
        <Card.Header>
          <h5 className="mb-0">Attendance Calendar</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-center">
            <Calendar
              onChange={setDate}
              value={date}
              onClickDay={handleDateClick}
              tileContent={getTileContent}
              tileClassName={getTileClassName}
              showNeighboringMonth={false}
            />
          </div>
          
          <div className="mt-3 text-center">
            <small className="text-muted">
              Click on a date to view detailed attendance records
            </small>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Attendance for {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Site</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedDateRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.workerName}</td>
                  <td>{record.siteName}</td>
                  <td>{format(record.clockInTime, 'hh:mm a')}</td>
                  <td>
                    {record.clockOutTime 
                      ? format(record.clockOutTime, 'hh:mm a')
                      : '-'
                    }
                  </td>
                  <td>{record.totalHours?.toFixed(1) || '0'}</td>
                  <td>
                    {record.isLocationVerified ? (
                      <Badge bg="success">Verified</Badge>
                    ) : (
                      <Badge bg="warning">Unverified</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AttendanceCalendar;