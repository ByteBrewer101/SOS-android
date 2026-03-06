/**
 * Firebase stub - Firebase features are disabled for now.
 * Re-enable when Firebase credentials are available.
 */
const logger = require('../utils/logger');

const initializeFirebase = () => {
    logger.info('ℹ️  Firebase is disabled. Push notifications are not available.');
};

const isFirebaseInitialized = () => false;

module.exports = { initializeFirebase, isFirebaseInitialized };
