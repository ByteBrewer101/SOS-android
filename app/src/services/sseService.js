/**
 * SSE Service — manages Server-Sent Events connection for real-time notifications
 */
import API_BASE_URL from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = '@sos_token';

class SSEService {
    constructor() {
        this.eventSource = null;
        this.listeners = new Map();
        this.reconnectTimeout = null;
        this.reconnectDelay = 3000; // start with 3 seconds
        this.maxReconnectDelay = 30000; // max 30 seconds
        this.isConnecting = false;
        this.isManualClose = false;
    }

    /**
     * Connect to the SSE endpoint
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.eventSource || this.isConnecting) {
            return;
        }

        this.isConnecting = true;
        this.isManualClose = false;

        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            if (!token) {
                console.log('SSE: No auth token, cannot connect');
                this.isConnecting = false;
                return;
            }

            // Build SSE URL with token as query param (EventSource doesn't support headers)
            const sseUrl = `${API_BASE_URL}/volunteer/sse?token=${encodeURIComponent(token)}`;

            // Use RN EventSource polyfill or fetch-based approach
            this._connectWithFetch(sseUrl, token);
        } catch (err) {
            console.log('SSE: Connection error:', err);
            this.isConnecting = false;
            this._scheduleReconnect();
        }
    }

    /**
     * Fetch-based SSE implementation (works on React Native)
     */
    _connectWithFetch(url, token) {
        const abortController = new AbortController();
        this._abortController = abortController;

        const sseUrl = `${API_BASE_URL}/volunteer/sse`;

        fetch(sseUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Authorization': `Bearer ${token}`,
            },
            signal: abortController.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`SSE connection failed: ${response.status}`);
                }

                this.isConnecting = false;
                this.reconnectDelay = 3000; // reset backoff on successful connection
                console.log('SSE: Connected successfully');
                this._emit('connected', { message: 'SSE connection established' });

                // Read the stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                const readStream = () => {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            console.log('SSE: Stream ended');
                            if (!this.isManualClose) {
                                this._scheduleReconnect();
                            }
                            return;
                        }

                        buffer += decoder.decode(value, { stream: true });

                        // Parse SSE events from buffer
                        const events = buffer.split('\n\n');
                        buffer = events.pop(); // keep incomplete event in buffer

                        for (const eventStr of events) {
                            if (!eventStr.trim()) continue;
                            this._parseEvent(eventStr);
                        }

                        readStream();
                    }).catch((err) => {
                        if (err.name !== 'AbortError') {
                            console.log('SSE: Read error:', err.message);
                            if (!this.isManualClose) {
                                this._scheduleReconnect();
                            }
                        }
                    });
                };

                readStream();
            })
            .catch((err) => {
                this.isConnecting = false;
                if (err.name !== 'AbortError') {
                    console.log('SSE: Fetch error:', err.message);
                    if (!this.isManualClose) {
                        this._scheduleReconnect();
                    }
                }
            });
    }

    /**
     * Parse an individual SSE event string
     */
    _parseEvent(eventStr) {
        let eventName = 'message';
        let data = '';

        const lines = eventStr.split('\n');
        for (const line of lines) {
            if (line.startsWith('event: ')) {
                eventName = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
                data = line.slice(6).trim();
            } else if (line.startsWith(':')) {
                // Comment/heartbeat, ignore
                return;
            }
        }

        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log(`SSE: Received event "${eventName}":`, parsed);
                this._emit(eventName, parsed);
            } catch (e) {
                console.log(`SSE: Failed to parse event data:`, data);
            }
        }
    }

    /**
     * Schedule a reconnection with exponential backoff
     */
    _scheduleReconnect() {
        if (this.reconnectTimeout || this.isManualClose) return;

        console.log(`SSE: Reconnecting in ${this.reconnectDelay / 1000}s...`);
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.eventSource = null;
            this.connect();
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
    }

    /**
     * Disconnect from SSE
     */
    disconnect() {
        this.isManualClose = true;

        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.eventSource = null;
        this.isConnecting = false;
        this.reconnectDelay = 3000;
        console.log('SSE: Disconnected');
    }

    /**
     * Add an event listener
     * @param {string} event - Event name (e.g., 'sos_alert', 'connected')
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            if (this.listeners.has(event)) {
                this.listeners.get(event).delete(callback);
            }
        };
    }

    /**
     * Remove an event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event to all listeners
     */
    _emit(event, data) {
        if (this.listeners.has(event)) {
            for (const callback of this.listeners.get(event)) {
                try {
                    callback(data);
                } catch (err) {
                    console.log(`SSE: Listener error for "${event}":`, err);
                }
            }
        }
    }
}

// Singleton instance
const sseService = new SSEService();
export default sseService;
