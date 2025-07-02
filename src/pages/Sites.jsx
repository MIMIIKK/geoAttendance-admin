import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SiteList from '../components/sites/SiteList';
import SiteForm from '../components/sites/SiteForm';
import SiteDetail from '../components/sites/SiteDetail';

const Sites = () => {
  return (
    <Routes>
      <Route index element={<SiteList />} />
      <Route path="new" element={<SiteForm />} />
      <Route path=":siteId" element={<SiteDetail />} />
      <Route path=":siteId/edit" element={<SiteForm />} />
    </Routes>
  );
};

export default Sites;