import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { attendanceService } from '../services/attendanceService';
import { workerService } from '../services/workerService';
import { siteService } from '../services/siteService';
import { reportService } from '../services/reportService';
import QuickActions from '../components/attendance/QuickActions';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeSites: 0,
    clockedIn: 0,
    todaysHours: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load basic stats
      const workers = await workerService.getWorkers({ isActive: true });
      const sites = await siteService.getSites(true);
      const todayRecords = await attendanceService.getTodayAttendance();

      const activeWorkers = todayRecords.filter(r => !r.clockOutTime).length;
      const todaysHours = todayRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);

      setStats({
        totalWorkers: workers.length,
        activeSites: sites.length,
        clockedIn: activeWorkers,
        todaysHours: todaysHours.toFixed(1)
      });

      // Load weekly trend data
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      const weeklyStats = await reportService.generateAttendanceSummary(startDate, endDate);

      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(endDate, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayData = weeklyStats.dailyStats[dateKey] || { workerCount: 0, hours: 0 };

        chartData.push({
          date: format(date, 'EEE'),
          workers: dayData.workerCount,
          hours: parseFloat(dayData.hours.toFixed(1))
        });
      }

      setWeeklyData(chartData);

      // Load recent activity (today's records)
      const recentRecords = await attendanceService.getAttendanceRecords({
        startDate: new Date(),
        endDate: new Date()
      });
      setRecentActivity(recentRecords.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const statsData = [
    { title: 'Total Workers', value: stats.totalWorkers, icon: 'fas fa-users', color: 'primary' },
    { title: 'Active Sites', value: stats.activeSites, icon: 'fas fa-map-marker-alt', color: 'success' },
    { title: 'Clocked In', value: stats.clockedIn, icon: 'fas fa-clock', color: 'info' },
    { title: "Today's Hours", value: stats.todaysHours, icon: 'fas fa-hourglass-half', color: 'warning' },
  ];

  return (
    <>
      <h2 className="mb-4">Dashboard</h2>

      <Row>
        {statsData.map((stat, index) => (
          <Col md={6} lg={3} key={index} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2">{stat.title}</h6>
                    <h3 className="mb-0">{stat.value}</h3>
                  </div>
                  <div className={`text-${stat.color} opacity-75`}>
                    <i className={`${stat.icon} fa-2x`}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Weekly Attendance Trend</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorWorkers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="workers"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorWorkers)"
                    name="Workers"
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorHours)"
                    name="Hours"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <QuickActions />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col lg={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              {recentActivity.length === 0 ? (
                <p className="text-muted text-center py-3">No activity today</p>
              ) : (
                <div className="activity-feed">
                  {recentActivity.map((record, index) => (
                    <div key={index} className="activity-item d-flex align-items-center py-2 border-bottom">
                      <div className="activity-icon me-3">
                        <i
                          className={`fas fa-${record.clockOutTime ? 'sign-out-alt' : 'sign-in-alt'} text-${record.clockOutTime ? 'danger' : 'success'}`}
                        ></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0">
                          <strong>{record.workerName || 'Unknown'}</strong>
                          {record.clockOutTime ? ' clocked out' : ' clocked in'}
                        </p>
                        <small className="text-muted">
                          {format(record.clockInTime || new Date(), 'hh:mm a')} at {record.siteName || 'Unknown Site'}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
