import React, { useRef } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { workerService } from '../../services/workerService';
import toast from 'react-hot-toast';

const WorkerImportExport = ({ onImport }) => {
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      const workers = await workerService.getWorkers();
      
      // Convert to CSV
      const headers = ['Name', 'Email', 'Phone', 'Site', 'Pay Rate', 'Status'];
      const rows = workers.map(w => [
        w.name,
        w.email,
        w.phoneNumber || '',
        w.siteName || '',
        w.payRate,
        w.isActive ? 'Active' : 'Inactive'
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
      a.download = `workers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Workers exported successfully');
    } catch (err) {
      toast.error('Failed to export workers');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const workers = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
          workers.push({
            name: values[0],
            email: values[1],
            phoneNumber: values[2],
            siteName: values[3],
            payRate: parseFloat(values[4]),
            isActive: values[5] === 'Active'
          });
        }
      }
      
      // TODO: Batch import workers
      toast.success(`Imported ${workers.length} workers`);
      onImport && onImport();
    } catch (err) {
      toast.error('Failed to import workers');
    }
    
    // Reset input
    e.target.value = '';
  };

  return (
    <ButtonGroup>
      <Button variant="outline-primary" size="sm" onClick={handleExport}>
        <i className="fas fa-download me-2"></i>
        Export
      </Button>
      <Button 
        variant="outline-primary" 
        size="sm"
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

export default WorkerImportExport;