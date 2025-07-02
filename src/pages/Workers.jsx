import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WorkerList from '../components/workers/WorkerList';
import WorkerForm from '../components/workers/WorkerForm';
import WorkerDetail from '../components/workers/WorkerDetail';

const Workers = () => {
  return (
    <Routes>
      <Route index element={<WorkerList />} />
      <Route path="new" element={<WorkerForm />} />
      <Route path=":email" element={<WorkerDetail />} />
      <Route path=":email/edit" element={<WorkerForm />} />
    </Routes>
  );
};

export default Workers;