/**
 * SOS App Design Tokens - Minimal UI
 * High contrast, large touch targets, clear typography, no emojis
 */

export const COLORS = {
    // Primary
    primary: '#D32F2F', // Strong red for SOS
    primaryDark: '#B71C1C',
    primaryLight: '#EF5350',

    // Background - Minimal dark theme
    bg: '#121212',
    bgCard: '#1E1E1E',
    bgElevated: '#2C2C2C',
    bgInput: '#2C2C2C',

    // Surface
    surface: '#1E1E1E',
    surfaceLight: '#2C2C2C',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#808080',
    textDanger: '#EF5350',

    // Accent
    accent: '#FFFFFF',
    accentDark: '#E0E0E0',

    // Status
    success: '#388E3C',
    warning: '#FBC02D',
    danger: '#D32F2F',
    info: '#1976D2',

    // Borders
    border: '#333333',
    borderLight: '#444444',

    // Gradient pairs (simplified to solids for minimal look)
    gradientPrimary: ['#D32F2F', '#D32F2F'],
    gradientDark: ['#121212', '#121212'],
    gradientCard: ['#1E1E1E', '#1E1E1E'],
    gradientAccent: ['#FFFFFF', '#D6D6D6'],
    gradientSOS: ['#D32F2F', '#B71C1C'],
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
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
};

export const SHADOWS = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    button: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    glow: {
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
};
