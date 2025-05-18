import React from 'react';
import InstanceManagement from '../components/instances/InstanceManagement';
import MainLayout from '../components/layout/MainLayout';

/**
 * Instances page component
 */
const InstancesPage = () => {
  return (
    <MainLayout>
      <InstanceManagement />
    </MainLayout>
  );
};

export default InstancesPage;