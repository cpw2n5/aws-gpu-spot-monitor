import React from 'react';
import Dashboard from '../components/dashboard/Dashboard';
import MainLayout from '../components/layout/MainLayout';

/**
 * Dashboard page component
 */
const DashboardPage = () => {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
};

export default DashboardPage;