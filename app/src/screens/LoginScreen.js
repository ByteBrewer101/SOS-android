/**
 * Login Screen
 * Phone + password login for both Elder and Volunteer
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
import { useAuth } from '../context/AuthContext';
import { loginElder, loginVolunteer } from '../services/api';

export default function LoginScreen({ navigation, route }) {
    const { role } = route.params;
    const { login } = useAuth();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const isElder = role === 'elder';

    const handleLogin = async () => {
        if (!phone.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter your phone number and password.');
            return;
        }

        if (!/^[6-9]\d{9}$/.test(phone.trim())) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian phone number.');
            return;
        }

        setLoading(true);
        try {
            const loginFn = isElder ? loginElder : loginVolunteer;
            const result = await loginFn(phone.trim(), password);

            if (result.ok && result.data.success) {
                const { user, token } = result.data.data;
                await login(user, token, role);
            } else {
                Alert.alert('Login Failed', result.data.message || 'Invalid credentials.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                        {/* Back Button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {isElder ? 'Elder Login' : 'Volunteer Login'}
                            </Text>
                            <Text style={styles.subtitle}>
                                Enter your credentials to continue
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.prefix}>+91</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter phone number"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        value={phone}
                                        onChangeText={setPhone}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Enter password"
                                        placeholderTextColor={COLORS.textMuted}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeButton}
                                    >
                                        <Text style={styles.eyeText}>
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot Password link */}
                            <TouchableOpacity
                                style={styles.forgotContainer}
                                onPress={() => navigation.navigate('ForgotPassword', { role })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={isElder ? COLORS.gradientSOS : COLORS.gradientAccent}
                                    style={styles.button}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>
                                            Login
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Don't have an account? </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate(
                                        isElder ? 'RegisterElder' : 'RegisterVolunteer',
                                        { role }
                                    )
                                }
                            >
                                <Text style={styles.registerLink}>Register</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.huge,
    },
    content: {},
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxxl,
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgInput,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.lg,
        height: 56,
    },
    prefix: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textSecondary,
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: FONTS.sizes.lg,
        color: COLORS.textPrimary,
        height: '100%',
    },
    eyeButton: {
        padding: SPACING.sm,
    },
    eyeText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.accent,
        fontWeight: FONTS.weights.medium,
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
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.xxl,
    },
    registerText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
    registerLink: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: COLORS.accent,
    },
    forgotContainer: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.accent,
        fontWeight: FONTS.weights.semibold,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    backButtonText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
});
