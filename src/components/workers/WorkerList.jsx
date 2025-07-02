import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workerService } from '../../services/workerService';
import WorkerImportExport from './WorkerImportExport';
import WorkerBatchActions from './WorkerBatchActions';
import WorkerStats from './WorkerStats';

const WorkerList = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  useEffect(() => {
    loadWorkers();
  }, [filter]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      let filters = {};
      if (filter === 'active') filters.isActive = true;
      if (filter === 'inactive') filters.isActive = false;

      const data = await workerService.getWorkers(filters);
      setWorkers(data);
    } catch (err) {
      setError('Failed to load workers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length > 2) {
      try {
        const results = await workerService.searchWorkers(term);
        setWorkers(results);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else if (term === '') {
      loadWorkers();
    }
  };

  const handleDelete = async (email) => {
    if (window.confirm('Are you sure you want to deactivate this worker?')) {
      try {
        await workerService.deleteWorker(email);
        toast.success('Worker deactivated successfully');
        loadWorkers();
      } catch (err) {
        toast.error('Failed to deactivate worker');
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedWorkers(workers.map(w => w.email));
    } else {
      setSelectedWorkers([]);
    }
  };

  const handleSelectWorker = (email) => {
    setSelectedWorkers(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Workers Management</h3>
        <div className="d-flex gap-2">
          <WorkerImportExport onImport={loadWorkers} />
          <Button
            variant="primary"
            onClick={() => navigate('/workers/new')}
          >
            <i className="fas fa-user-plus me-2"></i>
            Add Worker
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Worker Stats */}
      <WorkerStats workers={workers} />

      {/* Search and Filter */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        <InputGroup style={{ maxWidth: '400px' }}>
          <InputGroup.Text>
            <i className="fas fa-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Search workers..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </InputGroup>

        <Form.Select
          style={{ width: 'auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Workers</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </Form.Select>
      </div>

      {/* Batch Action Bar */}
      {selectedWorkers.length > 0 && (
        <div className="mb-3 p-3 bg-light rounded d-flex justify-content-between align-items-center">
          <span>{selectedWorkers.length} workers selected</span>
          <WorkerBatchActions
            selectedWorkers={selectedWorkers}
            onComplete={() => {
              setSelectedWorkers([]);
              loadWorkers();
            }}
          />
        </div>
      )}

      {/* Worker Table */}
      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>
                <Form.Check
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    workers.length > 0 &&
                    selectedWorkers.length === workers.length
                  }
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Site</th>
              <th>Pay Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  No workers found
                </td>
              </tr>
            ) : (
              workers.map((worker) => (
                <tr key={worker.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedWorkers.includes(worker.email)}
                      onChange={() => handleSelectWorker(worker.email)}
                    />
                  </td>
                  <td>{worker.name}</td>
                  <td>{worker.email}</td>
                  <td>{worker.phoneNumber || '-'}</td>
                  <td>{worker.siteName || 'Not Assigned'}</td>
                  <td>${worker.payRate}/hr</td>
                  <td>
                    <Badge bg={worker.isActive ? 'success' : 'danger'}>
                      {worker.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/workers/${worker.email}`)}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/workers/${worker.email}/edit`)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(worker.email)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default WorkerList;
