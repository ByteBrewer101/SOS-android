/**
 * SOS App Design Tokens — Light Cream Theme
 * Navy Blue navigation, Cream backgrounds, Orange actions, Red SOS
 */

export const COLORS = {
    // Primary — Orange for buttons/actions
    primary: '#E67E22',
    primaryDark: '#CF6D17',
    primaryLight: '#F0983A',

    // Navy — for top bars, navigation, headings
    navy: '#1E3A5F',
    navyDark: '#152D4A',
    navyLight: '#2A4E7A',

    // Background — Cream light theme
    bg: '#F8F6F0',
    bgCard: '#FFFFFF',
    bgElevated: '#F0EDE6',
    bgInput: '#FFFFFF',

    // Surface
    surface: '#FFFFFF',
    surfaceLight: '#F0EDE6',

    // Text — Dark Grey
    textPrimary: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    textDanger: '#D32F2F',
    textOnDark: '#FFFFFF',
    textOnOrange: '#FFFFFF',

    // Accent — Orange for interactive links
    accent: '#E67E22',
    accentDark: '#CF6D17',

    // Status
    success: '#A8C3A0',
    successDark: '#8FB387',
    warning: '#F0983A',
    danger: '#D32F2F',
    dangerLight: '#E57373',
    info: '#1E3A5F',

    // Borders
    border: '#E0DDD6',
    borderLight: '#E8E5DE',

    // SOS — Red emergency
    sos: '#D32F2F',
    sosDark: '#B71C1C',

    // Gradient pairs
    gradientPrimary: ['#E67E22', '#CF6D17'],
    gradientDark: ['#F8F6F0', '#F0EDE6'],
    gradientCard: ['#FFFFFF', '#FFFFFF'],
    gradientAccent: ['#E67E22', '#CF6D17'],
    gradientSOS: ['#D32F2F', '#B71C1C'],
    gradientNavy: ['#1E3A5F', '#152D4A'],
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
        shadowColor: '#1E3A5F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    button: {
        shadowColor: '#E67E22',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
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
