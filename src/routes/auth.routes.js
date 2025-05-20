import { Router } from 'express';
import { registerUser, confirmRegistration, loginUser, refreshTokens, forgotPassword, confirmNewPassword, getUserProfile, logoutUser } from '../services/auth.service';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, ...attributes } = req.body;
    
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }
    
    const result = await registerUser(email, password, attributes);
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/confirm
 * @desc Confirm user registration
 * @access Public
 */
router.post('/confirm', async (req, res, next) => {
  try {
    const { email, confirmationCode } = req.body;
    
    if (!email || !confirmationCode) {
      throw new BadRequestError('Email and confirmation code are required');
    }
    
    const result = await confirmRegistration(email, confirmationCode);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }
    
    const result = await loginUser(email, password);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh user tokens
 * @access Public
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }
    
    const result = await refreshTokens(refreshToken);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Initiate forgot password flow
 * @access Public
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new BadRequestError('Email is required');
    }
    
    const result = await forgotPassword(email);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with confirmation code
 * @access Public
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, confirmationCode, newPassword } = req.body;
    
    if (!email || !confirmationCode || !newPassword) {
      throw new BadRequestError('Email, confirmation code, and new password are required');
    }
    
    const result = await confirmNewPassword(email, confirmationCode, newPassword);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', async (req, res, next) => {
  try {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestError('Access token is required');
    }
    
    const accessToken = authHeader.split(' ')[1];
    const result = await getUserProfile(accessToken);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', async (req, res, next) => {
  try {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestError('Access token is required');
    }
    
    const accessToken = authHeader.split(' ')[1];
    const result = await logoutUser(accessToken);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;