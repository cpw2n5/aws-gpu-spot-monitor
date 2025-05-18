import React from 'react';
import FoldingMonitor from '../components/folding/FoldingMonitor';
import MainLayout from '../components/layout/MainLayout';

/**
 * Folding page component
 */
const FoldingPage = () => {
  return (
    <MainLayout>
      <FoldingMonitor />
    </MainLayout>
  );
};

export default FoldingPage;