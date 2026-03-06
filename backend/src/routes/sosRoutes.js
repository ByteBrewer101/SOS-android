const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, sosTriggerRules } = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: SOS
 *   description: SOS emergency alert endpoints
 */

/**
 * @swagger
 * /sos/trigger:
 *   post:
 *     summary: Trigger SOS emergency alert
 *     description: |
 *       Triggers an emergency SOS alert. This will:
 *       1. Create an SOS log entry with the elder's location
 *       2. Log alert to emergency contact (SMS gateway not yet configured)
 *       3. Log notifications to volunteers (push notifications not yet configured)
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 28.6139
 *                 description: GPS latitude coordinate
 *               longitude:
 *                 type: number
 *                 example: 77.2090
 *                 description: GPS longitude coordinate
 *     responses:
 *       200:
 *         description: SOS alert triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: SOS alert triggered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sosId:
 *                       type: string
 *                     locationLink:
 *                       type: string
 *                       example: "https://www.google.com/maps?q=28.6139,77.2090"
 *                     emergencyContactNotified:
 *                       type: boolean
 *                     volunteersNotified:
 *                       type: integer
 *       401:
 *         description: Not authorized
 */
router.post('/trigger', protect, authorize('elder'), sosTriggerRules, validate, sosController.triggerSOS);

/**
 * @swagger
 * /sos/logs:
 *   get:
 *     summary: Get SOS history for the logged-in elder
 *     tags: [SOS]
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
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: SOS logs retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/logs', protect, authorize('elder'), sosController.getSOSLogs);

/**
 * @swagger
 * /sos/logs/{id}:
 *   get:
 *     summary: Get a specific SOS log by ID
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SOS log ID
 *     responses:
 *       200:
 *         description: SOS log retrieved successfully
 *       404:
 *         description: SOS log not found
 */
router.get('/logs/:id', protect, sosController.getSOSLogById);

module.exports = router;
