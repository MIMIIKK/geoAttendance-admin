import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Form, Button, InputGroup } from 'react-bootstrap';
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
      // Pass location as object with latitude and longitude keys
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
  const [position, setPosition] = useState(initialLocation ? [initialLocation.latitude, initialLocation.longitude] : center);
  const [mapCenter, setMapCenter] = useState(center);
  const [searchAddress, setSearchAddress] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialLocation) {
      setPosition([initialLocation.latitude, initialLocation.longitude]);
      setMapCenter([initialLocation.latitude, initialLocation.longitude]);
    }
  }, [initialLocation]);

  const handleLocationSelect = (newLocation) => {
    if (readOnly) return;

    const pos = [newLocation.latitude, newLocation.longitude];
    setPosition(pos);

    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;

    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newPosition = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPosition);
        setMapCenter(newPosition);

        if (mapRef.current) {
          mapRef.current.setView(newPosition, 16);
        }

        if (onLocationChange && !readOnly) {
          onLocationChange({ latitude: newPosition[0], longitude: newPosition[1] });
        }

        toast.success('Location found!');
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      toast.error('Error searching location');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = [position.coords.latitude, position.coords.longitude];
        setPosition(newPosition);
        setMapCenter(newPosition);

        if (mapRef.current) {
          mapRef.current.setView(newPosition, 16);
        }

        if (onLocationChange && !readOnly) {
          onLocationChange({ latitude: newPosition[0], longitude: newPosition[1] });
        }

        toast.success('Current location set!');
      },
      () => {
        toast.error('Error getting current location');
      }
    );
  };

  return (
    <div>
      {!readOnly && (
        <div className="mb-3">
          <InputGroup>
            <Form.Control
              placeholder="Search address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline-secondary" onClick={handleSearch}>
              <i className="fas fa-search"></i>
            </Button>
            <Button variant="outline-secondary" onClick={handleGetCurrentLocation}>
              <i className="fas fa-crosshairs"></i> Current Location
            </Button>
          </InputGroup>
          <small className="text-muted">Click on the map to set location</small>
        </div>
      )}

      <div style={{ height, width: '100%' }}>
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

      {position && (
        <div className="mt-2">
          <small className="text-muted">
            Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </small>
        </div>
      )}
    </div>
  );
};

export default SiteMap;
