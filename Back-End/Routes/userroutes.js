const express = require('express');
const router = express.Router();
const userService = require('../Services/userservice');
const { body } = require("express-validator");
const UserController = require('../Controller/usercontroller');

// Create a new user
router.post('/signup', [
    body('username').notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
] , UserController.signup
)

router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().isLength({ min: 6 }).withMessage('Password is required')
], UserController.login);

router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please enter a valid email address.')
], UserController.forgotPassword);

router.post('/reset-password/:token', [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
], UserController.resetPassword);

module.exports = router;