import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { sendOTP, verifyOTP } from '../services/api';

export default function OTPVerificationScreen() {
    const { user, updateUser, logout } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Send OTP on initial mount
        handleResendOTP();
    }, []);

    const handleVerify = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a 6-digit verification code.');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyOTP(user.email, otp);
            if (result.ok && result.data.success) {
                // OTP is correct, mark user as verified locally
                await updateUser({ ...user, emailVerified: true });
                Alert.alert('Success', 'Email verified successfully!');
            } else {
                Alert.alert('Verification Failed', result.data.message || 'Invalid OTP.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to verify OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResending(true);
        try {
            const result = await sendOTP(user.email);
            if (result.ok && result.data.success) {
                Alert.alert('OTP Sent', 'A verification code has been sent to your email.');
            } else {
                Alert.alert('Error', result.data.message || 'Could not send OTP.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send OTP.');
        } finally {
            setResending(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.content}>
                    <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="mail-unread-outline" size={40} color={COLORS.navy} />
                            </View>
                            <Text style={styles.title}>Check your email</Text>
                            <Text style={styles.subtitle}>
                                We've sent a 6-digit verification code to
                            </Text>
                            <Text style={styles.emailText}>{user?.email}</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Verification Code</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter 6-digit code"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        value={otp}
                                        onChangeText={setOtp}
                                        autoFocus
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleVerify}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={COLORS.gradientSOS}
                                    style={styles.button}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>Verify Email</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Resend Action */}
                            <View style={styles.resendContainer}>
                                <Text style={styles.resendText}>Didn't receive the code? </Text>
                                <TouchableOpacity onPress={handleResendOTP} disabled={resending}>
                                    {resending ? (
                                        <ActivityIndicator color={COLORS.accent} size="small" />
                                    ) : (
                                        <Text style={styles.resendLink}>Resend</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Cancel/Logout */}
                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <Text style={styles.logoutText}>Use a different account</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xxl,
    },
    inner: {},
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxxl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.card,
    },
    title: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    emailText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        marginTop: SPACING.xs,
    },
    form: {
        gap: SPACING.xl,
    },
    inputGroup: {
        gap: SPACING.sm,
    },
    label: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textSecondary,
    },
    inputContainer: {
        backgroundColor: COLORS.bgInput,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.lg,
        height: 56,
        justifyContent: 'center',
    },
    input: {
        fontSize: FONTS.sizes.xl,
        color: COLORS.textPrimary,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: FONTS.weights.bold,
    },
    button: {
        height: 56,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.sm,
        ...SHADOWS.button,
    },
    buttonText: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        color: '#FFFFFF',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.md,
    },
    resendText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
    resendLink: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: COLORS.accent,
    },
    logoutButton: {
        marginTop: SPACING.xxxl * 2,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.danger,
    }
});
