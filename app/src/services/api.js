/**
 * API Service — all backend HTTP calls
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';

const TOKEN_KEY = '@sos_token';

/**
 * Get stored auth token
 */
const getToken = async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
};

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
    const token = await getToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            data: { success: false, message: 'Network error. Please check your connection.' },
        };
    }
};

// ─── Auth APIs ─────────────────────────────────────────────────────────

export const registerElder = async (body) => {
    return apiRequest('/auth/elder/register', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

export const registerVolunteer = async (body) => {
    return apiRequest('/auth/volunteer/register', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

export const loginElder = async (phone, password) => {
    return apiRequest('/auth/elder/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
    });
};

export const loginVolunteer = async (phone, password) => {
    return apiRequest('/auth/volunteer/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
    });
};

export const sendOTP = async (phone) => {
    return apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
};

export const verifyOTP = async (phone, otp) => {
    return apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
    });
};

export const sendAadhaarOTP = async (aadhaarNumber) => {
    return apiRequest('/auth/aadhaar/send-otp', {
        method: 'POST',
        body: JSON.stringify({ aadhaarNumber }),
    });
};

export const verifyAadhaarOTP = async (aadhaarNumber, otp) => {
    return apiRequest('/auth/aadhaar/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ aadhaarNumber, otp }),
    });
};

// ─── Elder APIs ────────────────────────────────────────────────────────

export const getElderProfile = async () => {
    return apiRequest('/elder/profile');
};

export const updateElderProfile = async (body) => {
    return apiRequest('/elder/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
    });
};

export const getAvailableVolunteers = async () => {
    return apiRequest('/elder/volunteers');
};

export const selectVolunteers = async (volunteerIds) => {
    return apiRequest('/elder/volunteers', {
        method: 'POST',
        body: JSON.stringify({ volunteerIds }),
    });
};

// ─── Volunteer APIs ────────────────────────────────────────────────────

export const getVolunteerProfile = async () => {
    return apiRequest('/volunteer/profile');
};

export const getVolunteerAlerts = async (page = 1, limit = 20) => {
    return apiRequest(`/volunteer/alerts?page=${page}&limit=${limit}`);
};

// ─── SOS APIs ──────────────────────────────────────────────────────────

export const triggerSOS = async (latitude, longitude) => {
    return apiRequest('/sos/trigger', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
    });
};

export const getSOSLogs = async (page = 1, limit = 20) => {
    return apiRequest(`/sos/logs?page=${page}&limit=${limit}`);
};

export const getSOSLogById = async (id) => {
    return apiRequest(`/sos/logs/${id}`);
};

// ─── Health ────────────────────────────────────────────────────────────

export const checkHealth = async () => {
    return apiRequest('/health');
};
