import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  FormControl,
  FormLabel,
  Button,
  VStack,
  useColorModeValue,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  StackDivider,
  Switch,
  Select,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  InputGroup,
  InputLeftElement,
  Input,
  Checkbox,
  CheckboxGroup,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
} from '@chakra-ui/react';
import { FiDollarSign } from 'react-icons/fi';
import { useQuery, useMutation } from '@tanstack/react-query';
import SpotPriceService from '../../services/spotPrice.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * UserSettings component
 */
const UserSettings = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      priceAlerts: true,
      instanceStateChanges: true,
      foldingMilestones: true,
    },
    defaultRegion: '',
    preferredInstanceTypes: [],
    priceThresholds: {},
    theme: 'system',
    displayCurrency: 'USD',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInstanceType, setNewInstanceType] = useState('');
  
  // Fetch instance types
  const instanceTypesQuery = useQuery({
    queryKey: ['instanceTypes'],
    queryFn: SpotPriceService.getSupportedInstanceTypes,
  });
  
  // Fetch regions
  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: SpotPriceService.getSupportedRegions,
  });
  
  // Mock mutation for saving settings
  // In a real app, this would connect to a backend API
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });
  
  // Handle settings change
  const handleSettingsChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };
  
  // Handle simple setting change
  const handleSimpleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Handle price threshold change
  const handleThresholdChange = (instanceType, value) => {
    setSettings(prev => ({
      ...prev,
      priceThresholds: {
        ...prev.priceThresholds,
        [instanceType]: value,
      },
    }));
  };
  
  // Handle add preferred instance type
  const handleAddInstanceType = () => {
    if (
      newInstanceType && 
      !settings.preferredInstanceTypes.includes(newInstanceType)
    ) {
      setSettings(prev => ({
        ...prev,
        preferredInstanceTypes: [...prev.preferredInstanceTypes, newInstanceType],
      }));
      setNewInstanceType('');
    }
  };
  
  // Handle remove preferred instance type
  const handleRemoveInstanceType = (instanceType) => {
    setSettings(prev => ({
      ...prev,
      preferredInstanceTypes: prev.preferredInstanceTypes.filter(
        type => type !== instanceType
      ),
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    saveSettingsMutation.mutate(settings);
  };
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings,
        }));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Heading as="h1" size="xl" mb={6}>
        Settings
      </Heading>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
        {/* General Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">General Settings</Heading>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing="4">
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Appearance
                </Heading>
                <Box mt={4}>
                  <FormControl>
                    <FormLabel>Theme</FormLabel>
                    <Select
                      value={settings.theme}
                      onChange={(e) => handleSimpleChange('theme', e.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Regional Preferences
                </Heading>
                <Box mt={4}>
                  <FormControl>
                    <FormLabel>Default Region</FormLabel>
                    <Select
                      value={settings.defaultRegion}
                      onChange={(e) => handleSimpleChange('defaultRegion', e.target.value)}
                      placeholder="Select default region"
                    >
                      {regionsQuery.data?.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box mt={4}>
                  <FormControl>
                    <FormLabel>Display Currency</FormLabel>
                    <Select
                      value={settings.displayCurrency}
                      onChange={(e) => handleSimpleChange('displayCurrency', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Stack>
          </CardBody>
        </Card>
        
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">Notifications</Heading>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing="4">
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Notification Channels
                </Heading>
                <VStack align="start" mt={4} spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <Switch
                      id="email-notifications"
                      isChecked={settings.notifications.email}
                      onChange={(e) => handleSettingsChange('notifications', 'email', e.target.checked)}
                      mr={3}
                    />
                    <FormLabel htmlFor="email-notifications" mb="0">
                      Email Notifications
                    </FormLabel>
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <Switch
                      id="browser-notifications"
                      isChecked={settings.notifications.browser}
                      onChange={(e) => handleSettingsChange('notifications', 'browser', e.target.checked)}
                      mr={3}
                    />
                    <FormLabel htmlFor="browser-notifications" mb="0">
                      Browser Notifications
                    </FormLabel>
                  </FormControl>
                </VStack>
              </Box>
              
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Notification Types
                </Heading>
                <VStack align="start" mt={4} spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <Switch
                      id="price-alerts"
                      isChecked={settings.notifications.priceAlerts}
                      onChange={(e) => handleSettingsChange('notifications', 'priceAlerts', e.target.checked)}
                      mr={3}
                    />
                    <FormLabel htmlFor="price-alerts" mb="0">
                      Spot Price Alerts
                    </FormLabel>
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <Switch
                      id="instance-state-changes"
                      isChecked={settings.notifications.instanceStateChanges}
                      onChange={(e) => handleSettingsChange('notifications', 'instanceStateChanges', e.target.checked)}
                      mr={3}
                    />
                    <FormLabel htmlFor="instance-state-changes" mb="0">
                      Instance State Changes
                    </FormLabel>
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <Switch
                      id="folding-milestones"
                      isChecked={settings.notifications.foldingMilestones}
                      onChange={(e) => handleSettingsChange('notifications', 'foldingMilestones', e.target.checked)}
                      mr={3}
                    />
                    <FormLabel htmlFor="folding-milestones" mb="0">
                      Folding@Home Milestones
                    </FormLabel>
                  </FormControl>
                </VStack>
              </Box>
            </Stack>
          </CardBody>
        </Card>
        
        {/* Instance Preferences */}
        <Card>
          <CardHeader>
            <Heading size="md">Instance Preferences</Heading>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing="4">
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Preferred Instance Types
                </Heading>
                <Box mt={4}>
                  <HStack mb={4}>
                    <Select
                      value={newInstanceType}
                      onChange={(e) => setNewInstanceType(e.target.value)}
                      placeholder="Select instance type"
                      flex="1"
                    >
                      {instanceTypesQuery.data?.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                    <Button onClick={handleAddInstanceType}>Add</Button>
                  </HStack>
                  
                  <Flex wrap="wrap" gap={2}>
                    {settings.preferredInstanceTypes.map(type => (
                      <Tag
                        key={type}
                        size="md"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="blue"
                        m={1}
                      >
                        <TagLabel>{type}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveInstanceType(type)} />
                      </Tag>
                    ))}
                    {settings.preferredInstanceTypes.length === 0 && (
                      <Text color="gray.500">No preferred instance types selected</Text>
                    )}
                  </Flex>
                </Box>
              </Box>
              
              <Box>
                <Heading size="xs" textTransform="uppercase">
                  Price Thresholds
                </Heading>
                <Box mt={4}>
                  <Accordion allowToggle>
                    {settings.preferredInstanceTypes.map(type => (
                      <AccordionItem key={type}>
                        <h2>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              {type}
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <FormControl>
                            <FormLabel>Maximum Price</FormLabel>
                            <InputGroup>
                              <InputLeftElement pointerEvents="none">
                                <FiDollarSign color="gray.300" />
                              </InputLeftElement>
                              <Input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={settings.priceThresholds[type] || ''}
                                onChange={(e) => handleThresholdChange(type, e.target.value)}
                                placeholder="Set maximum price"
                              />
                            </InputGroup>
                          </FormControl>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  {settings.preferredInstanceTypes.length === 0 && (
                    <Text color="gray.500">Add preferred instance types to set price thresholds</Text>
                  )}
                </Box>
              </Box>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      <Box mt={8} textAlign="right">
        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleSubmit}
          isLoading={isSubmitting}
        >
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};

export default UserSettings;