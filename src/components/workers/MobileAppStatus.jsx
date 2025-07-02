import React from 'react';
import { Alert, Button } from 'react-bootstrap';

const MobileAppStatus = ({ worker }) => {
  const sendAppDownloadLink = async () => {
    // Send SMS or email with app download link
    alert(`Download link sent to ${worker.email}`);
  };

  return (
    <Alert variant="info">
      <Alert.Heading>Mobile App Setup</Alert.Heading>
      <p>
        The worker needs to install the GeoAttendance mobile app to clock in/out.
      </p>
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Login Credentials:</strong><br />
          Email: {worker.email}<br />
          Password: Check email for reset link
        </div>
        <Button variant="primary" size="sm" onClick={sendAppDownloadLink}>
          Send App Link
        </Button>
      </div>
    </Alert>
  );
};

export default MobileAppStatus;