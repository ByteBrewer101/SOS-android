const express = require('express');
const router = express.Router();
const elderController = require('../controllers/elderController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, elderProfileUpdateRules, deviceTokenRules } = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Elder
 *   description: Elder user profile management
 */

/**
 * @swagger
 * /elder/profile:
 *   get:
 *     summary: Get elder profile
 *     tags: [Elder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/profile', protect, authorize('elder'), elderController.getProfile);

/**
 * @swagger
 * /elder/profile:
 *   put:
 *     summary: Update elder profile
 *     tags: [Elder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rajesh Kumar Updated
 *               emergencyContactName:
 *                 type: string
 *                 example: Suresh Kumar
 *               emergencyContactNumber:
 *                 type: string
 *                 example: "9876543211"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 */
router.put('/profile', protect, authorize('elder'), elderProfileUpdateRules, validate, elderController.updateProfile);

/**
 * @swagger
 * /elder/device-token:
 *   put:
 *     summary: Update elder FCM device token
 *     tags: [Elder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *                 example: "fcm_device_token_here"
 *     responses:
 *       200:
 *         description: Device token updated successfully
 */
router.put('/device-token', protect, authorize('elder'), deviceTokenRules, validate, elderController.updateDeviceToken);

/**
 * @swagger
 * /elder/volunteers:
 *   get:
 *     summary: Get all available verified volunteers
 *     tags: [Elder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Volunteers retrieved successfully
 */
router.get('/volunteers', protect, authorize('elder'), elderController.getVolunteers);

/**
 * @swagger
 * /elder/volunteers:
 *   post:
 *     summary: Select matching volunteers for SOS alerts
 *     tags: [Elder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - volunteerIds
 *             properties:
 *               volunteerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ecb8b392d700153d3f9f", "60d5ecb8b392d700153d3f9e"]
 *     responses:
 *       200:
 *         description: Volunteers selected successfully
 *       400:
 *         description: Validation error or less than 2 volunteers
 */
router.post('/volunteers', protect, authorize('elder'), elderController.selectVolunteers);

module.exports = router;
