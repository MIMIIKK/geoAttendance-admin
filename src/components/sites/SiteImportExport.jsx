import React, { useRef } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { siteService } from '../../services/siteService';
import toast from 'react-hot-toast';

const SiteImportExport = ({ onImport }) => {
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      const sites = await siteService.getSites(false);
      
      // Convert to CSV
      const headers = ['Site Name', 'Address', 'Latitude', 'Longitude', 'Radius (m)', 'Status'];
      const rows = sites.map(s => [
        s.siteName,
        s.address.replace(/,/g, ';'), // Replace commas in address
        s.latitude,
        s.longitude,
        s.radiusInMeters,
        s.isActive ? 'Active' : 'Inactive'
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sites-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Sites exported successfully');
    } catch (err) {
      toast.error('Failed to export sites');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const sites = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
          sites.push({
            siteName: values[0],
            address: values[1].replace(/;/g, ','), // Restore commas
            latitude: parseFloat(values[2]),
            longitude: parseFloat(values[3]),
            radiusInMeters: parseFloat(values[4]),
            isActive: values[5] === 'Active'
          });
        }
      }
      
      // Batch import sites
      let successCount = 0;
      for (const site of sites) {
        try {
          await siteService.createSite(site);
          successCount++;
        } catch (err) {
          console.error('Failed to import site:', site.siteName);
        }
      }
      
      toast.success(`Imported ${successCount} of ${sites.length} sites`);
      onImport && onImport();
    } catch (err) {
      toast.error('Failed to import sites');
    }
    
    // Reset input
    e.target.value = '';
  };

  return (
    <ButtonGroup size="sm" className="me-2">
      <Button variant="outline-secondary" onClick={handleExport}>
        <i className="fas fa-download me-2"></i>
        Export
      </Button>
      <Button 
        variant="outline-secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        <i className="fas fa-upload me-2"></i>
        Import
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
    </ButtonGroup>
  );
};

export default SiteImportExport;