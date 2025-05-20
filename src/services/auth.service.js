import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, GetUserCommand, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';
import { decode } from 'jsonwebtoken';
import { info, error as _error } from '../utils/logger';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { putItem, getItem } from '../utils/dynamodb';
import { getSecret, putSecret } from '../utils/secrets';

// Secret names
const COGNITO_CONFIG_SECRET = process.env.COGNITO_CONFIG_SECRET || 'aws-gpu-spot-monitor/cognito-config';

// Initialize the Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Get Cognito User Pool ID and Client ID from environment variables or Secrets Manager
let USER_POOL_ID;
let USER_POOL_CLIENT_ID;

/**
 * Initialize Cognito configuration from Secrets Manager
 * @returns {Promise<void>}
 */
const initCognitoConfig = async () => {
  try {
    // Try to get from environment variables first
    USER_POOL_ID = process.env.USER_POOL_ID;
    USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
    
    // If not available in environment, get from Secrets Manager
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      info('Fetching Cognito configuration from Secrets Manager');
      const cognitoConfig = await getSecret(COGNITO_CONFIG_SECRET);
      
      USER_POOL_ID = cognitoConfig.userPoolId;
      USER_POOL_CLIENT_ID = cognitoConfig.userPoolClientId;
      
      info('Successfully loaded Cognito configuration from Secrets Manager');
    }
    
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      throw new Error('Cognito configuration not found in environment or Secrets Manager');
    }
  } catch (error) {
    _error('Error initializing Cognito configuration', { error });
    throw error;
  }
};

// Initialize Cognito configuration on module load
(async () => {
  try {
    await initCognitoConfig();
  } catch (error) {
    _error('Failed to initialize Cognito configuration', { error });
    // Don't throw here to allow the service to start, but authentication will fail
  }
})();

/**
 * Register a new user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {object} attributes - Additional user attributes
 * @returns {Promise<object>} Registration result
 */
const registerUser = async (email, password, attributes = {}) => {
  try {
    // Ensure Cognito configuration is initialized
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      await initCognitoConfig();
    }
    
    // Prepare user attributes for Cognito
    const userAttributes = Object.entries({
      email,
      ...attributes
    }).map(([Name, Value]) => ({
      Name: Name === 'email' ? 'email' : `custom:${Name}`,
      Value
    }));

    // Sign up the user in Cognito
    const command = new SignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: userAttributes
    });

    const response = await cognitoClient.send(command);
    
    // Create user record in DynamoDB
    const userId = response.UserSub;
    const user = {
      id: userId,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...attributes
    };
    
    await putItem('users', user);
    
    info('User registered successfully', { userId, email });
    
    return {
      userId,
      userConfirmed: response.UserConfirmed
    };
  } catch (error) {
    _error('Error registering user', { error, email });
    if (error.name === 'UsernameExistsException') {
      throw new BadRequestError('User with this email already exists');
    }
    throw error;
  }
};

/**
 * Confirm user registration with verification code
 * @param {string} email - User's email
 * @param {string} confirmationCode - Verification code
 * @returns {Promise<object>} Confirmation result
 */
const confirmRegistration = async (email, confirmationCode) => {
  try {
    // Ensure Cognito configuration is initialized
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      await initCognitoConfig();
    }
    
    const command = new ConfirmSignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode
    });
    
    await cognitoClient.send(command);
    
    info('User registration confirmed', { email });
    
    return { success: true };
  } catch (error) {
    _error('Error confirming user registration', { error, email });
    if (error.name === 'CodeMismatchException') {
      throw new BadRequestError('Invalid verification code');
    }
    throw error;
  }
};

/**
 * Login a user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} Login result with tokens
 */
const loginUser = async (email, password) => {
  try {
    // Ensure Cognito configuration is initialized
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      await initCognitoConfig();
    }
    
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
    
    const response = await cognitoClient.send(command);
    const { IdToken, AccessToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
    
    // Get user from DynamoDB
    const decodedToken = decode(IdToken);
    const userId = decodedToken.sub;
    
    const user = await getItem('users', { id: userId });
    
    info('User logged in successfully', { userId, email });
    
    return {
      userId,
      email,
      idToken: IdToken,
      accessToken: AccessToken,
      refreshToken: RefreshToken,
      expiresIn: ExpiresIn,
      user
    };
  } catch (error) {
    _error('Error logging in user', { error, email });
    if (error.name === 'NotAuthorizedException') {
      throw new UnauthorizedError('Invalid email or password');
    }
    throw error;
  }
};

/**
 * Refresh user tokens
 * @param {string} refreshToken - User's refresh token
 * @returns {Promise<object>} New tokens
 */
const refreshTokens = async (refreshToken) => {
  try {
    // Ensure Cognito configuration is initialized
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      await initCognitoConfig();
    }
    
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    });
    
    const response = await cognitoClient.send(command);
    const { IdToken, AccessToken, ExpiresIn } = response.AuthenticationResult;
    
    info('Tokens refreshed successfully');
    
    return {
      idToken: IdToken,
      accessToken: AccessToken,
      expiresIn: ExpiresIn
    };
  } catch (error) {
    _error('Error refreshing tokens', { error });
    throw new UnauthorizedError('Invalid refresh token');
  }
};

/**
 * Initiate forgot password flow
 * @param {string} email - User's email
 * @returns {Promise<object>} Result
 */
const forgotPassword = async (email) => {
  try {
    // Ensure Cognito configuration is initialized
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      await initCognitoConfig();
    }
    
    const command = new ForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email
    });
    
    await cognitoClient.send(command);
    
    info('Forgot password initiated', { email });
    
    return { success: true };
  } catch (error) {
    _error('Error initiating forgot password', { error, email });
    throw error;
  }
};

/**
 * Confirm new password with verification code
 * @param {string} email - User's email
 * @param {string} confirmationCode - Verification code
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Result
 */
const confirmNewPassword = async (email, confirmationCode, newPassword) => {
  try {
    // Ensure Cognito configuration is initialized
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      await initCognitoConfig();
    }
    
    const command = new ConfirmForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    });
    
    await cognitoClient.send(command);
    
    info('Password reset confirmed', { email });
    
    return { success: true };
  } catch (error) {
    _error('Error confirming new password', { error, email });
    if (error.name === 'CodeMismatchException') {
      throw new BadRequestError('Invalid verification code');
    }
    throw error;
  }
};

/**
 * Get user profile
 * @param {string} accessToken - User's access token
 * @returns {Promise<object>} User profile
 */
const getUserProfile = async (accessToken) => {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken
    });
    
    const response = await cognitoClient.send(command);
    
    // Extract user attributes
    const attributes = {};
    response.UserAttributes.forEach(attr => {
      const key = attr.Name.replace('custom:', '');
      attributes[key] = attr.Value;
    });
    
    const userId = attributes.sub;
    
    // Get user from DynamoDB
    const user = await getItem('users', { id: userId });
    
    info('User profile retrieved', { userId });
    
    return {
      userId,
      email: attributes.email,
      ...user
    };
  } catch (error) {
    _error('Error getting user profile', { error });
    throw new UnauthorizedError('Invalid access token');
  }
};

/**
 * Logout user
 * @param {string} accessToken - User's access token
 * @returns {Promise<object>} Result
 */
const logoutUser = async (accessToken) => {
  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken
    });
    
    await cognitoClient.send(command);
    
    info('User logged out successfully');
    
    return { success: true };
  } catch (error) {
    _error('Error logging out user', { error });
    throw error;
  }
};

/**
 * Store Cognito configuration in Secrets Manager
 * @param {string} userPoolId - Cognito User Pool ID
 * @param {string} userPoolClientId - Cognito User Pool Client ID
 * @returns {Promise<object>} Result
 */
const storeCognitoConfig = async (userPoolId, userPoolClientId) => {
  try {
    const config = {
      userPoolId,
      userPoolClientId
    };
    
    await putSecret(
      COGNITO_CONFIG_SECRET, 
      config, 
      'Cognito configuration for AWS GPU Spot Monitor'
    );
    
    // Update local variables
    USER_POOL_ID = userPoolId;
    USER_POOL_CLIENT_ID = userPoolClientId;
    
    info('Cognito configuration stored in Secrets Manager');
    
    return { success: true };
  } catch (error) {
    _error('Error storing Cognito configuration', { error });
    throw error;
  }
};

export default {
  registerUser,
  confirmRegistration,
  loginUser,
  refreshTokens,
  forgotPassword,
  confirmNewPassword,
  getUserProfile,
  logoutUser,
  storeCognitoConfig,
  initCognitoConfig
};