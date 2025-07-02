import React, { useState } from 'react';
import { Row, Col, Tab, Tabs, Card, Alert, Button } from 'react-bootstrap';
import ReportGenerator from '../components/reports/ReportGenerator';
import PayrollReport from '../components/reports/PayrollReport';
import AttendanceSummaryReport from '../components/reports/AttendanceSummaryReport';
import SiteAnalysisReport from '../components/reports/SiteAnalysisReport';
import WorkerPerformanceReport from '../components/reports/WorkerPerformanceReport';
import { reportService } from '../services/reportService';
import toast from 'react-hot-toast';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReportGenerated = (report) => {
    console.log('Report generated:', report);
    setCurrentReport(report);
    setActiveTab('view');
  };


  const handleExportExcel = async () => {
    if (!currentReport) {
      toast.error('No report to export');
      return;
    }

    try {
      setLoading(true);
      
      const reportTypeName = {
        'payroll': 'Payroll',
        'attendance': 'Attendance Summary',
        'site': 'Site Analysis',
        'worker': 'Worker Performance'
      }[currentReport.type];

      await reportService.exportToExcel(
        reportTypeName,
        currentReport.data,
        currentReport.startDate,
        currentReport.endDate
      );
      
      toast.success('Excel exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel');
    } finally {
      setLoading(false);
    }
  };

  const renderReport = () => {
    if (!currentReport) {
      return (
        <Alert variant="info">
          <Alert.Heading>No Report Generated</Alert.Heading>
          <p>Please generate a report first to view it here.</p>
          <Button variant="primary" onClick={() => setActiveTab('generate')}>
            Generate Report
          </Button>
        </Alert>
      );
    }

    const { type, data, startDate, endDate } = currentReport;

    // Check if data exists and is not empty
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return (
        <Alert variant="warning">
          <Alert.Heading>No Data Found</Alert.Heading>
          <p>No data available for the selected date range and report type.</p>
          <Button variant="primary" onClick={() => setActiveTab('generate')}>
            Try Different Dates
          </Button>
        </Alert>
      );
    }

    // Handle different report types
    switch (type) {
      case 'payroll':
        return (
          <PayrollReport
            data={data}
            startDate={startDate}
            endDate={endDate}
          />
        );
      
      case 'attendance':
        return (
          <AttendanceSummaryReport
            data={data}
            startDate={startDate}
            endDate={endDate}
          />
        );
      
      case 'site':
        return (
          <SiteAnalysisReport
            data={data}
            startDate={startDate}
            endDate={endDate}
          />
        );
      
      case 'worker':
        return (
          <WorkerPerformanceReport
            data={data}
            startDate={startDate}
            endDate={endDate}
          />
        );
      
      default:
        return (
          <Alert variant="danger">
            <Alert.Heading>Unknown Report Type</Alert.Heading>
            <p>The report type "{type}" is not supported.</p>
          </Alert>
        );
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Reports & Analytics</h2>
        
        {/* Export buttons - only show when viewing a report */}
        {activeTab === 'view' && currentReport && (
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              onClick={handleExportExcel}
              disabled={loading}
              size="sm"
            >
              <i className="fas fa-file-excel me-2"></i>
              Export Excel
            </Button>
          </div>
        )}
      </div>
      
      <Tabs
        id="reports-tabs"
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="generate" title="Generate Report">
          <Row>
            <Col lg={8}>
              <ReportGenerator onGenerate={handleReportGenerated} />
            </Col>
            <Col lg={4}>
              <Card className="bg-light border-0">
                <Card.Body>
                  <h6 className="fw-bold mb-3">📊 Available Reports</h6>
                  <div className="small">
                    <div className="mb-3">
                      <strong className="text-primary">💰 Payroll Report</strong>
                      <p className="mb-0 text-muted">Calculate wages, hours, and earnings for all workers with detailed breakdown by employee.</p>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-success">📅 Attendance Summary</strong>
                      <p className="mb-0 text-muted">Overview of attendance patterns with daily trends, site breakdowns, and visual charts.</p>
                    </div>
                    
                    <div className="mb-3">
                      <strong className="text-info">🏗️ Site Analysis</strong>
                      <p className="mb-0 text-muted">Performance metrics by location including utilization rates and peak activity periods.</p>
                    </div>
                    
                    <div className="mb-0">
                      <strong className="text-warning">👤 Worker Performance</strong>
                      <p className="mb-0 text-muted">Individual worker metrics including punctuality, productivity, and performance insights.</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Report History or Quick Stats */}
              <Card className="mt-4 bg-light border-0">
                <Card.Body>
                  <h6 className="fw-bold mb-3">🚀 Quick Tips</h6>
                  <ul className="small mb-0">
                    <li>Use <strong>preset date ranges</strong> for quick report generation</li>
                    <li>Site Analysis shows <strong>utilization rates</strong> to optimize resource allocation</li>
                    <li>Worker Performance tracks <strong>punctuality</strong> and productivity metrics</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Reports;