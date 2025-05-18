const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} = require('@aws-sdk/lib-dynamodb');
const { 
  KMSClient, 
  EncryptCommand, 
  DecryptCommand 
} = require('@aws-sdk/client-kms');
const logger = require('./logger');

// Initialize the DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize the KMS client
const kmsClient = new KMSClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create a document client for easier interaction with DynamoDB
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table name prefix from environment
const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'aws-gpu-spot-monitor-dev';

// KMS key ID from environment
const kmsKeyId = process.env.KMS_KEY_ID;

// Fields that should be encrypted
const sensitiveFields = [
  'passkey',
  'apiKey',
  'accessToken',
  'refreshToken',
  'password',
  'secret',
  'credentials',
  'token'
];

/**
 * Get the full table name with prefix
 * @param {string} tableName - The base table name
 * @returns {string} The full table name with prefix
 */
const getTableName = (tableName) => `${tablePrefix}-${tableName}`;

/**
 * Encrypt a value using KMS
 * @param {string} value - The value to encrypt
 * @returns {Promise<string>} The encrypted value as base64 string
 */
const encryptValue = async (value) => {
  if (!kmsKeyId) {
    logger.warn('KMS_KEY_ID not set, skipping encryption');
    return value;
  }

  try {
    const command = new EncryptCommand({
      KeyId: kmsKeyId,
      Plaintext: Buffer.from(value)
    });

    const { CiphertextBlob } = await kmsClient.send(command);
    return CiphertextBlob.toString('base64');
  } catch (error) {
    logger.error('Error encrypting value with KMS', { error });
    throw error;
  }
};

/**
 * Decrypt a value using KMS
 * @param {string} encryptedValue - The encrypted value as base64 string
 * @returns {Promise<string>} The decrypted value
 */
const decryptValue = async (encryptedValue) => {
  if (!kmsKeyId) {
    logger.warn('KMS_KEY_ID not set, skipping decryption');
    return encryptedValue;
  }

  try {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(encryptedValue, 'base64')
    });

    const { Plaintext } = await kmsClient.send(command);
    return Plaintext.toString();
  } catch (error) {
    logger.error('Error decrypting value with KMS', { error });
    throw error;
  }
};

/**
 * Process an item to encrypt sensitive fields
 * @param {object} item - The item to process
 * @returns {Promise<object>} The processed item with encrypted fields
 */
const encryptItem = async (item) => {
  const encryptedItem = { ...item };

  for (const field of sensitiveFields) {
    if (encryptedItem[field] && typeof encryptedItem[field] === 'string') {
      encryptedItem[field] = await encryptValue(encryptedItem[field]);
    }
  }

  return encryptedItem;
};

/**
 * Process an item to decrypt sensitive fields
 * @param {object} item - The item to process
 * @returns {Promise<object>} The processed item with decrypted fields
 */
const decryptItem = async (item) => {
  if (!item) return item;
  
  const decryptedItem = { ...item };

  for (const field of sensitiveFields) {
    if (decryptedItem[field] && typeof decryptedItem[field] === 'string') {
      try {
        decryptedItem[field] = await decryptValue(decryptedItem[field]);
      } catch (error) {
        // If decryption fails, it might not be encrypted, so keep the original value
        logger.warn(`Failed to decrypt field ${field}, it may not be encrypted`, { error });
      }
    }
  }

  return decryptedItem;
};

/**
 * Get an item from DynamoDB
 * @param {string} tableName - The base table name
 * @param {object} key - The key of the item to get
 * @returns {Promise<object>} The item from DynamoDB with decrypted sensitive fields
 */
const getItem = async (tableName, key) => {
  const params = {
    TableName: getTableName(tableName),
    Key: key
  };

  try {
    const { Item } = await docClient.send(new GetCommand(params));
    return await decryptItem(Item);
  } catch (error) {
    logger.error('Error getting item from DynamoDB', { error, tableName, key });
    throw error;
  }
};

/**
 * Put an item in DynamoDB
 * @param {string} tableName - The base table name
 * @param {object} item - The item to put
 * @returns {Promise<object>} The result of the put operation
 */
const putItem = async (tableName, item) => {
  const encryptedItem = await encryptItem(item);
  
  const params = {
    TableName: getTableName(tableName),
    Item: encryptedItem
  };

  try {
    const result = await docClient.send(new PutCommand(params));
    return result;
  } catch (error) {
    logger.error('Error putting item in DynamoDB', { error, tableName });
    throw error;
  }
};

/**
 * Update an item in DynamoDB
 * @param {string} tableName - The base table name
 * @param {object} key - The key of the item to update
 * @param {string} updateExpression - The update expression
 * @param {object} expressionAttributeValues - The expression attribute values
 * @param {object} expressionAttributeNames - The expression attribute names
 * @returns {Promise<object>} The result of the update operation
 */
const updateItem = async (tableName, key, updateExpression, expressionAttributeValues, expressionAttributeNames) => {
  // Encrypt sensitive values in expressionAttributeValues
  const encryptedValues = { ...expressionAttributeValues };
  
  for (const attrKey in encryptedValues) {
    const value = encryptedValues[attrKey];
    // Check if this attribute value corresponds to a sensitive field
    for (const field of sensitiveFields) {
      if (updateExpression.includes(`#${field}`) || updateExpression.includes(`.${field}`)) {
        if (typeof value === 'string') {
          encryptedValues[attrKey] = await encryptValue(value);
        }
      }
    }
  }
  
  const params = {
    TableName: getTableName(tableName),
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: encryptedValues,
    ReturnValues: 'ALL_NEW'
  };

  if (expressionAttributeNames) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  try {
    const { Attributes } = await docClient.send(new UpdateCommand(params));
    return await decryptItem(Attributes);
  } catch (error) {
    logger.error('Error updating item in DynamoDB', { 
      error, tableName, key, updateExpression
    });
    throw error;
  }
};

/**
 * Delete an item from DynamoDB
 * @param {string} tableName - The base table name
 * @param {object} key - The key of the item to delete
 * @returns {Promise<object>} The result of the delete operation
 */
const deleteItem = async (tableName, key) => {
  const params = {
    TableName: getTableName(tableName),
    Key: key
  };

  try {
    const result = await docClient.send(new DeleteCommand(params));
    return result;
  } catch (error) {
    logger.error('Error deleting item from DynamoDB', { error, tableName, key });
    throw error;
  }
};

/**
 * Query items from DynamoDB
 * @param {string} tableName - The base table name
 * @param {object} params - Additional query parameters
 * @returns {Promise<Array>} The items from DynamoDB with decrypted sensitive fields
 */
const queryItems = async (tableName, params = {}) => {
  const queryParams = {
    TableName: getTableName(tableName),
    ...params
  };

  try {
    const { Items } = await docClient.send(new QueryCommand(queryParams));
    
    // Decrypt sensitive fields in all items
    const decryptedItems = [];
    for (const item of Items || []) {
      decryptedItems.push(await decryptItem(item));
    }
    
    return decryptedItems;
  } catch (error) {
    logger.error('Error querying items from DynamoDB', { error, tableName, params });
    throw error;
  }
};

/**
 * Scan items from DynamoDB
 * @param {string} tableName - The base table name
 * @param {object} params - Additional scan parameters
 * @returns {Promise<Array>} The items from DynamoDB with decrypted sensitive fields
 */
const scanItems = async (tableName, params = {}) => {
  const scanParams = {
    TableName: getTableName(tableName),
    ...params
  };

  try {
    const { Items } = await docClient.send(new ScanCommand(scanParams));
    
    // Decrypt sensitive fields in all items
    const decryptedItems = [];
    for (const item of Items || []) {
      decryptedItems.push(await decryptItem(item));
    }
    
    return decryptedItems;
  } catch (error) {
    logger.error('Error scanning items from DynamoDB', { error, tableName, params });
    throw error;
  }
};

module.exports = {
  getTableName,
  getItem,
  putItem,
  updateItem,
  deleteItem,
  queryItems,
  scanItems,
  encryptValue,
  decryptValue
};