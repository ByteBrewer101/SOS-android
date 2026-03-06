const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, deviceTokenRules } = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Volunteer
 *   description: Volunteer profile and alert management
 */

/**
 * @swagger
 * /volunteer/profile:
 *   get:
 *     summary: Get volunteer profile
 *     tags: [Volunteer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/profile', protect, authorize('volunteer'), volunteerController.getProfile);

/**
 * @swagger
 * /volunteer/device-token:
 *   put:
 *     summary: Update volunteer FCM device token
 *     tags: [Volunteer]
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
router.put('/device-token', protect, authorize('volunteer'), deviceTokenRules, validate, volunteerController.updateDeviceToken);

/**
 * @swagger
 * /volunteer/alerts:
 *   get:
 *     summary: Get recent SOS alerts
 *     tags: [Volunteer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of alerts per page
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/alerts', protect, authorize('volunteer'), volunteerController.getAlerts);

module.exports = router;
