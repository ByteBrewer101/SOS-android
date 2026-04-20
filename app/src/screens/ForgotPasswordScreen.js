/**
 * ForgotPasswordScreen
 * 3-step flow: Enter email → Verify OTP → Set new password
 * Works for both Elder and Volunteer (role-agnostic)
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import {
    forgotPasswordRequest,
    verifyForgotPasswordOTP,
    resetPassword,
} from '../services/api';

const STEPS = {
    EMAIL: 0,
    OTP: 1,
    NEW_PASSWORD: 2,
    SUCCESS: 3,
};

const OTP_RESEND_SECONDS = 60;

export default function ForgotPasswordScreen({ navigation, route }) {
    const { role } = route.params || {};
    const isElder = role === 'elder';

    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail]         = useState('');
    const [otp, setOtp]             = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword]       = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [loading, setLoading]     = useState(false);
    const [countdown, setCountdown] = useState(0);

    const fadeAnim   = useRef(new Animated.Value(0)).current;
    const slideAnim  = useRef(new Animated.Value(30)).current;
    const timerRef   = useRef(null);
    const otpInputs  = useRef([]);

    // ── Animation helpers ─────────────────────────────────────────────
    const animateIn = () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
    };

    useEffect(() => { animateIn(); }, [step]);

    // ── Countdown timer ───────────────────────────────────────────────
    const startCountdown = () => {
        setCountdown(OTP_RESEND_SECONDS);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => () => clearInterval(timerRef.current), []);

    // ── Step 1 — Send OTP ─────────────────────────────────────────────
    const handleSendOTP = async () => {
        if (!email.trim()) {
            Alert.alert('Missing Field', 'Please enter your email address.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            const result = await forgotPasswordRequest(email.trim().toLowerCase());
            if (result.ok && result.data.success) {
                startCountdown();
                setStep(STEPS.OTP);
            } else {
                Alert.alert('Error', result.data?.message || 'Something went wrong. Please try again.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2 — Verify OTP ───────────────────────────────────────────
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your email.');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyForgotPasswordOTP(email.trim().toLowerCase(), otp);
            if (result.ok && result.data.success) {
                setStep(STEPS.NEW_PASSWORD);
            } else {
                Alert.alert('Verification Failed', result.data?.message || 'Invalid or expired OTP.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ────────────────────────────────────────────────────
    const handleResend = async () => {
        if (countdown > 0) return;
        setOtp('');
        setLoading(true);
        try {
            const result = await forgotPasswordRequest(email.trim().toLowerCase());
            if (result.ok && result.data.success) {
                startCountdown();
                Alert.alert('OTP Resent', 'A new code has been sent to your email.');
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    // ── Step 3 — Reset Password ───────────────────────────────────────
    const handleResetPassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            Alert.alert('Missing Fields', 'Please fill in both password fields.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'Passwords do not match. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const result = await resetPassword(email.trim().toLowerCase(), newPassword);
            if (result.ok && result.data.success) {
                setStep(STEPS.SUCCESS);
            } else {
                Alert.alert('Reset Failed', result.data?.message || 'Unable to reset password. Please start over.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // ── gradient colour based on role ────────────────────────────────
    const gradientColors = isElder ? COLORS.gradientSOS : COLORS.gradientAccent;

    // ── Step indicators ───────────────────────────────────────────────
    const renderStepDots = () => (
        <View style={styles.stepDots}>
            {[STEPS.EMAIL, STEPS.OTP, STEPS.NEW_PASSWORD].map(s => (
                <View
                    key={s}
                    style={[
                        styles.dot,
                        step >= s && styles.dotActive,
                        step === s && styles.dotCurrent,
                    ]}
                />
            ))}
        </View>
    );

    // ── Render ────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                        {/* Back button */}
                        {step !== STEPS.SUCCESS && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => step === STEPS.EMAIL ? navigation.goBack() : setStep(step - 1)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
                                <Text style={styles.backText}>
                                    {step === STEPS.EMAIL ? 'Back' : 'Previous'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Lock icon */}
                        <View style={styles.iconWrapper}>
                            <LinearGradient colors={gradientColors} style={styles.iconCircle}>
                                <Ionicons
                                    name={step === STEPS.SUCCESS ? 'checkmark' : 'lock-closed'}
                                    size={32}
                                    color="#fff"
                                />
                            </LinearGradient>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>
                            {step === STEPS.EMAIL        && 'Forgot Password'}
                            {step === STEPS.OTP          && 'Enter OTP'}
                            {step === STEPS.NEW_PASSWORD && 'New Password'}
                            {step === STEPS.SUCCESS      && 'All Done!'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === STEPS.EMAIL        && 'Enter your registered email to receive an OTP'}
                            {step === STEPS.OTP          && `We sent a 6-digit code to\n${email}`}
                            {step === STEPS.NEW_PASSWORD && 'Choose a strong new password'}
                            {step === STEPS.SUCCESS      && 'Your password has been reset successfully'}
                        </Text>

                        {/* Step dots */}
                        {step !== STEPS.SUCCESS && renderStepDots()}

                        {/* ── Step 0: Email ──────────────────────────── */}
                        {step === STEPS.EMAIL && (
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="your@email.com"
                                            placeholderTextColor={COLORS.textMuted}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            value={email}
                                            onChangeText={setEmail}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity activeOpacity={0.85} onPress={handleSendOTP} disabled={loading}>
                                    <LinearGradient colors={gradientColors} style={styles.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading
                                            ? <ActivityIndicator color="#fff" size="small" />
                                            : <Text style={styles.buttonText}>Send OTP</Text>
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── Step 1: OTP ────────────────────────────── */}
                        {step === STEPS.OTP && (
                            <View style={styles.form}>
                                <View style={styles.otpInfo}>
                                    <Ionicons name="mail" size={16} color={COLORS.accent} />
                                    <Text style={styles.otpInfoText}>Check your inbox (and spam folder)</Text>
                                </View>

                                {/* OTP single field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>6-Digit Code</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="keypad-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, styles.otpInput]}
                                            placeholder="000000"
                                            placeholderTextColor={COLORS.textMuted}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            value={otp}
                                            onChangeText={setOtp}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity activeOpacity={0.85} onPress={handleVerifyOTP} disabled={loading}>
                                    <LinearGradient colors={gradientColors} style={styles.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading
                                            ? <ActivityIndicator color="#fff" size="small" />
                                            : <Text style={styles.buttonText}>Verify Code</Text>
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Resend */}
                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={handleResend}
                                    disabled={countdown > 0 || loading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                                        {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── Step 2: New Password ───────────────────── */}
                        {step === STEPS.NEW_PASSWORD && (
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder="Min. 6 characters"
                                            placeholderTextColor={COLORS.textMuted}
                                            secureTextEntry={!showPassword}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                            <Ionicons
                                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={20}
                                                color={COLORS.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <View style={[
                                        styles.inputContainer,
                                        confirmPassword && newPassword !== confirmPassword && styles.inputError,
                                    ]}>
                                        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder="Re-enter new password"
                                            placeholderTextColor={COLORS.textMuted}
                                            secureTextEntry={!showConfirm}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                                            <Ionicons
                                                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                                size={20}
                                                color={COLORS.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {confirmPassword !== '' && newPassword !== confirmPassword && (
                                        <Text style={styles.errorText}>Passwords do not match</Text>
                                    )}
                                </View>

                                <TouchableOpacity activeOpacity={0.85} onPress={handleResetPassword} disabled={loading}>
                                    <LinearGradient colors={gradientColors} style={styles.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading
                                            ? <ActivityIndicator color="#fff" size="small" />
                                            : <Text style={styles.buttonText}>Reset Password</Text>
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── Step 3: Success ────────────────────────── */}
                        {step === STEPS.SUCCESS && (
                            <View style={styles.successContainer}>
                                <View style={styles.successCard}>
                                    <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                                    <Text style={styles.successTitle}>Password Updated!</Text>
                                    <Text style={styles.successBody}>
                                        You can now log in using your new password.
                                    </Text>
                                </View>

                                <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Login', { role })}>
                                    <LinearGradient colors={gradientColors} style={styles.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Text style={styles.buttonText}>Back to Login</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: COLORS.bg },
    flex:           { flex: 1 },
    scrollContent:  {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.huge,
    },
    content:        {},

    // Back
    backButton:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xl },
    backText:       { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },

    // Icon
    iconWrapper:    { alignItems: 'center', marginBottom: SPACING.xl },
    iconCircle:     {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        ...SHADOWS.button,
    },

    // Header
    title:          {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle:       {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },

    // Step dots
    stepDots:       { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xxxl },
    dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
    dotActive:      { backgroundColor: COLORS.textMuted },
    dotCurrent:     { width: 24, backgroundColor: COLORS.accent },

    // Form
    form:           { gap: SPACING.xl },
    inputGroup:     { gap: SPACING.sm },
    label:          {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgInput,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.lg,
        height: 56,
    },
    inputError:     { borderColor: COLORS.danger },
    inputIcon:      { marginRight: SPACING.sm },
    input:          {
        flex: 1,
        fontSize: FONTS.sizes.lg,
        color: COLORS.textPrimary,
        height: '100%',
    },
    otpInput:       {
        letterSpacing: 4,
        fontWeight: FONTS.weights.bold,
        fontSize: FONTS.sizes.xl,
    },
    eyeButton:      { padding: SPACING.sm },
    errorText:      { fontSize: FONTS.sizes.sm, color: COLORS.danger, marginTop: 2 },

    // OTP hint
    otpInfo:        {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: '#FFF8F0',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    otpInfoText:    { fontSize: FONTS.sizes.sm, color: COLORS.accent, flex: 1 },

    // Resend
    resendButton:   { alignItems: 'center', paddingVertical: SPACING.sm },
    resendText:     { fontSize: FONTS.sizes.md, color: COLORS.accent, fontWeight: FONTS.weights.semibold },
    resendDisabled: { color: COLORS.textMuted },

    // Button
    button:         {
        height: 56,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
    },
    buttonText:     { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: '#fff' },

    // Success
    successContainer: { gap: SPACING.xxl },
    successCard:    {
        alignItems: 'center',
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.xl,
        padding: SPACING.xxxl,
        gap: SPACING.lg,
        ...SHADOWS.card,
    },
    successTitle:   {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
    },
    successBody:    {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});
