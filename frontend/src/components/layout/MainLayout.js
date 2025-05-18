import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import Navbar from './Navbar';
import { SidebarContainer } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Main layout component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // If user is authenticated, show sidebar layout
  if (isAuthenticated) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <Navbar />
        <SidebarContainer>
          {children}
        </SidebarContainer>
      </Box>
    );
  }

  // If user is not authenticated, show only navbar
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Navbar />
      <Box pt="60px">
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;