import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import SpotPricesPage from './pages/SpotPricesPage';
import InstancesPage from './pages/InstancesPage';
import FoldingPage from './pages/FoldingPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Extend the theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f1ff',
      100: '#b8d4ff',
      200: '#8ab7ff',
      300: '#5c9aff',
      400: '#2e7dff',
      500: '#0064e6',
      600: '#004eb4',
      700: '#003882',
      800: '#002251',
      900: '#000c21',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

/**
 * Main App component
 */
const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
};

/**
 * App routes component
 */
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spot-prices"
        element={
          <ProtectedRoute>
            <SpotPricesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instances"
        element={
          <ProtectedRoute>
            <InstancesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/folding"
        element={
          <ProtectedRoute>
            <FoldingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect to dashboard if authenticated, otherwise to login */}
      <Route
        path="*"
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
};

export default App;