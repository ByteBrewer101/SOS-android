/**
 * SSE (Server-Sent Events) Manager
 * Manages connected volunteer SSE clients for real-time SOS notifications
 */
const logger = require('../utils/logger');

// Map of volunteerId -> Set of response objects (one volunteer can have multiple devices)
const connectedClients = new Map();

/**
 * Register a volunteer's SSE connection
 * @param {string} volunteerId - The volunteer's MongoDB _id
 * @param {object} res - Express response object (kept open for SSE)
 */
const addClient = (volunteerId, res) => {
    const id = volunteerId.toString();

    if (!connectedClients.has(id)) {
        connectedClients.set(id, new Set());
    }
    connectedClients.get(id).add(res);

    logger.info(`📡 SSE client connected: volunteer ${id} (total connections: ${getTotalConnections()})`);
};

/**
 * Remove a volunteer's SSE connection
 * @param {string} volunteerId
 * @param {object} res
 */
const removeClient = (volunteerId, res) => {
    const id = volunteerId.toString();

    if (connectedClients.has(id)) {
        connectedClients.get(id).delete(res);
        if (connectedClients.get(id).size === 0) {
            connectedClients.delete(id);
        }
    }

    logger.info(`📡 SSE client disconnected: volunteer ${id} (total connections: ${getTotalConnections()})`);
};

/**
 * Send an SSE event to a specific volunteer (all their connected devices)
 * @param {string} volunteerId
 * @param {string} event - Event name
 * @param {object} data - Event payload
 */
const sendToVolunteer = (volunteerId, event, data) => {
    const id = volunteerId.toString();

    if (!connectedClients.has(id)) {
        return false;
    }

    const clients = connectedClients.get(id);
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const res of clients) {
        try {
            res.write(payload);
        } catch (err) {
            logger.error(`Failed to send SSE to volunteer ${id}:`, err.message);
            clients.delete(res);
        }
    }

    return true;
};

/**
 * Broadcast an SSE event to multiple volunteers
 * @param {string[]} volunteerIds - Array of volunteer ID strings
 * @param {string} event - Event name
 * @param {object} data - Event payload
 * @returns {number} Number of volunteers who received the event
 */
const broadcastToVolunteers = (volunteerIds, event, data) => {
    let sentCount = 0;

    for (const vid of volunteerIds) {
        if (sendToVolunteer(vid, event, data)) {
            sentCount++;
        }
    }

    logger.info(`📡 SSE broadcast "${event}" sent to ${sentCount}/${volunteerIds.length} connected volunteers`);
    return sentCount;
};

/**
 * Send a heartbeat (keep-alive ping) to all connected clients
 */
const sendHeartbeat = () => {
    const comment = `: heartbeat ${Date.now()}\n\n`;

    for (const [id, clients] of connectedClients) {
        for (const res of clients) {
            try {
                res.write(comment);
            } catch (err) {
                clients.delete(res);
            }
        }
        // Clean up empty sets
        if (clients.size === 0) {
            connectedClients.delete(id);
        }
    }
};

/**
 * Get total number of active SSE connections
 */
const getTotalConnections = () => {
    let total = 0;
    for (const clients of connectedClients.values()) {
        total += clients.size;
    }
    return total;
};

/**
 * Check if a specific volunteer is connected
 * @param {string} volunteerId
 * @returns {boolean}
 */
const isConnected = (volunteerId) => {
    const id = volunteerId.toString();
    return connectedClients.has(id) && connectedClients.get(id).size > 0;
};

// Start heartbeat interval (every 30 seconds)
setInterval(sendHeartbeat, 30000);

module.exports = {
    addClient,
    removeClient,
    sendToVolunteer,
    broadcastToVolunteers,
    getTotalConnections,
    isConnected,
};
