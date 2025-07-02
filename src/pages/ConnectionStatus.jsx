import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { testConnection } from '../utils/testConnection';
import { workerService } from '../services/workerService';
import { siteService } from '../services/siteService';

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    firebase: 'checking',
    workers: 0,
    sites: 0,
    activeToday: 0
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Test Firebase connection
      const connected = await testConnection();
      
      // Get counts
      const workers = await workerService.getWorkers();
      const sites = await siteService.getSites();
      
      setStatus({
        firebase: connected ? 'connected' : 'error',
        workers: workers.length,
        sites: sites.length,
        activeToday: 0 // Would need to query attendance
      });
    } catch (error) {
      setStatus(prev => ({ ...prev, firebase: 'error' }));
    }
  };

  return (
    <div>
      <h2 className="mb-4">System Connection Status</h2>
      
      <Alert variant="info">
        <h5>Integration Overview</h5>
        <p>Both the Admin Portal and Android App are connected to the same Firebase backend.</p>
      </Alert>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Connection Status</h5>
        </Card.Header>
        <Card.Body>
          <Table>
            <tbody>
              <tr>
                <td>Firebase Connection</td>
                <td>
                  <Badge bg={status.firebase === 'connected' ? 'success' : 'danger'}>
                    {status.firebase}
                  </Badge>
                </td>
              </tr>
              <tr>
                <td>Total Workers</td>
                <td>{status.workers}</td>
              </tr>
              <tr>
                <td>Total Sites</td>
                <td>{status.sites}</td>
              </tr>
              <tr>
                <td>Active Today</td>
                <td>{status.activeToday}</td>
              </tr>
            </tbody>
          </Table>
          
          <Button variant="primary" onClick={checkStatus}>
            Refresh Status
          </Button>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">Quick Setup Guide</h5>
        </Card.Header>
        <Card.Body>
          <ol>
            <li>Create workers in the admin portal</li>
            <li>Workers receive email with password reset link</li>
            <li>Workers download the Android app</li>
            <li>Workers login with email and new password</li>
            <li>Workers can now clock in/out with GPS verification</li>
            <li>Admin sees real-time updates in this portal</li>
          </ol>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ConnectionStatus;