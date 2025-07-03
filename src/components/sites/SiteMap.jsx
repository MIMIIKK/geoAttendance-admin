import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Form, Button, InputGroup, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import toast from 'react-hot-toast';

// Fix for default leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
};

const SiteMap = ({
  center = [27.7172, 85.3240], // Kathmandu default
  zoom = 13,
  radius = 15,
  onLocationChange,
  initialLocation = null,
  height = '400px',
  readOnly = false
}) => {
  const [position, setPosition] = useState(
    initialLocation 
      ? [initialLocation.latitude, initialLocation.longitude] 
      : null
  );
  const [mapCenter, setMapCenter] = useState(center);
  const [searchAddress, setSearchAddress] = useState('');
  const [latitude, setLatitude] = useState(
    initialLocation?.latitude?.toString() || ''
  );
  const [longitude, setLongitude] = useState(
    initialLocation?.longitude?.toString() || ''
  );
  const [coordinateFormat, setCoordinateFormat] = useState('decimal'); // 'decimal' or 'dms'
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialLocation) {
      const pos = [initialLocation.latitude, initialLocation.longitude];
      setPosition(pos);
      setMapCenter(pos);
      setLatitude(initialLocation.latitude.toString());
      setLongitude(initialLocation.longitude.toString());
    }
  }, [initialLocation]);

  // Validate coordinate input
  const isValidCoordinate = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return !isNaN(latNum) && !isNaN(lngNum) && 
           latNum >= -90 && latNum <= 90 && 
           lngNum >= -180 && lngNum <= 180;
  };

  const handleLocationSelect = (newLocation) => {
    if (readOnly) return;

    const pos = [newLocation.latitude, newLocation.longitude];
    setPosition(pos);
    setLatitude(newLocation.latitude.toFixed(6));
    setLongitude(newLocation.longitude.toFixed(6));

    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const handleCoordinateInput = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!isValidCoordinate(lat, lng)) {
      toast.error('Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)');
      return;
    }

    const newPosition = [lat, lng];
    setPosition(newPosition);
    setMapCenter(newPosition);

    if (mapRef.current) {
      mapRef.current.setView(newPosition, 16);
    }

    if (onLocationChange && !readOnly) {
      onLocationChange({ latitude: lat, longitude: lng });
    }

    toast.success('Location set from coordinates!');
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      toast.error('Please enter an address to search');
      return;
    }

    setIsSearching(true);
    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5&countrycodes=np&addressdetails=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPosition = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPosition);
        setMapCenter(newPosition);
        setLatitude(parseFloat(lat).toFixed(6));
        setLongitude(parseFloat(lon).toFixed(6));

        if (mapRef.current) {
          mapRef.current.setView(newPosition, 16);
        }

        if (onLocationChange && !readOnly) {
          onLocationChange({ latitude: newPosition[0], longitude: newPosition[1] });
        }

        toast.success(`Location found: ${display_name.split(',').slice(0, 2).join(', ')}`);
      } else {
        toast.error('Location not found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = [position.coords.latitude, position.coords.longitude];
        setPosition(newPosition);
        setMapCenter(newPosition);
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));

        if (mapRef.current) {
          mapRef.current.setView(newPosition, 16);
        }

        if (onLocationChange && !readOnly) {
          onLocationChange({ latitude: newPosition[0], longitude: newPosition[1] });
        }

        toast.dismiss();
        toast.success('Current location set!');
      },
      (error) => {
        toast.dismiss();
        console.error('Geolocation error:', error);
        toast.error('Error getting current location. Please check your location permissions.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Convert decimal to degrees, minutes, seconds
  const decimalToDMS = (decimal, isLongitude = false) => {
    const degrees = Math.floor(Math.abs(decimal));
    const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
    const seconds = ((Math.abs(decimal) - degrees - minutes / 60) * 3600).toFixed(2);
    const direction = decimal >= 0 
      ? (isLongitude ? 'E' : 'N') 
      : (isLongitude ? 'W' : 'S');
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  const copyCoordinates = () => {
    if (!position) {
      toast.error('No coordinates to copy');
      return;
    }

    const coords = coordinateFormat === 'decimal' 
      ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`
      : `${decimalToDMS(position[0])}, ${decimalToDMS(position[1], true)}`;

    navigator.clipboard.writeText(coords).then(() => {
      toast.success('Coordinates copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy coordinates');
    });
  };

  return (
    <div>
      {!readOnly && (
        <div className="mb-3">
          {/* Address Search */}
          <div className="mb-3">
            <label className="form-label fw-bold">
              <i className="fas fa-search me-2"></i>
              Search by Address
            </label>
            <InputGroup>
              <Form.Control
                placeholder="Enter address (e.g., Thamel, Kathmandu)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
              />
              <Button 
                variant="outline-secondary" 
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <span className="spinner-border spinner-border-sm me-1" />
                ) : (
                  <i className="fas fa-search me-1"></i>
                )}
                Search
              </Button>
            </InputGroup>
          </div>

          {/* Coordinate Input */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-bold mb-0">
                <i className="fas fa-map-pin me-2"></i>
                Enter Coordinates
              </label>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-decoration-none p-0"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>
            
            <Row>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="small text-muted">Latitude (-90 to 90)</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    placeholder="27.7172"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className={!isValidCoordinate(latitude, longitude) && latitude && longitude ? 'is-invalid' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="small text-muted">Longitude (-180 to 180)</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    placeholder="85.3240"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className={!isValidCoordinate(latitude, longitude) && latitude && longitude ? 'is-invalid' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Label className="small text-muted d-block">&nbsp;</Form.Label>
                <Button
                  variant="primary"
                  onClick={handleCoordinateInput}
                  disabled={!isValidCoordinate(latitude, longitude)}
                  className="w-100"
                >
                  <i className="fas fa-crosshairs"></i>
                </Button>
              </Col>
            </Row>

            {/* Advanced Options */}
            {showAdvanced && (
              <Card className="mt-3 border-0 bg-light">
                <Card.Body className="py-2">
                  <Row className="align-items-center">
                    <Col md={6}>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleGetCurrentLocation}
                        className="me-2"
                      >
                        <i className="fas fa-location-arrow me-1"></i>
                        Use Current Location
                      </Button>
                      {position && (
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={copyCoordinates}
                        >
                          <i className="fas fa-copy me-1"></i>
                          Copy Coordinates
                        </Button>
                      )}
                    </Col>
                    <Col md={6}>
                      <Form.Select
                        size="sm"
                        value={coordinateFormat}
                        onChange={(e) => setCoordinateFormat(e.target.value)}
                      >
                        <option value="decimal">Decimal Degrees</option>
                        <option value="dms">Degrees, Minutes, Seconds</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </div>

          <Alert variant="info" className="py-2">
            <small>
              <i className="fas fa-info-circle me-2"></i>
              <strong>Tip:</strong> Click anywhere on the map to set location, or use the search/coordinate tools above.
            </small>
          </Alert>
        </div>
      )}

      {/* Map */}
      <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {!readOnly && <LocationPicker onLocationSelect={handleLocationSelect} />}

          {position && (
            <>
              <Marker position={position} />
              <Circle
                center={position}
                radius={radius}
                pathOptions={{
                  fillColor: 'blue',
                  fillOpacity: 0.2,
                  color: 'blue',
                  weight: 2
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Coordinate Display */}
      {position && (
        <div className="mt-3 p-3 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">
                <i className="fas fa-map-marker-alt text-primary me-2"></i>
                Selected Location
              </h6>
              <div className="d-flex gap-3">
                <small className="text-muted">
                  <strong>Decimal:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </small>
                <small className="text-muted">
                  <strong>DMS:</strong> {decimalToDMS(position[0])}, {decimalToDMS(position[1], true)}
                </small>
              </div>
            </div>
            <Badge bg="primary" className="px-3 py-2">
              <i className="fas fa-circle me-1"></i>
              {radius}m radius
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteMap;