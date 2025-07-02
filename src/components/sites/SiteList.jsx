import React, { useState, useEffect } from 'react';
import {
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Card
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { siteService } from '../../services/siteService';
import toast from 'react-hot-toast';

import SiteStats from './SiteStats';
import AllSitesMap from './AllSitesMap';
import SiteImportExport from './SiteImportExport';

const SiteList = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    loadSites();
  }, [filter]);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await siteService.getSitesWithStats();

      let filtered = data;
      if (filter === 'active') {
        filtered = data.filter((s) => s.isActive);
      } else if (filter === 'inactive') {
        filtered = data.filter((s) => !s.isActive);
      }

      setSites(filtered);
    } catch (err) {
      setError('Failed to load sites');
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
        const results = await siteService.searchSites(term);
        setSites(results);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else if (term === '') {
      loadSites();
    }
  };

  const handleDelete = async (siteId, siteName) => {
    if (window.confirm(`Are you sure you want to deactivate ${siteName}?`)) {
      try {
        await siteService.deleteSite(siteId);
        toast.success('Site deactivated successfully');
        loadSites();
      } catch (err) {
        toast.error('Failed to deactivate site');
      }
    }
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
      {/* Header with import/export and add button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Site Management</h3>
        <div className="d-flex gap-2">
          <SiteImportExport onImport={loadSites} />
          <Button variant="primary" onClick={() => navigate('/sites/new')}>
            <i className="fas fa-map-plus me-2"></i>
            Add Site
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats */}
      <SiteStats sites={sites} />

      {/* Search and filter */}
      <div className="d-flex gap-3 align-items-center mb-4">
        <InputGroup style={{ maxWidth: '400px' }}>
          <InputGroup.Text>
            <i className="fas fa-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Search sites..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </InputGroup>

        <Form.Select
          style={{ width: 'auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Sites</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </Form.Select>

        <div className="btn-group ms-auto" role="group">
          <button
            type="button"
            className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i> List
          </button>
          <button
            type="button"
            className={`btn btn-outline-secondary ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            <i className="fas fa-map"></i> Map
          </button>
        </div>
      </div>

      {/* Content view */}
      {viewMode === 'list' ? (
        <div className="row">
          {sites.length === 0 ? (
            <div className="col-12">
              <Card>
                <Card.Body className="text-center py-5">
                  <i className="fas fa-map-marked-alt fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No sites found</p>
                </Card.Body>
              </Card>
            </div>
          ) : (
            sites.map((site) => (
              <div key={site.id} className="col-lg-6 mb-3">
                <Card>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-1">{site.siteName}</h5>
                        <p className="text-muted mb-2">
                          <i className="fas fa-map-marker-alt me-2"></i>
                          {site.address}
                        </p>
                        <div className="d-flex gap-3 text-muted small">
                          <span>
                            <i className="fas fa-users me-1"></i>
                            {site.workerCount || 0} workers
                          </span>
                          <span>
                            <i className="fas fa-circle me-1"></i>
                            {site.radiusInMeters}m radius
                          </span>
                        </div>
                      </div>
                      <Badge bg={site.isActive ? 'success' : 'danger'}>
                        {site.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mt-3 d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/sites/${site.id}`)}
                      >
                        <i className="fas fa-eye me-1"></i> View
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => navigate(`/sites/${site.id}/edit`)}
                      >
                        <i className="fas fa-edit me-1"></i> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(site.id, site.siteName)}
                      >
                        <i className="fas fa-trash me-1"></i> Delete
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))
          )}
        </div>
      ) : (
        <AllSitesMap />
      )}
    </div>
  );
};

export default SiteList;
