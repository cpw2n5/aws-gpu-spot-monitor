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
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ForgotPassword component
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Request code, 2: Reset password
  
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle request code form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleRequestCode = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await forgotPassword(email);
      setSuccess('Confirmation code sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send confirmation code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle reset password form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!confirmationCode) {
      setError('Confirmation code is required');
      return;
    }
    
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await resetPassword(email, confirmationCode, newPassword);
      setSuccess('Password reset successfully');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successfully. You can now log in with your new password.' 
          } 
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
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
          <Heading fontSize={'4xl'}>
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            {step === 1 
              ? 'Enter your email to receive a confirmation code'
              : 'Enter the confirmation code and your new password'}
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
          
          {success && (
            <Alert status="success" mb={4} rounded="md">
              <AlertIcon />
              {success}
            </Alert>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleRequestCode}>
              <Stack spacing={4}>
                <FormControl id="email" isRequired>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormControl>
                <Stack spacing={10}>
                  <Button
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Request Reset Code
                  </Button>
                </Stack>
                <Stack pt={6}>
                  <Text align={'center'}>
                    Remember your password?{' '}
                    <Link as={RouterLink} to="/login" color={'blue.400'}>
                      Login
                    </Link>
                  </Text>
                </Stack>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <Stack spacing={4}>
                <FormControl id="confirmationCode" isRequired>
                  <FormLabel>Confirmation Code</FormLabel>
                  <Input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                  />
                </FormControl>
                <FormControl id="newPassword" isRequired>
                  <FormLabel>New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                </FormControl>
                <FormControl id="confirmPassword" isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                </FormControl>
                <Stack spacing={10}>
                  <Button
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Reset Password
                  </Button>
                </Stack>
                <Stack pt={6}>
                  <Text align={'center'}>
                    <Link 
                      as={RouterLink} 
                      to="#" 
                      color={'blue.400'}
                      onClick={(e) => {
                        e.preventDefault();
                        setStep(1);
                      }}
                    >
                      Back to request code
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

export default ForgotPassword;