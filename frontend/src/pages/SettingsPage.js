import React from 'react';
import UserSettings from '../components/auth/UserSettings';
import MainLayout from '../components/layout/MainLayout';

/**
 * Settings page component
 */
const SettingsPage = () => {
  return (
    <MainLayout>
      <UserSettings />
    </MainLayout>
  );
};

export default SettingsPage;