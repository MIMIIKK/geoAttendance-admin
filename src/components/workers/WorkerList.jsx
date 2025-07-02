import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  ButtonGroup,
  Dropdown
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
        <Table hover className="worker-table d-none d-lg-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>
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
              <th style={{ width: '250px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-users fa-3x mb-3"></i>
                    <h5>No workers found</h5>
                    <p>Try adjusting your search or filter criteria</p>
                  </div>
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
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="worker-avatar me-2">
                        <i className="fas fa-user"></i>
                      </div>
                      <strong>{worker.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="text-muted">{worker.email}</span>
                  </td>
                  <td>{worker.phoneNumber || '-'}</td>
                  <td>
                    <Badge bg="light" text="dark">
                      {worker.siteName || 'Not Assigned'}
                    </Badge>
                  </td>
                  <td>
                    <strong className="text-success">${worker.payRate}/hr</strong>
                  </td>
                  <td>
                    <Badge bg={worker.isActive ? 'success' : 'danger'}>
                      {worker.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <div className="d-flex gap-1 flex-wrap">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate(`/workers/${worker.email}`)}
                          className="action-btn-with-text"
                        >
                          <i className="fas fa-eye me-1"></i>
                          View
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => navigate(`/workers/${worker.email}/edit`)}
                          className="action-btn-with-text"
                        >
                          <i className="fas fa-edit me-1"></i>
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(worker.email)}
                          className="action-btn-with-text"
                        >
                          <i className="fas fa-trash me-1"></i>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Mobile Card View */}
        <div className="d-lg-none">
          {workers.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted">
                <i className="fas fa-users fa-3x mb-3"></i>
                <h5>No workers found</h5>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="mobile-worker-list">
              {workers.map((worker) => (
                <div key={worker.id} className="mobile-worker-card">
                  <div className="card">
                    <div className="card-body">
                      {/* Header with checkbox and status */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <Form.Check
                          type="checkbox"
                          checked={selectedWorkers.includes(worker.email)}
                          onChange={() => handleSelectWorker(worker.email)}
                          className="mobile-checkbox"
                        />
                        <Badge bg={worker.isActive ? 'success' : 'danger'}>
                          {worker.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Worker Info */}
                      <div className="worker-info mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <div className="worker-avatar me-3">
                            <i className="fas fa-user"></i>
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{worker.name}</h6>
                            <small className="text-muted">{worker.email}</small>
                          </div>
                        </div>

                        <div className="worker-details">
                          <div className="row g-2">
                            <div className="col-6">
                              <div className="detail-item">
                                <small className="text-muted d-block">Phone</small>
                                <span className="fw-medium">{worker.phoneNumber || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="detail-item">
                                <small className="text-muted d-block">Pay Rate</small>
                                <span className="fw-medium text-success">${worker.payRate}/hr</span>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="detail-item">
                                <small className="text-muted d-block">Site</small>
                                <Badge bg="light" text="dark" className="mt-1">
                                  {worker.siteName || 'Not Assigned'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mobile-actions">
                        <div className="d-grid gap-2">
                          <div className="row g-2">
                            <div className="col-4">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/workers/${worker.email}`)}
                                className="w-100 mobile-action-btn"
                              >
                                <i className="fas fa-eye mb-1 d-block"></i>
                                <small>View</small>
                              </Button>
                            </div>
                            <div className="col-4">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => navigate(`/workers/${worker.email}/edit`)}
                                className="w-100 mobile-action-btn"
                              >
                                <i className="fas fa-edit mb-1 d-block"></i>
                                <small>Edit</small>
                              </Button>
                            </div>
                            <div className="col-4">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(worker.email)}
                                className="w-100 mobile-action-btn"
                              >
                                <i className="fas fa-trash mb-1 d-block"></i>
                                <small>Delete</small>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tablet View (md screens) */}
        <Table hover className="worker-table d-none d-md-table d-lg-none">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <Form.Check
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    workers.length > 0 &&
                    selectedWorkers.length === workers.length
                  }
                />
              </th>
              <th>Worker</th>
              <th>Site & Pay</th>
              <th>Status</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-users fa-3x mb-3"></i>
                    <h5>No workers found</h5>
                    <p>Try adjusting your search or filter criteria</p>
                  </div>
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
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="worker-avatar me-2">
                        <i className="fas fa-user"></i>
                      </div>
                      <div>
                        <div className="fw-bold">{worker.name}</div>
                        <small className="text-muted">{worker.email}</small>
                        {worker.phoneNumber && (
                          <small className="text-muted d-block">{worker.phoneNumber}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <Badge bg="light" text="dark" className="d-block mb-1">
                        {worker.siteName || 'Not Assigned'}
                      </Badge>
                      <strong className="text-success">${worker.payRate}/hr</strong>
                    </div>
                  </td>
                  <td>
                    <Badge bg={worker.isActive ? 'success' : 'danger'}>
                      {worker.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle 
                        variant="outline-secondary" 
                        size="sm" 
                        id={`dropdown-tablet-${worker.email}`}
                        className="w-100"
                      >
                        <i className="fas fa-ellipsis-v me-1"></i>
                        Actions
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => navigate(`/workers/${worker.email}`)}>
                          <i className="fas fa-eye me-2"></i>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => navigate(`/workers/${worker.email}/edit`)}>
                          <i className="fas fa-edit me-2"></i>
                          Edit Worker
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          onClick={() => handleDelete(worker.email)}
                          className="text-danger"
                        >
                          <i className="fas fa-trash me-2"></i>
                          Delete Worker
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <style jsx>{`
        .worker-table {
          font-size: 0.9rem;
        }

        .worker-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #007bff, #0dcaf0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.25rem;
          justify-content: flex-start;
        }

        .action-btn-with-text {
          min-width: auto;
          height: 32px;
          padding: 0.375rem 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: all 0.2s ease-in-out;
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .action-btn-with-text:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-btn {
          min-width: 35px;
          height: 32px;
          padding: 0.25rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: all 0.2s ease-in-out;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-group .action-btn:first-child {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        .btn-group .action-btn:not(:first-child):not(:last-child) {
          border-radius: 0;
          border-left: 0;
        }

        .btn-group .action-btn:last-child {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          border-left: 0;
        }

        .btn-group .action-btn:not(:first-child) {
          margin-left: -1px;
        }

        .table td {
          vertical-align: middle;
          padding: 0.875rem 0.75rem;
        }

        .table th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          padding: 1rem 0.75rem;
        }

        .table-hover tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.05);
        }

        /* Mobile Card Layout */
        .mobile-worker-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-worker-card {
          width: 100%;
        }

        .mobile-worker-card .card {
          border-radius: 0.75rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }

        .mobile-worker-card .card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .mobile-checkbox {
          transform: scale(1.2);
        }

        .worker-info {
          border-bottom: 1px solid #f8f9fa;
        }

        .detail-item {
          padding: 0.25rem 0;
        }

        .mobile-action-btn {
          border-radius: 0.5rem;
          padding: 0.75rem 0.25rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60px;
          transition: all 0.2s ease;
        }

        .mobile-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .mobile-action-btn i {
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }

        .mobile-action-btn small {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Header Responsive */
        .d-flex.justify-content-between.align-items-center.mb-4 {
          flex-direction: column;
          align-items: stretch;
          gap: 1rem;
        }

        .d-flex.justify-content-between.align-items-center.mb-4 > .d-flex {
          justify-content: center;
        }

        /* Search and Filter Responsive */
        .d-flex.gap-3.mb-4.flex-wrap {
          flex-direction: column;
          gap: 1rem !important;
        }

        .d-flex.gap-3.mb-4.flex-wrap .input-group,
        .d-flex.gap-3.mb-4.flex-wrap .form-select {
          max-width: none !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default WorkerList;