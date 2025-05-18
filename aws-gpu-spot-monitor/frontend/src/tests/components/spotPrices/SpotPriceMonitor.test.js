import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, mockServiceResponses, setupServiceMock, resetMocks } from '../../utils/test-utils';
import SpotPriceMonitor from '../../../components/spotPrices/SpotPriceMonitor';
import SpotPriceService from '../../../services/spotPrice.service';
import { useQuery } from '@tanstack/react-query';

// Mock the services
jest.mock('../../../services/spotPrice.service');

describe('SpotPriceMonitor Component', () => {
  beforeEach(() => {
    resetMocks();
    
    // Mock useQuery hook
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instanceTypes') {
        return {
          data: mockServiceResponses.getSupportedInstanceTypes,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'regions') {
        return {
          data: mockServiceResponses.getSupportedRegions,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'spotPrices') {
        return {
          data: mockServiceResponses.getCurrentSpotPrices,
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
          isFetching: false
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Mock service methods
    SpotPriceService.getSupportedInstanceTypes.mockResolvedValue(mockServiceResponses.getSupportedInstanceTypes);
    SpotPriceService.getSupportedRegions.mockResolvedValue(mockServiceResponses.getSupportedRegions);
    SpotPriceService.getCurrentSpotPrices.mockResolvedValue(mockServiceResponses.getCurrentSpotPrices);
  });

  it('renders the component with spot price data', async () => {
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Check if the component title is rendered
    expect(screen.getByText('Spot Price Monitor')).toBeInTheDocument();
    
    // Check if the filters are rendered
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Instance Type')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    
    // Check if the spot prices table is rendered
    expect(screen.getByText('Current Spot Prices')).toBeInTheDocument();
    
    // Check if the table headers are rendered
    expect(screen.getByText('Instance Type')).toBeInTheDocument();
    expect(screen.getByText('Availability Zone')).toBeInTheDocument();
    expect(screen.getByText('Spot Price')).toBeInTheDocument();
    expect(screen.getByText('Price Threshold')).toBeInTheDocument();
    
    // Check if the refresh button is rendered
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    
    // Wait for the spot prices to be rendered
    await waitFor(() => {
      // Check if at least one spot price is rendered
      expect(screen.getByText('p3.2xlarge')).toBeInTheDocument();
      expect(screen.getByText('us-east-1a')).toBeInTheDocument();
      // Check for the formatted price (this might be different based on your formatting)
      expect(screen.getByText('$1.2345')).toBeInTheDocument();
    });
  });

  it('filters spot prices by region', async () => {
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Select a region
    const regionSelect = screen.getByLabelText('Region');
    fireEvent.change(regionSelect, { target: { value: 'us-east-1' } });
    
    // Mock the service call with filtered data
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instanceTypes') {
        return {
          data: mockServiceResponses.getSupportedInstanceTypes,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'regions') {
        return {
          data: mockServiceResponses.getSupportedRegions,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'spotPrices') {
        // Filter prices for us-east-1
        const filteredPrices = {
          ...mockServiceResponses.getCurrentSpotPrices,
          prices: mockServiceResponses.getCurrentSpotPrices.prices.filter(
            price => price.region === 'us-east-1'
          )
        };
        return {
          data: filteredPrices,
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
          isFetching: false
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Wait for the filtered spot prices to be rendered
    await waitFor(() => {
      // Check if us-east-1 prices are rendered
      expect(screen.getByText('us-east-1a')).toBeInTheDocument();
      expect(screen.getByText('us-east-1b')).toBeInTheDocument();
      
      // Check that us-west-2 prices are not rendered
      expect(screen.queryByText('us-west-2a')).not.toBeInTheDocument();
    });
  });

  it('filters spot prices by instance type', async () => {
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Select an instance type
    const instanceTypeSelect = screen.getByLabelText('Instance Type');
    fireEvent.change(instanceTypeSelect, { target: { value: 'p3.2xlarge' } });
    
    // Mock the service call with filtered data
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'instanceTypes') {
        return {
          data: mockServiceResponses.getSupportedInstanceTypes,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'regions') {
        return {
          data: mockServiceResponses.getSupportedRegions,
          isLoading: false,
          isError: false,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'spotPrices') {
        // Filter prices for p3.2xlarge
        const filteredPrices = {
          ...mockServiceResponses.getCurrentSpotPrices,
          prices: mockServiceResponses.getCurrentSpotPrices.prices.filter(
            price => price.instanceType === 'p3.2xlarge'
          )
        };
        return {
          data: filteredPrices,
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
          isFetching: false
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Wait for the filtered spot prices to be rendered
    await waitFor(() => {
      // Check if p3.2xlarge prices are rendered
      const p3Instances = screen.getAllByText('p3.2xlarge');
      expect(p3Instances.length).toBeGreaterThan(0);
      
      // Check that g4dn.xlarge prices are not rendered
      expect(screen.queryByText('g4dn.xlarge')).not.toBeInTheDocument();
    });
    
    // Check if the price history chart is rendered
    expect(screen.getByText('Price History for p3.2xlarge')).toBeInTheDocument();
  });

  it('searches spot prices by text input', async () => {
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Enter search text
    const searchInput = screen.getByPlaceholderText('Search by instance type or AZ');
    fireEvent.change(searchInput, { target: { value: 'g4dn' } });
    
    // Wait for the filtered spot prices to be rendered
    await waitFor(() => {
      // Check if g4dn.xlarge prices are rendered
      expect(screen.getByText('g4dn.xlarge')).toBeInTheDocument();
      
      // Check that p3.2xlarge prices are not rendered
      expect(screen.queryByText('p3.2xlarge')).not.toBeInTheDocument();
    });
  });

  it('sorts spot prices by price', async () => {
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Click on the Spot Price header to sort
    const spotPriceHeader = screen.getByText('Spot Price');
    fireEvent.click(spotPriceHeader);
    
    // Wait for the sorted spot prices to be rendered
    await waitFor(() => {
      // Get all price elements
      const priceElements = screen.getAllByText(/\$\d+\.\d+/);
      
      // Extract the prices and check if they are sorted in ascending order
      const prices = priceElements.map(el => parseFloat(el.textContent.replace('$', '')));
      const sortedPrices = [...prices].sort((a, b) => a - b);
      
      expect(prices).toEqual(sortedPrices);
    });
    
    // Click again to sort in descending order
    fireEvent.click(spotPriceHeader);
    
    // Wait for the sorted spot prices to be rendered
    await waitFor(() => {
      // Get all price elements
      const priceElements = screen.getAllByText(/\$\d+\.\d+/);
      
      // Extract the prices and check if they are sorted in descending order
      const prices = priceElements.map(el => parseFloat(el.textContent.replace('$', '')));
      const sortedPrices = [...prices].sort((a, b) => b - a);
      
      expect(prices).toEqual(sortedPrices);
    });
  });

  it('sets price thresholds and highlights prices above threshold', async () => {
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Find the threshold input for the first instance
    const thresholdInputs = screen.getAllByPlaceholderText('Set threshold');
    const firstThresholdInput = thresholdInputs[0];
    
    // Set a threshold lower than the current price
    fireEvent.change(firstThresholdInput, { target: { value: '1.0' } });
    
    // Wait for the price to be highlighted
    await waitFor(() => {
      // Check if the alert icon is rendered
      const alertIcon = screen.getByText('Price above threshold');
      expect(alertIcon).toBeInTheDocument();
    });
  });

  it('shows loading state when data is loading', async () => {
    // Mock loading state
    useQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn()
    }));
    
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Check if the loading spinner is rendered
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when data fetching fails', async () => {
    // Mock error state
    useQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn()
    }));
    
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Check if the error message is rendered
    expect(screen.getByText('Error loading spot price data. Please try again later.')).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    // Create a mock refetch function
    const mockRefetch = jest.fn();
    
    // Mock the useQuery hook with the mock refetch function
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'spotPrices') {
        return {
          data: mockServiceResponses.getCurrentSpotPrices,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn()
      };
    });
    
    // Render the component
    render(<SpotPriceMonitor />);
    
    // Click the refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Check if the refetch function was called
    expect(mockRefetch).toHaveBeenCalled();
  });
});