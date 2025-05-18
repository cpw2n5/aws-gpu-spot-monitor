/**
 * Mock implementation of the DynamoDB utility
 */

// Mock in-memory database for testing
const mockDatabase = {
  'spot-price-history': [],
  'instances': [],
  'folding-config': [],
  'notification-preferences': [],
  'notification-logs': []
};

// Reset the mock database
const resetMockDatabase = () => {
  Object.keys(mockDatabase).forEach(table => {
    mockDatabase[table] = [];
  });
};

// Get an item from a table by key
const getItem = jest.fn().mockImplementation((tableName, key) => {
  const table = mockDatabase[tableName] || [];
  const keyField = Object.keys(key)[0];
  const keyValue = key[keyField];
  
  const item = table.find(item => item[keyField] === keyValue);
  return Promise.resolve(item || null);
});

// Put an item into a table
const putItem = jest.fn().mockImplementation((tableName, item) => {
  if (!mockDatabase[tableName]) {
    mockDatabase[tableName] = [];
  }
  
  // Check if item with same ID already exists
  const existingIndex = mockDatabase[tableName].findIndex(
    existingItem => existingItem.id === item.id
  );
  
  if (existingIndex >= 0) {
    // Replace existing item
    mockDatabase[tableName][existingIndex] = item;
  } else {
    // Add new item
    mockDatabase[tableName].push(item);
  }
  
  return Promise.resolve(item);
});

// Update an item in a table
const updateItem = jest.fn().mockImplementation((tableName, key, updateExpression, expressionAttributeValues) => {
  const table = mockDatabase[tableName] || [];
  const keyField = Object.keys(key)[0];
  const keyValue = key[keyField];
  
  const itemIndex = table.findIndex(item => item[keyField] === keyValue);
  
  if (itemIndex === -1) {
    return Promise.resolve(null);
  }
  
  const item = { ...table[itemIndex] };
  
  // Parse update expression
  // This is a simplified implementation that only handles 'SET' expressions
  if (updateExpression.startsWith('SET')) {
    const setParts = updateExpression.substring(4).split(',').map(part => part.trim());
    
    setParts.forEach(part => {
      const [fieldPath, valuePath] = part.split('=').map(p => p.trim());
      const fieldName = fieldPath;
      const valueName = valuePath;
      
      item[fieldName] = expressionAttributeValues[valueName];
    });
  }
  
  // Update the item in the table
  mockDatabase[tableName][itemIndex] = item;
  
  return Promise.resolve(item);
});

// Delete an item from a table
const deleteItem = jest.fn().mockImplementation((tableName, key) => {
  const table = mockDatabase[tableName] || [];
  const keyField = Object.keys(key)[0];
  const keyValue = key[keyField];
  
  const itemIndex = table.findIndex(item => item[keyField] === keyValue);
  
  if (itemIndex === -1) {
    return Promise.resolve(false);
  }
  
  // Remove the item from the table
  mockDatabase[tableName].splice(itemIndex, 1);
  
  return Promise.resolve(true);
});

// Query items from a table
const queryItems = jest.fn().mockImplementation((tableName, params) => {
  const table = mockDatabase[tableName] || [];
  let results = [...table];
  
  // Handle key condition expression
  if (params.KeyConditionExpression) {
    const conditions = params.KeyConditionExpression.split(' AND ');
    
    conditions.forEach(condition => {
      const [fieldPath, operator, valuePath] = condition.split(/\s+/);
      const fieldName = fieldPath;
      const valueKey = valuePath;
      const value = params.ExpressionAttributeValues[valueKey];
      
      switch (operator) {
        case '=':
          results = results.filter(item => item[fieldName] === value);
          break;
        case '>':
          results = results.filter(item => item[fieldName] > value);
          break;
        case '>=':
          results = results.filter(item => item[fieldName] >= value);
          break;
        case '<':
          results = results.filter(item => item[fieldName] < value);
          break;
        case '<=':
          results = results.filter(item => item[fieldName] <= value);
          break;
        case 'BETWEEN':
          const [minValueKey, maxValueKey] = valueKey.split(' AND ');
          const minValue = params.ExpressionAttributeValues[minValueKey];
          const maxValue = params.ExpressionAttributeValues[maxValueKey];
          results = results.filter(item => item[fieldName] >= minValue && item[fieldName] <= maxValue);
          break;
      }
    });
  }
  
  // Handle filter expression
  if (params.FilterExpression) {
    const conditions = params.FilterExpression.split(' AND ');
    
    conditions.forEach(condition => {
      const [fieldPath, operator, valuePath] = condition.split(/\s+/);
      const fieldName = fieldPath;
      const valueKey = valuePath;
      const value = params.ExpressionAttributeValues[valueKey];
      
      switch (operator) {
        case '=':
          results = results.filter(item => item[fieldName] === value);
          break;
        case '>':
          results = results.filter(item => item[fieldName] > value);
          break;
        case '>=':
          results = results.filter(item => item[fieldName] >= value);
          break;
        case '<':
          results = results.filter(item => item[fieldName] < value);
          break;
        case '<=':
          results = results.filter(item => item[fieldName] <= value);
          break;
      }
    });
  }
  
  // Handle limit
  if (params.Limit && params.Limit > 0) {
    results = results.slice(0, params.Limit);
  }
  
  // Handle sort order
  if (params.ScanIndexForward === false) {
    results.reverse();
  }
  
  return Promise.resolve(results);
});

// Scan items from a table
const scanItems = jest.fn().mockImplementation((tableName, params = {}) => {
  const table = mockDatabase[tableName] || [];
  let results = [...table];
  
  // Handle filter expression
  if (params.FilterExpression) {
    const conditions = params.FilterExpression.split(' AND ');
    
    conditions.forEach(condition => {
      const [fieldPath, operator, valuePath] = condition.split(/\s+/);
      const fieldName = fieldPath;
      const valueKey = valuePath;
      const value = params.ExpressionAttributeValues[valueKey];
      
      switch (operator) {
        case '=':
          results = results.filter(item => item[fieldName] === value);
          break;
        case '>':
          results = results.filter(item => item[fieldName] > value);
          break;
        case '>=':
          results = results.filter(item => item[fieldName] >= value);
          break;
        case '<':
          results = results.filter(item => item[fieldName] < value);
          break;
        case '<=':
          results = results.filter(item => item[fieldName] <= value);
          break;
      }
    });
  }
  
  // Handle limit
  if (params.Limit && params.Limit > 0) {
    results = results.slice(0, params.Limit);
  }
  
  return Promise.resolve(results);
});

// Populate the mock database with test data
const populateMockDatabase = (data) => {
  Object.keys(data).forEach(tableName => {
    mockDatabase[tableName] = [...data[tableName]];
  });
};

module.exports = {
  getItem,
  putItem,
  updateItem,
  deleteItem,
  queryItems,
  scanItems,
  resetMockDatabase,
  populateMockDatabase,
  mockDatabase
};