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
 *               - phone
 *               - password
 *               - emergencyContactName
 *               - emergencyContactNumber
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rajesh Kumar
 *               phone:
 *                 type: string
 *                 example: "9876543210"
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
 *         description: Validation error or phone already exists
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
 *               - phone
 *               - password
 *               - aadhaarNumber
 *             properties:
 *               name:
 *                 type: string
 *                 example: Amit Singh
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
 *         description: Validation error or phone already exists
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
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
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
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543212"
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
 *     summary: Send phone OTP for verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send-otp', otpSendRules, validate, authController.sendOTP);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify phone OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
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

module.exports = router;
