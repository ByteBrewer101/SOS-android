const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');
const {
    validate,
    elderRegistrationRules,
    volunteerRegistrationRules,
    loginRules,
    otpSendRules,
    otpVerifyRules,
    aadhaarOtpSendRules,
    aadhaarOtpVerifyRules,
    forgotPasswordRequestRules,
    forgotPasswordVerifyRules,
    resetPasswordRules,
} = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, and OTP verification
 */

/**
 * @swagger
 * /auth/elder/register:
 *   post:
 *     summary: Register a new elder user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - emergencyContactName
 *               - emergencyContactNumber
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rajesh Kumar
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               emergencyContactName:
 *                 type: string
 *                 example: Suresh Kumar
 *               emergencyContactNumber:
 *                 type: string
 *                 example: "9876543211"
 *     responses:
 *       201:
 *         description: Elder registered successfully
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/elder/register', elderRegistrationRules, validate, authController.registerElder);

/**
 * @swagger
 * /auth/volunteer/register:
 *   post:
 *     summary: Register a new volunteer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - aadhaarNumber
 *             properties:
 *               name:
 *                 type: string
 *                 example: Amit Singh
 *               email:
 *                 type: string
 *                 example: "vol@example.com"
 *               phone:
 *                 type: string
 *                 example: "9876543212"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               aadhaarNumber:
 *                 type: string
 *                 example: "123456789012"
 *     responses:
 *       201:
 *         description: Volunteer registered successfully
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/volunteer/register', volunteerRegistrationRules, validate, authController.registerVolunteer);

/**
 * @swagger
 * /auth/elder/login:
 *   post:
 *     summary: Login as elder user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/elder/login', loginRules, validate, authController.loginElder);

/**
 * @swagger
 * /auth/volunteer/login:
 *   post:
 *     summary: Login as volunteer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "vol@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/volunteer/login', loginRules, validate, authController.loginVolunteer);

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send email OTP for verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send-otp', otpSendRules, validate, authController.sendOTP);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify email OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', otpVerifyRules, validate, authController.verifyOTP);

/**
 * @swagger
 * /auth/aadhaar/send-otp:
 *   post:
 *     summary: Send Aadhaar OTP for volunteer verification
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aadhaarNumber
 *             properties:
 *               aadhaarNumber:
 *                 type: string
 *                 example: "123456789012"
 *     responses:
 *       200:
 *         description: Aadhaar OTP sent successfully
 */
router.post(
    '/aadhaar/send-otp',
    protect,
    authorize('volunteer'),
    aadhaarOtpSendRules,
    validate,
    authController.sendAadhaarOTP
);

/**
 * @swagger
 * /auth/aadhaar/verify-otp:
 *   post:
 *     summary: Verify Aadhaar OTP to activate volunteer account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aadhaarNumber
 *               - otp
 *             properties:
 *               aadhaarNumber:
 *                 type: string
 *                 example: "123456789012"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Aadhaar verified and account activated
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
    '/aadhaar/verify-otp',
    protect,
    authorize('volunteer'),
    aadhaarOtpVerifyRules,
    validate,
    authController.verifyAadhaarOTP
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset OTP (sent to registered email)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent if email is registered
 */
router.post('/forgot-password', forgotPasswordRequestRules, validate, authController.forgotPasswordRequest);

/**
 * @swagger
 * /auth/forgot-password/verify-otp:
 *   post:
 *     summary: Verify the password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/forgot-password/verify-otp', forgotPasswordVerifyRules, validate, authController.verifyForgotPasswordOTP);

/**
 * @swagger
 * /auth/forgot-password/reset:
 *   post:
 *     summary: Reset password after OTP verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: OTP not verified or session expired
 */
router.post('/forgot-password/reset', resetPasswordRules, validate, authController.resetPassword);

module.exports = router;
