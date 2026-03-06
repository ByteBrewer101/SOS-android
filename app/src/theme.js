/**
 * SOS App Design Tokens
 * Senior-friendly: high contrast, large touch targets, clear typography
 */

export const COLORS = {
    // Primary
    primary: '#E53E3E',
    primaryDark: '#C53030',
    primaryLight: '#FC8181',

    // Background
    bg: '#0A0A0F',
    bgCard: '#141420',
    bgElevated: '#1A1A2E',
    bgInput: '#1E1E30',

    // Surface
    surface: '#16213E',
    surfaceLight: '#1A1A2E',

    // Text
    textPrimary: '#F7FAFC',
    textSecondary: '#A0AEC0',
    textMuted: '#718096',
    textDanger: '#FC8181',

    // Accent
    accent: '#4FD1C5',
    accentDark: '#38B2AC',

    // Status
    success: '#48BB78',
    warning: '#ECC94B',
    danger: '#FC8181',
    info: '#63B3ED',

    // Borders
    border: '#2D3748',
    borderLight: '#4A5568',

    // Gradient pairs
    gradientPrimary: ['#E53E3E', '#C53030'],
    gradientDark: ['#1A1A2E', '#0A0A0F'],
    gradientCard: ['#1E1E30', '#141420'],
    gradientAccent: ['#4FD1C5', '#38B2AC'],
    gradientSOS: ['#E53E3E', '#9B2C2C'],
};

export const FONTS = {
    sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 22,
        xxl: 28,
        hero: 40,
        mega: 56,
    },
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
};

export const SHADOWS = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    button: {
        shadowColor: '#E53E3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    glow: {
        shadowColor: '#E53E3E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 16,
    },
};
