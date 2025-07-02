import { useState, useEffect } from 'react';
import { workerService } from '../services/workerService';

export const useWorkers = (filters = {}) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workerService.getWorkers(filters);
      setWorkers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [JSON.stringify(filters)]);

  return {
    workers,
    loading,
    error,
    refetch: loadWorkers
  };
};