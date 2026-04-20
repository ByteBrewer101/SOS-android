const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn('⚠️  Supabase env vars not set. OTP functionality will be disabled.');
}

/**
 * Supabase Admin client (service role) — used server-side for OTP management.
 * The service role key bypasses Row Level Security and allows admin operations.
 * NEVER expose this key to the client.
 */
const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

module.exports = supabaseAdmin;
