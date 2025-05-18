import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Link,
  FormErrorMessage,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Register component
 */
const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  
  const { register, confirmRegistration } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle input change
   * @param {React.ChangeEvent} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  /**
   * Validate form inputs
   * @returns {boolean} - Whether the form is valid
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { firstName, lastName, email, password } = formData;
      
      await register(email, password, {
        given_name: firstName,
        family_name: lastName,
      });
      
      setIsRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle confirmation code submission
   * @param {React.FormEvent} e - Form event
   */
  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirmationCode.trim()) {
      setError('Confirmation code is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await confirmRegistration(formData.email, confirmationCode);
      navigate('/login', { 
        state: { 
          message: 'Registration confirmed successfully. You can now log in.' 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Confirmation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      minH={'100vh'}
      display={'flex'}
      alignItems={'center'}
      justifyContent={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'} textAlign={'center'}>
            {isRegistered ? 'Confirm Registration' : 'Sign up'}
          </Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            {isRegistered 
              ? 'Enter the confirmation code sent to your email'
              : 'to start monitoring your AWS GPU spot instances ✌️'}
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          {error && (
            <Alert status="error" mb={4} rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {isRegistered ? (
            <form onSubmit={handleConfirmSubmit}>
              <Stack spacing={4}>
                <FormControl id="confirmationCode" isRequired>
                  <FormLabel>Confirmation Code</FormLabel>
                  <Input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                  />
                </FormControl>
                <Stack spacing={10} pt={2}>
                  <Button
                    loadingText="Submitting"
                    size="lg"
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Confirm Registration
                  </Button>
                </Stack>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <HStack>
                  <Box>
                    <FormControl id="firstName" isInvalid={!!errors.firstName}>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                      <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                    </FormControl>
                  </Box>
                  <Box>
                    <FormControl id="lastName" isInvalid={!!errors.lastName}>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                      <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                    </FormControl>
                  </Box>
                </HStack>
                <FormControl id="email" isInvalid={!!errors.email}>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
                <FormControl id="password" isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <InputRightElement h={'full'}>
                      <IconButton
                        variant={'ghost'}
                        onClick={() => setShowPassword(!showPassword)}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>
                <FormControl id="confirmPassword" isInvalid={!!errors.confirmPassword}>
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <InputRightElement h={'full'}>
                      <IconButton
                        variant={'ghost'}
                        onClick={() => setShowPassword(!showPassword)}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>
                <Stack spacing={10} pt={2}>
                  <Button
                    loadingText="Submitting"
                    size="lg"
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Sign up
                  </Button>
                </Stack>
                <Stack pt={6}>
                  <Text align={'center'}>
                    Already a user?{' '}
                    <Link as={RouterLink} to="/login" color={'blue.400'}>
                      Login
                    </Link>
                  </Text>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default Register;