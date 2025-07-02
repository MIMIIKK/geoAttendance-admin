import React, { useState } from 'react';
import { Button, ButtonGroup, Modal, Form } from 'react-bootstrap';
import { workerService } from '../../services/workerService';
import { siteService } from '../../services/siteService';
import toast from 'react-hot-toast';

const WorkerBatchActions = ({ selectedWorkers, onComplete }) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [payRate, setPayRate] = useState('');

  const handleActionClick = async (actionType) => {
    setAction(actionType);
    
    if (actionType === 'assignSite') {
      const siteList = await siteService.getSites();
      setSites(siteList);
    }
    
    setShowModal(true);
  };

  const handleExecute = async () => {
    try {
      switch (action) {
        case 'activate':
          for (const email of selectedWorkers) {
            await workerService.updateWorker(email, { isActive: true });
          }
          toast.success(`Activated ${selectedWorkers.length} workers`);
          break;
          
        case 'deactivate':
          for (const email of selectedWorkers) {
            await workerService.updateWorker(email, { isActive: false });
          }
          toast.success(`Deactivated ${selectedWorkers.length} workers`);
          break;
          
        case 'assignSite':
          const site = sites.find(s => s.id === selectedSite);
          for (const email of selectedWorkers) {
            await workerService.updateWorker(email, {
              siteId: selectedSite,
              siteName: site?.siteName
            });
          }
          toast.success(`Assigned ${selectedWorkers.length} workers to ${site?.siteName}`);
          break;
          
        case 'updatePayRate':
          for (const email of selectedWorkers) {
            await workerService.updateWorker(email, {
              payRate: parseFloat(payRate)
            });
          }
          toast.success(`Updated pay rate for ${selectedWorkers.length} workers`);
          break;
      }
      
      setShowModal(false);
      onComplete();
    } catch (err) {
      toast.error('Batch operation failed');
    }
  };

  return (
    <>
      <ButtonGroup size="sm">
        <Button 
          variant="outline-success"
          onClick={() => handleActionClick('activate')}
          disabled={selectedWorkers.length === 0}
        >
          Activate
        </Button>
        <Button 
          variant="outline-danger"
          onClick={() => handleActionClick('deactivate')}
          disabled={selectedWorkers.length === 0}
        >
          Deactivate
        </Button>
        <Button 
          variant="outline-info"
          onClick={() => handleActionClick('assignSite')}
          disabled={selectedWorkers.length === 0}
        >
          Assign Site
        </Button>
        <Button 
          variant="outline-warning"
          onClick={() => handleActionClick('updatePayRate')}
          disabled={selectedWorkers.length === 0}
        >
          Update Pay Rate
        </Button>
      </ButtonGroup>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Batch Operation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This will affect {selectedWorkers.length} selected workers.</p>
          
          {action === 'assignSite' && (
            <Form.Group>
              <Form.Label>Select Site</Form.Label>
              <Form.Select 
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">Choose a site...</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.siteName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          
          {action === 'updatePayRate' && (
            <Form.Group>
              <Form.Label>New Pay Rate ($/hour)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={payRate}
                onChange={(e) => setPayRate(e.target.value)}
                placeholder="Enter new pay rate"
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExecute}
            disabled={
              (action === 'assignSite' && !selectedSite) ||
              (action === 'updatePayRate' && !payRate)
            }
          >
            Execute
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default WorkerBatchActions;