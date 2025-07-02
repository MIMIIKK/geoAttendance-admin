import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Card, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { siteService } from '../../services/siteService';

// Custom marker icons
const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const inactiveIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const AllSitesMap = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [showGeofence, setShowGeofence] = useState(true);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const data = await siteService.getSites(false); // Get all sites
      setSites(data);
    } catch (err) {
      console.error('Error loading sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = sites.filter((site) => site.isActive || showInactive);

  const centerLat =
    filteredSites.length > 0
      ? filteredSites.reduce((sum, site) => sum + site.latitude, 0) / filteredSites.length
      : 27.7172;

  const centerLng =
    filteredSites.length > 0
      ? filteredSites.reduce((sum, site) => sum + site.longitude, 0) / filteredSites.length
      : 85.3240;

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Sites Map</h5>
          <div className="d-flex gap-3">
            <Form.Check
              type="switch"
              label="Show Inactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <Form.Check
              type="switch"
              label="Show Geofence"
              checked={showGeofence}
              onChange={(e) => setShowGeofence(e.target.checked)}
            />
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div style={{ height: '500px', width: '100%' }}>
          <MapContainer center={[centerLat, centerLng]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredSites.map((site) => (
              <React.Fragment key={site.id}>
                <Marker
                  position={[site.latitude, site.longitude]}
                  icon={site.isActive ? activeIcon : inactiveIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h6 className="mb-2">{site.siteName}</h6>
                      <p className="mb-2 small">{site.address}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg={site.isActive ? 'success' : 'danger'}>
                          {site.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/sites/${site.id}`);
                          }}
                          className="small text-primary"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {showGeofence && (
                  <Circle
                    center={[site.latitude, site.longitude]}
                    radius={site.radiusInMeters}
                    pathOptions={{
                      fillColor: site.isActive ? 'green' : 'red',
                      fillOpacity: 0.1,
                      color: site.isActive ? 'green' : 'red',
                      weight: 1,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AllSitesMap;
