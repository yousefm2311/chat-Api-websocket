const express = require('express');
const { body, validationResult } = require('express-validator');
const { login, register } = require('../controllers/authController');
const router = express.Router();

const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({ errors: errors.array() });
  };
};

router.post('/login', validateRequest([
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
]), login);

router.post('/register', validateRequest([
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[a-zA-Z]/).withMessage('Password must contain a letter')
]), register);

module.exports = router;