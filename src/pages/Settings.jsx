import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Tab, Tabs, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

const Settings = () => {
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Palpa Services',
    address: '123 Business St, City, Country',
    phone: '+1 234 567 8900',
    email: 'admin@palpa.com',
    defaultRadius: 15,
    workHoursStart: '09:00',
    workHoursEnd: '17:00'
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    lateArrival: true,
    earlyDeparture: true,
    missedClockOut: true,
    dailySummary: false
  });

  const handleCompanyUpdate = (e) => {
    e.preventDefault();
    // Save to database
    toast.success('Company settings updated successfully');
  };

  const handleNotificationUpdate = (e) => {
    e.preventDefault();
    // Save to database
    toast.success('Notification settings updated successfully');
  };

  return (
    <div>
      <h2 className="mb-4">Settings</h2>

      <Tabs defaultActiveKey="company" className="mb-4">
        <Tab eventKey="company" title="Company">
          <Card>
            <Card.Body>
              <Form onSubmit={handleCompanyUpdate}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Company Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={companySettings.companyName}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          companyName: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          email: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={companySettings.address}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          address: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Default Geofence Radius (meters)</Form.Label>
                      <Form.Control
                        type="number"
                        value={companySettings.defaultRadius}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          defaultRadius: parseInt(e.target.value)
                        })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Work Hours Start</Form.Label>
                      <Form.Control
                        type="time"
                        value={companySettings.workHoursStart}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          workHoursStart: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Work Hours End</Form.Label>
                      <Form.Control
                        type="time"
                        value={companySettings.workHoursEnd}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          workHoursEnd: e.target.value
                        })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="primary">
                  Save Company Settings
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="notifications" title="Notifications">
          <Card>
            <Card.Body>
              <Form onSubmit={handleNotificationUpdate}>
                <h5 className="mb-3">Email Notifications</h5>

                <Form.Check
                  type="switch"
                  label="Enable email alerts"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    emailAlerts: e.target.checked
                  })}
                  className="mb-3"
                />

                <Form.Check
                  type="switch"
                  label="Alert on late arrival"
                  checked={notifications.lateArrival}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    lateArrival: e.target.checked
                  })}
                  disabled={!notifications.emailAlerts}
                  className="mb-3 ms-4"
                />

                <Form.Check
                  type="switch"
                  label="Alert on early departure"
                  checked={notifications.earlyDeparture}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    earlyDeparture: e.target.checked
                  })}
                  disabled={!notifications.emailAlerts}
                  className="mb-3 ms-4"
                />

                <Form.Check
                  type="switch"
                  label="Alert on missed clock out"
                  checked={notifications.missedClockOut}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    missedClockOut: e.target.checked
                  })}
                  disabled={!notifications.emailAlerts}
                  className="mb-3 ms-4"
                />

                <Form.Check
                  type="switch"
                  label="Send daily attendance summary"
                  checked={notifications.dailySummary}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    dailySummary: e.target.checked
                  })}
                  disabled={!notifications.emailAlerts}
                  className="mb-3 ms-4"
                />

                <Button type="submit" variant="primary">
                  Save Notification Settings
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="security" title="Security">
          <Card>
            <Card.Body>
              <h5 className="mb-3">Security Settings</h5>

              <Alert variant="info">
                <i className="fas fa-info-circle me-2"></i>
                Security settings help protect your data and ensure only authorized access.
              </Alert>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Session Timeout (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    defaultValue="30"
                    min="5"
                    max="120"
                  />
                  <Form.Text className="text-muted">
                    Automatically logout users after this period of inactivity
                  </Form.Text>
                </Form.Group>

                <Form.Check
                  type="switch"
                  label="Require strong passwords"
                  defaultChecked
                  className="mb-3"
                />

                <Form.Check
                  type="switch"
                  label="Enable two-factor authentication"
                  className="mb-3"
                />

                <Form.Check
                  type="switch"
                  label="Log all admin activities"
                  defaultChecked
                  className="mb-3"
                />

                <Button variant="primary">
                  Update Security Settings
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Settings;