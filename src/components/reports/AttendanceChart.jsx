import React from 'react';
import { Card } from 'react-bootstrap';
import {
  LineChart,
  Line,
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
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AttendanceChart = ({ data, type = 'daily' }) => {
  if (type === 'daily' && data.dailyStats) {
    // Prepare daily data for chart
    const chartData = Object.entries(data.dailyStats)
      .map(([date, stats]) => ({
        date: format(new Date(date), 'MMM dd'),
        workers: stats.workerCount,
        hours: stats.hours.toFixed(1),
        earnings: stats.earnings.toFixed(2)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">Daily Attendance Trends</h5>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="workers"
                stroke="#8884d8"
                name="Workers"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hours"
                stroke="#82ca9d"
                name="Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  }

  if (type === 'site' && data.siteStats) {
    // Prepare site data for pie chart
    const chartData = Object.entries(data.siteStats)
      .map(([siteId, stats]) => ({
        name: siteId,
        value: stats.hours
      }))
      .filter(item => item.value > 0);

    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">Hours by Site</h5>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  }

  return null;
};

export default AttendanceChart;