import React, { useState } from 'react';
import { Row, Col, Tab, Tabs } from 'react-bootstrap';
import ReportGenerator from '../components/reports/ReportGenerator';
import PayrollReport from '../components/reports/PayrollReport';
import AttendanceChart from '../components/reports/AttendanceChart';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [currentReport, setCurrentReport] = useState(null);

  const handleReportGenerated = (report) => {
    setCurrentReport(report);
    setActiveTab('view');
  };

  return (
    <div>
      <h2 className="mb-4">Reports & Analytics</h2>
      
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
              <div className="alert alert-info">
                <h6>Available Reports:</h6>
                <ul className="mb-0">
                  <li><strong>Payroll Report:</strong> Calculate wages for all workers</li>
                  <li><strong>Attendance Summary:</strong> Overview of attendance patterns</li>
                  <li><strong>Site Analysis:</strong> Performance by location</li>
                  <li><strong>Worker Performance:</strong> Individual worker metrics</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="view" title="View Report" disabled={!currentReport}>
          {currentReport && (
            <>
              {currentReport.type === 'payroll' && (
                <PayrollReport
                  data={currentReport.data}
                  startDate={currentReport.startDate}
                  endDate={currentReport.endDate}
                />
              )}
              
              {currentReport.type === 'attendance' && (
                <Row>
                  <Col lg={6}>
                    <AttendanceChart data={currentReport.data} type="daily" />
                  </Col>
                  <Col lg={6}>
                    <AttendanceChart data={currentReport.data} type="site" />
                  </Col>
                </Row>
              )}
            </>
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default Reports;