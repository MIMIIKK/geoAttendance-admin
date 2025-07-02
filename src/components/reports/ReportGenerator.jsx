import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { reportService } from '../../services/reportService';
import toast from 'react-hot-toast';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const ReportGenerator = ({ onGenerate }) => {
  const [reportType, setReportType] = useState('payroll');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [loading, setLoading] = useState(false);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();
    
    switch (range) {
      case 'thisWeek':
        setStartDate(startOfWeek(today));
        setEndDate(endOfWeek(today));
        break;
      case 'lastWeek':
        const lastWeek = new Date(today.setDate(today.getDate() - 7));
        setStartDate(startOfWeek(lastWeek));
        setEndDate(endOfWeek(lastWeek));
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
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      
      let data;
      if (reportType === 'payroll') {
        data = await reportService.generatePayrollReport(startDate, endDate);
      } else if (reportType === 'attendance') {
        data = await reportService.generateAttendanceSummary(startDate, endDate);
      }
      
      onGenerate({ type: reportType, data, startDate, endDate });
      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const data = await reportService.generatePayrollReport(startDate, endDate);
      await reportService.exportToPDF('Payroll', data, startDate, endDate);
      toast.success('PDF exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const data = await reportService.generatePayrollReport(startDate, endDate);
      await reportService.exportToExcel('Payroll', data, startDate, endDate);
      toast.success('Excel exported successfully!');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Generate Reports</h5>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Report Type</Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
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
                    />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
          
          <div className="d-flex gap-2">
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
              variant="outline-danger"
              onClick={handleExportPDF}
              disabled={loading}
            >
              <i className="fas fa-file-pdf me-2"></i>
              Export PDF
            </Button>
            
            <Button
              variant="outline-success"
              onClick={handleExportExcel}
              disabled={loading}
            >
              <i className="fas fa-file-excel me-2"></i>
              Export Excel
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReportGenerator;