const express = require('express');
const foldingService = require('../services/folding.service');
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
 * @route GET /api/folding/config
 * @desc Get Folding@Home configuration for the current user
 * @access Private
 */
router.get('/config', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    
    const config = await foldingService.getConfiguration(userId);
    
    res.status(200).json({
      status: 'success',
      data: config
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/folding/config
 * @desc Create or update Folding@Home configuration
 * @access Private
 */
router.post('/config', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    const config = req.body;
    
    if (!config) {
      throw new BadRequestError('Configuration is required');
    }
    
    const savedConfig = await foldingService.saveConfiguration(userId, config);
    
    res.status(200).json({
      status: 'success',
      data: savedConfig
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/folding/config
 * @desc Delete Folding@Home configuration
 * @access Private
 */
router.delete('/config', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    
    const result = await foldingService.deleteConfiguration(userId);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/folding/instances/:id/apply-config
 * @desc Apply Folding@Home configuration to an instance
 * @access Private
 */
router.post('/instances/:id/apply-config', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    const { id } = req.params;
    
    const result = await foldingService.applyConfigurationToInstance(userId, id);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/folding/stats
 * @desc Get Folding@Home stats
 * @access Private
 * @query {string} user - Folding@Home username (optional)
 * @query {string} team - Folding@Home team ID (optional)
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { user, team } = req.query;
    
    const stats = await foldingService.getStats(user, team);
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/folding/instances/:id/status
 * @desc Get Folding@Home status for an instance
 * @access Private
 */
router.get('/instances/:id/status', async (req, res, next) => {
  try {
    const userId = extractUserId(req);
    const { id } = req.params;
    
    const status = await foldingService.getInstanceStatus(userId, id);
    
    res.status(200).json({
      status: 'success',
      data: status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/folding/gpu-performance
 * @desc Get GPU performance data for comparison charts
 * @access Private
 * @query {string} chartType - Type of chart (performancePerDollar, rawPerformance, availability)
 */
router.get('/gpu-performance', async (req, res, next) => {
  try {
    const { chartType } = req.query;
    
    if (!chartType) {
      throw new BadRequestError('Chart type is required');
    }
    
    const performanceData = await foldingService.getGpuPerformanceData(chartType);
    
    res.status(200).json({
      status: 'success',
      data: performanceData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;