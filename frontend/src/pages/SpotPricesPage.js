import React from 'react';
import SpotPriceMonitor from '../components/spotPrices/SpotPriceMonitor';
import MainLayout from '../components/layout/MainLayout';

/**
 * SpotPrices page component
 */
const SpotPricesPage = () => {
  return (
    <MainLayout>
      <SpotPriceMonitor />
    </MainLayout>
  );
};

export default SpotPricesPage;