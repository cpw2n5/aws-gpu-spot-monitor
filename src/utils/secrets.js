const { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  PutSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand
} = require('@aws-sdk/client-secrets-manager');
const logger = require('./logger');

// Initialize the Secrets Manager client
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Get a secret from AWS Secrets Manager
 * @param {string} secretName - The name of the secret to retrieve
 * @returns {Promise<object|string>} The secret value (parsed as JSON if possible)
 */
const getSecret = async (secretName) => {
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName
    });
    
    const response = await client.send(command);
    const secretValue = response.SecretString;
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(secretValue);
    } catch (e) {
      return secretValue;
    }
  } catch (error) {
    logger.error('Error retrieving secret from Secrets Manager', { error, secretName });
    throw error;
  }
};

/**
 * Create a new secret in AWS Secrets Manager
 * @param {string} secretName - The name of the secret to create
 * @param {object|string} secretValue - The value to store (will be stringified if object)
 * @param {string} description - Optional description for the secret
 * @returns {Promise<object>} The result of the create operation
 */
const createSecret = async (secretName, secretValue, description = '') => {
  try {
    const value = typeof secretValue === 'object' ? JSON.stringify(secretValue) : secretValue;
    
    const command = new CreateSecretCommand({
      Name: secretName,
      Description: description,
      SecretString: value
    });
    
    const response = await client.send(command);
    logger.info('Secret created successfully', { secretName });
    
    return response;
  } catch (error) {
    logger.error('Error creating secret in Secrets Manager', { error, secretName });
    throw error;
  }
};

/**
 * Update an existing secret in AWS Secrets Manager
 * @param {string} secretName - The name of the secret to update
 * @param {object|string} secretValue - The new value to store
 * @returns {Promise<object>} The result of the update operation
 */
const updateSecret = async (secretName, secretValue) => {
  try {
    const value = typeof secretValue === 'object' ? JSON.stringify(secretValue) : secretValue;
    
    const command = new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: value
    });
    
    const response = await client.send(command);
    logger.info('Secret updated successfully', { secretName });
    
    return response;
  } catch (error) {
    logger.error('Error updating secret in Secrets Manager', { error, secretName });
    throw error;
  }
};

/**
 * Put a secret value in AWS Secrets Manager (creates or updates)
 * @param {string} secretName - The name of the secret
 * @param {object|string} secretValue - The value to store
 * @param {string} description - Optional description (only used for creation)
 * @returns {Promise<object>} The result of the operation
 */
const putSecret = async (secretName, secretValue, description = '') => {
  try {
    // Try to get the secret first to see if it exists
    try {
      await getSecret(secretName);
      // If we get here, the secret exists, so update it
      return await updateSecret(secretName, secretValue);
    } catch (error) {
      // If the secret doesn't exist, create it
      if (error.name === 'ResourceNotFoundException') {
        return await createSecret(secretName, secretValue, description);
      }
      // Otherwise, rethrow the error
      throw error;
    }
  } catch (error) {
    logger.error('Error putting secret in Secrets Manager', { error, secretName });
    throw error;
  }
};

module.exports = {
  getSecret,
  createSecret,
  updateSecret,
  putSecret
};