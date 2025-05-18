import React from 'react';
import UserProfile from '../components/auth/UserProfile';
import MainLayout from '../components/layout/MainLayout';

/**
 * Profile page component
 */
const ProfilePage = () => {
  return (
    <MainLayout>
      <UserProfile />
    </MainLayout>
  );
};

export default ProfilePage;