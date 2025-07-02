import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from 'date-fns';

const ReportGenerator = ({ onGenerate }) => {
  const [reportType, setReportType] = useState('payroll');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();
    
    try {
      switch (range) {
        case 'thisWeek':
          setStartDate(startOfWeek(today, { weekStartsOn: 1 })); // Monday start
          setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
          break;
        case 'lastWeek':
          const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
          const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
          setStartDate(lastWeekStart);
          setEndDate(lastWeekEnd);
          break;
        case 'thisMonth':
          setStartDate(startOfMonth(today));
          setEndDate(endOfMonth(today));
          break;
        case 'lastMonth':
          const lastMonth = subMonths(today, 1);
          setStartDate(startOfMonth(lastMonth));
          setEndDate(endOfMonth(lastMonth));
          break;
        case 'custom':
          // Keep current dates
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error setting date range:', err);
      setError('Error setting date range');
    }
  };

  const generateReportData = async (type, start, end) => {
    switch (type) {
      case 'payroll':
        return await reportService.generatePayrollReport(start, end);
      case 'attendance':
        return await reportService.generateAttendanceSummary(start, end);
      case 'site':
        return await reportService.generateSiteAnalysis(start, end);
      case 'worker':
        return await reportService.generateWorkerPerformance(start, end);
      default:
        throw new Error('Unknown report type');
    }
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select valid start and end dates');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Generating report:', { reportType, startDate, endDate });
      
      const data = await generateReportData(reportType, startDate, endDate);
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast.warning('No data found for the selected period');
      } else {
        onGenerate({ type: reportType, data, startDate, endDate });
        toast.success('Report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError(`Failed to generate report: ${error.message}`);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select valid dates before exporting');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Exporting Excel:', { reportType, startDate, endDate });
      
      const data = await generateReportData(reportType, startDate, endDate);
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast.warning('No data to export for the selected period');
        return;
      }

      const reportTypeName = {
        'payroll': 'Payroll',
        'attendance': 'Attendance Summary',
        'site': 'Site Analysis',
        'worker': 'Worker Performance'
      }[reportType];

      await reportService.exportToExcel(reportTypeName, data, startDate, endDate);
      toast.success('Excel exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setError(`Failed to export Excel: ${error.message}`);
      toast.error('Failed to export Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Generate Reports</h5>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Report Type</Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  disabled={loading}
                >
                  <option value="payroll">Payroll Report</option>
                  <option value="attendance">Attendance Summary</option>
                  <option value="site">Site Analysis</option>
                  <option value="worker">Worker Performance</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date Range</Form.Label>
                <Form.Select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            {dateRange === 'custom' && (
              <>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <DatePicker
                      selected={startDate}
                      onChange={setStartDate}
                      className="form-control"
                      dateFormat="MMM dd, yyyy"
                      maxDate={endDate}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date</Form.Label>
                    <DatePicker
                      selected={endDate}
                      onChange={setEndDate}
                      className="form-control"
                      dateFormat="MMM dd, yyyy"
                      minDate={startDate}
                      maxDate={new Date()}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
          
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-chart-bar me-2"></i>
                  Generate Report
                </>
              )}
            </Button>
            
            
            <Button
              variant="outline-success"
              onClick={handleExportExcel}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? (
                <Spinner size="sm" className="me-2" />
              ) : (
                <i className="fas fa-file-excel me-2"></i>
              )}
              Export Excel
            </Button>
          </div>

          {/* Report Type Description */}
          <div className="mt-3">
            <small className="text-muted">
              {reportType === 'payroll' && 'Generate payroll summary with hours worked and earnings for each employee.'}
              {reportType === 'attendance' && 'View attendance statistics including daily trends and site breakdown.'}
              {reportType === 'site' && 'Analyze performance and utilization metrics for each work site.'}
              {reportType === 'worker' && 'Review individual worker performance, punctuality, and productivity metrics.'}
            </small>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReportGenerator;