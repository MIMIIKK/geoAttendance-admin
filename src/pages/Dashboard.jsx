import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
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
import LiveAttendanceMonitor from '../components/dashboard/LiveAttendanceMonitor';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeSites: 0,
    clockedIn: 0,
    todaysHours: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds for stats
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load basic stats with better error handling
      const [workers, sites] = await Promise.all([
        workerService.getWorkers().catch(err => {
          console.warn('Error loading workers:', err);
          return [];
        }),
        siteService.getSites().catch(err => {
          console.warn('Error loading sites:', err);
          return [];
        })
      ]);

      // Load today's attendance with fallback
      let todayRecords = [];
      try {
        todayRecords = await attendanceService.getTodayAttendance();
      } catch (err) {
        console.warn('Error loading today attendance:', err);
        // Fallback: try to load manually for known workers
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (const worker of workers.slice(0, 5)) { // Limit to prevent too many calls
            try {
              const workerRecords = await attendanceService.getAttendanceRecords({
                startDate: today,
                endDate: today,
                userEmail: worker.email
              });
              todayRecords.push(...workerRecords);
            } catch (workerErr) {
              // Skip this worker
              continue;
            }
          }
        } catch (fallbackErr) {
          console.warn('Fallback also failed:', fallbackErr);
        }
      }

      const activeWorkers = todayRecords.filter(r => !r.clockOutTime).length;
      const todaysHours = todayRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
      const activeSites = sites.filter(site => site.isActive !== false).length;

      setStats({
        totalWorkers: workers.length,
        activeSites: activeSites,
        clockedIn: activeWorkers,
        todaysHours: todaysHours.toFixed(1)
      });

      // Load weekly trend data with fallback
      try {
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
            fullDate: date,
            workers: dayData.workerCount,
            hours: parseFloat(dayData.hours.toFixed(1))
          });
        }

        setWeeklyData(chartData);
      } catch (weeklyErr) {
        console.warn('Error loading weekly data:', weeklyErr);
        // Create dummy data for last 7 days
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(new Date(), i);
          chartData.push({
            date: format(date, 'EEE'),
            fullDate: date,
            workers: 0,
            hours: 0
          });
        }
        setWeeklyData(chartData);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { 
      title: 'Total Workers', 
      value: stats.totalWorkers, 
      icon: 'fas fa-users', 
      color: 'primary',
      change: null
    },
    { 
      title: 'Active Sites', 
      value: stats.activeSites, 
      icon: 'fas fa-map-marker-alt', 
      color: 'success',
      change: null
    },
    { 
      title: 'Currently Working', 
      value: stats.clockedIn, 
      icon: 'fas fa-clock', 
      color: 'info',
      change: stats.clockedIn > 0 ? 'Live' : null,
      isLive: true
    },
    { 
      title: "Today's Hours", 
      value: stats.todaysHours, 
      icon: 'fas fa-hourglass-half', 
      color: 'warning',
      change: parseFloat(stats.todaysHours) > 0 ? 'Active' : null
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <div className="d-flex align-items-center">
          <Badge bg="success" className="me-2">
            <i className="fas fa-circle me-1"></i>
            Live Data
          </Badge>
          <small className="text-muted">
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </small>
        </div>
      </div>

      {/* Stats Cards */}
      <Row>
        {statsData.map((stat, index) => (
          <Col md={6} lg={3} key={index} className="mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2 d-flex align-items-center">
                      {stat.title}
                      {stat.isLive && (
                        <span className="ms-2">
                          <i className="fas fa-circle text-success pulse" style={{fontSize: '8px'}}></i>
                        </span>
                      )}
                    </h6>
                    <h3 className="mb-0 d-flex align-items-center">
                      {loading ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          {stat.value}
                          {stat.change && (
                            <Badge bg={stat.color} size="sm" className="ms-2">
                              {stat.change}
                            </Badge>
                          )}
                        </>
                      )}
                    </h3>
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

      {/* Charts and Live Data */}
      <Row className="mt-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Weekly Attendance Trend</h5>
                <small className="text-muted">
                  {weeklyData.length > 0 && (
                    `${format(weeklyData[0].fullDate, 'MMM dd')} - ${format(weeklyData[weeklyData.length - 1].fullDate, 'MMM dd')}`
                  )}
                </small>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
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
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Workers') return [value, 'Workers'];
                        if (name === 'Hours') return [value, 'Hours'];
                        return [value, name];
                      }}
                    />
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
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Live Attendance Monitor */}
      <Row className="mt-4">
        <Col lg={12}>
          <LiveAttendanceMonitor />
        </Col>
      </Row>

      {/* Performance Summary */}
      <Row className="mt-4">
        <Col lg={4}>
          <Card className="shadow-sm border-0">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-3">Today's Performance</h6>
              <div className="row">
                <div className="col">
                  <h4 className="mb-1 text-primary">{stats.clockedIn}</h4>
                  <small className="text-muted">Active Now</small>
                </div>
                <div className="col">
                  <h4 className="mb-1 text-success">{stats.todaysHours}</h4>
                  <small className="text-muted">Hours Today</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm border-0">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-3">Weekly Average</h6>
              <div className="row">
                <div className="col">
                  <h4 className="mb-1 text-info">
                    {weeklyData.length > 0 ? 
                      (weeklyData.reduce((sum, day) => sum + day.workers, 0) / weeklyData.length).toFixed(1) : 
                      '0'
                    }
                  </h4>
                  <small className="text-muted">Workers/Day</small>
                </div>
                <div className="col">
                  <h4 className="mb-1 text-warning">
                    {weeklyData.length > 0 ? 
                      (weeklyData.reduce((sum, day) => sum + day.hours, 0) / weeklyData.length).toFixed(1) : 
                      '0'
                    }
                  </h4>
                  <small className="text-muted">Hours/Day</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm border-0">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-3">System Status</h6>
              <div className="d-flex justify-content-center align-items-center">
                <Badge bg="success" className="me-2">
                  <i className="fas fa-circle me-1"></i>
                  Online
                </Badge>
                <Badge bg="info">
                  Real-time Sync
                </Badge>
              </div>
              <small className="text-muted mt-2 d-block">
                All systems operational
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Dashboard;