const userModel = require('../MODELS/userModel');
const userService = require('../Services/userservice');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passwordResetEmail = require('../Services/passwordResetEmail');

const resetTokenLifetimeMs = 30 * 60 * 1000;
const genericResetMessage = "If an account exists for this email, we've sent you a password reset link.";

const publicUser = (user) => {
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;
    return safeUser;
};

const sendValidationError = (res, errors) => res.status(400).json({
    message: errors.array()[0]?.msg || 'Please check the submitted information.',
    errors: errors.array()
});

module.exports.signup = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const { username, password } = req.body;
    const email = String(req.body.email || '').trim();

    try {
        const isUserExist = await userModel.findOne({ email });

        if (isUserExist) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await userModel.hashPassword(password);

        const user = await userService.createUser({ username, email, password: hashedPassword });
        const token = user.generateAuthToken();

        return res.status(201).json({ message: 'User created successfully', user: publicUser(user), token });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Email already exists' });
        console.error('Customer signup failed');
        return res.status(500).json({ message: 'Unable to create your account. Please try again.' });
    }
};

module.exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = user.generateAuthToken();
        return res.status(200).json({ message: 'Login successful', user: publicUser(user), token });
    } catch {
        return res.status(500).json({ message: 'Unable to log in. Please try again.' });
    }
};

module.exports.forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    if (!passwordResetEmail.isConfigured()) {
        return res.status(503).json({ message: 'Password reset is temporarily unavailable. Please try again later.' });
    }

    const email = String(req.body.email || '').trim();
    const safeEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    try {
        const user = await userModel.findOne({
            email: { $regex: `^${safeEmail}$`, $options: 'i' },
            role: 'user'
        });

        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = new Date(Date.now() + resetTokenLifetimeMs);
            await user.save();

            try {
                await passwordResetEmail.send({
                    email: user.email,
                    username: user.username,
                    token: rawToken
                });
            } catch (error) {
                await userModel.updateOne(
                    { _id: user._id, resetPasswordToken: hashedToken },
                    { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
                );
                console.error('Password reset email could not be delivered');
            }
        }

        return res.status(200).json({ message: genericResetMessage });
    } catch {
        return res.status(200).json({ message: genericResetMessage });
    }
};

module.exports.resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    const rawToken = String(req.params.token || '');
    const { password } = req.body;

    if (!rawToken) return res.status(400).json({ message: 'This password reset link is invalid.' });

    try {
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const tokenOwner = await userModel.findOne({ role: 'user', resetPasswordToken: hashedToken })
            .select('+resetPasswordExpires');

        if (!tokenOwner) return res.status(400).json({ message: 'This password reset link is invalid.' });
        if (!tokenOwner.resetPasswordExpires || tokenOwner.resetPasswordExpires <= new Date()) {
            return res.status(400).json({ message: 'This password reset link has expired. Please request a new one.' });
        }

        const hashedPassword = await userModel.hashPassword(password);
        const user = await userModel.findOneAndUpdate(
            {
                role: 'user',
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: new Date() }
            },
            {
                $set: { password: hashedPassword },
                $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
            },
            { new: true }
        );

        if (user) return res.status(200).json({ message: 'Password reset successfully. You can now login with your new password.' });

        const expiredUser = await userModel.findOne({ role: 'user', resetPasswordToken: hashedToken }).select('+resetPasswordExpires');
        if (expiredUser && expiredUser.resetPasswordExpires <= new Date()) {
            return res.status(400).json({ message: 'This password reset link has expired. Please request a new one.' });
        }
        return res.status(400).json({ message: 'This password reset link is invalid.' });
    } catch {
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};