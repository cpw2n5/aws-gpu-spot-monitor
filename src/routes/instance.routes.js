const express = require('express');
const instanceService = require('../services/instance.service');
const { BadRequestError } = require('../utils/errors');
const router = express.Router();

/**
 * Extract user ID from JWT token
 * @param {object} req - Express request object
 * @returns {string} User ID
 */
const extractUserId = (req) => {
  // In a real application, this would be extracted from the JWT token
  // For now, we'll get it from the request headers set by the Cognito authorizer
  const userId = req.headers['x-user-id'] || req.headers['cognito:username'];
  
  if (!userId) {
    throw new BadRequestError('User ID not found in request');
  }
  
  return userId;
};

/**
 * @route POST /api/instances
 * @desc Request a new spot instance
 * @access Private
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    const { 
      instanceType, 
      region, 
      maxPrice, 
      keyName, 
      securityGroupId, 
      subnetId,
      foldingConfig
    } = req.body;
    
    // Validate required fields
    if (!instanceType || !region || !maxPrice) {
      throw new BadRequestError('Instance type, region, and max price are required');
    }
    
    // Validate max price
    const maxPriceNum = parseFloat(maxPrice);
    if (isNaN(maxPriceNum) || maxPriceNum <= 0) {
      throw new BadRequestError('Max price must be a positive number');
    }
    
    const instance = await instanceService.requestSpotInstance(
      userId,
      instanceType,
      region,
      maxPriceNum,
      keyName,
      securityGroupId,
      subnetId,
      foldingConfig
    );
    
    res.status(201).json({
      status: 'success',
      data: instance
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/instances
 * @desc List instances for the current user
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    
    const instances = await instanceService.listInstances(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        count: instances.length,
        instances
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/instances/:id
 * @desc Get instance details
 * @access Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const instance = await instanceService.getInstance(id);
    
    // Verify that the instance belongs to the current user
    const userId = extractUserId(req);
    if (instance.userId !== userId) {
      throw new BadRequestError('You do not have permission to access this instance');
    }
    
    res.status(200).json({
      status: 'success',
      data: instance
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/instances/:id/status
 * @desc Update instance status
 * @access Private
 */
router.put('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the instance to verify ownership
    const instance = await instanceService.getInstance(id);
    
    // Verify that the instance belongs to the current user
    const userId = extractUserId(req);
    if (instance.userId !== userId) {
      throw new BadRequestError('You do not have permission to update this instance');
    }
    
    const updatedInstance = await instanceService.updateInstanceStatus(id);
    
    res.status(200).json({
      status: 'success',
      data: updatedInstance
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/instances/:id
 * @desc Terminate an instance
 * @access Private
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the instance to verify ownership
    const instance = await instanceService.getInstance(id);
    
    // Verify that the instance belongs to the current user
    const userId = extractUserId(req);
    if (instance.userId !== userId) {
      throw new BadRequestError('You do not have permission to terminate this instance');
    }
    
    const result = await instanceService.terminateInstance(id);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;