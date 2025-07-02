import React from 'react';
import { Table, Card, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const AttendanceSummaryReport = ({ data, startDate, endDate }) => {
  // Prepare daily data for chart
  const dailyChartData = Object.entries(data.dailyStats || {})
    .map(([date, stats]) => ({
      date: format(new Date(date), 'MMM dd'),
      fullDate: date,
      workers: stats.workerCount,
      hours: parseFloat(stats.hours.toFixed(1)),
      earnings: parseFloat(stats.earnings.toFixed(2)),
      records: stats.records
    }))
    .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

  // Prepare site data for pie chart
  const siteChartData = Object.entries(data.siteStats || {})
    .map(([siteName, stats]) => ({
      name: siteName,
      hours: parseFloat(stats.hours.toFixed(1)),
      workers: stats.workerCount,
      records: stats.records
    }))
    .filter(item => item.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Attendance Summary Report</h5>
            <span className="text-muted">
              {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
            </span>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <Card bg="light">
                <Card.Body className="text-center">
                  <h3 className="mb-0">{data.totalRecords}</h3>
                  <small className="text-muted">Total Records</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card bg="light">
                <Card.Body className="text-center">
                  <h3 className="mb-0">{data.uniqueWorkers}</h3>
                  <small className="text-muted">Unique Workers</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card bg="light">
                <Card.Body className="text-center">
                  <h3 className="mb-0">{data.totalHours.toFixed(1)}</h3>
                  <small className="text-muted">Total Hours</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card bg="light">
                <Card.Body className="text-center">
                  <h3 className="mb-0">${data.totalEarnings.toFixed(2)}</h3>
                  <small className="text-muted">Total Earnings</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Daily Trends Chart */}
      {dailyChartData.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Daily Attendance Trends</h6>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'workers') return [value, 'Workers'];
                    if (name === 'hours') return [value, 'Hours'];
                    if (name === 'earnings') return [`$${value}`, 'Earnings'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="workers"
                  stroke="#8884d8"
                  name="Workers"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hours"
                  stroke="#82ca9d"
                  name="Hours"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      <Row>
        {/* Daily Stats Table */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Daily Breakdown</h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table size="sm" hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Workers</th>
                      <th>Hours</th>
                      <th>Records</th>
                      <th>Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyChartData.map((day, index) => (
                      <tr key={index}>
                        <td>{day.date}</td>
                        <td className="text-center">{day.workers}</td>
                        <td>{day.hours}</td>
                        <td className="text-center">{day.records}</td>
                        <td>${day.earnings}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-active fw-bold">
                      <td>TOTAL</td>
                      <td className="text-center">{data.uniqueWorkers}</td>
                      <td>{data.totalHours.toFixed(1)}</td>
                      <td className="text-center">{data.totalRecords}</td>
                      <td>${data.totalEarnings.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Site Stats */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Site Breakdown</h6>
            </Card.Header>
            <Card.Body>
              {siteChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={siteChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="hours"
                      >
                        {siteChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="table-responsive mt-3">
                    <Table size="sm">
                      <thead>
                        <tr>
                          <th>Site</th>
                          <th>Workers</th>
                          <th>Hours</th>
                          <th>Records</th>
                        </tr>
                      </thead>
                      <tbody>
                        {siteChartData.map((site, index) => (
                          <tr key={index}>
                            <td>
                              <span 
                                className="d-inline-block me-2" 
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: COLORS[index % COLORS.length],
                                  borderRadius: '2px'
                                }}
                              ></span>
                              {site.name}
                            </td>
                            <td>{site.workers}</td>
                            <td>{site.hours}</td>
                            <td>{site.records}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-muted text-center">No site data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AttendanceSummaryReport;