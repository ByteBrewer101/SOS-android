const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health check
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'SOS Backend API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
