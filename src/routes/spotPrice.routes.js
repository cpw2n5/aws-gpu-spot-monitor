const express = require('express');
const spotPriceService = require('../services/spotPrice.service');
const { BadRequestError } = require('../utils/errors');

const router = express.Router();

/**
 * @route GET /api/spot-prices/current
 * @desc Get current spot prices for GPU instances
 * @access Private
 * @query {string} region - AWS region (optional)
 * @query {string} instanceType - EC2 instance type (optional)
 */
router.get('/current', async (req, res, next) => {
  try {
    const { region, instanceType } = req.query;
    
    const result = await spotPriceService.getCurrentSpotPrices(region, instanceType);
    const { prices, anomalies, correlationId } = result;
    
    // Set correlation ID in response header
    res.setHeader('X-Correlation-ID', correlationId);
    
    res.status(200).json({
      status: 'success',
      data: {
        count: prices.length,
        prices,
        anomalies: {
          count: anomalies.length,
          items: anomalies
        },
        correlationId
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/spot-prices/history
 * @desc Get spot price history
 * @access Private
 * @query {string} instanceType - EC2 instance type (required)
 * @query {string} region - AWS region (optional)
 * @query {number} days - Number of days of history (default: 7)
 */
router.get('/history', async (req, res, next) => {
  try {
    const { instanceType, region, days } = req.query;
    
    if (!instanceType) {
      throw new BadRequestError('Instance type is required');
    }
    
    const daysNum = days ? parseInt(days, 10) : 7;
    
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
      throw new BadRequestError('Days must be a number between 1 and 90');
    }
    
    const prices = await spotPriceService.getSpotPriceHistory(instanceType, region, daysNum);
    
    res.status(200).json({
      status: 'success',
      data: {
        count: prices.length,
        instanceType,
        region: region || 'all',
        days: daysNum,
        prices
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/spot-prices/instance-types
 * @desc Get supported GPU instance types
 * @access Private
 */
router.get('/instance-types', (req, res) => {
  const instanceTypes = spotPriceService.getSupportedInstanceTypes();
  
  res.status(200).json({
    status: 'success',
    data: {
      count: instanceTypes.length,
      instanceTypes
    }
  });
});

/**
 * @route GET /api/spot-prices/regions
 * @desc Get supported AWS regions
 * @access Private
 */
router.get('/regions', (req, res) => {
  const regions = spotPriceService.getSupportedRegions();
  
  res.status(200).json({
    status: 'success',
    data: {
      count: regions.length,
      regions
    }
  });
});

module.exports = router;