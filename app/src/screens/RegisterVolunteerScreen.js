/**
 * Volunteer Registration Screen
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
import { registerVolunteer } from '../services/api';

export default function RegisterVolunteerScreen({ navigation }) {
    const { login } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !aadhaarNumber.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (!/^[6-9]\d{9}$/.test(phone.trim())) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian phone number.');
            return;
        }
        if (!/^\d{12}$/.test(aadhaarNumber.trim())) {
            Alert.alert('Invalid Aadhaar', 'Aadhaar number must be exactly 12 digits.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const result = await registerVolunteer({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                aadhaarNumber: aadhaarNumber.trim(),
            });

            if (result.ok && result.data.success) {
                const { user, token } = result.data.data;
                await login(user, token, 'volunteer');
            } else {
                Alert.alert('Registration Failed', result.data.message || 'Could not register.');
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
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Volunteer Registration</Text>
                            <Text style={styles.subtitle}>Join our network of helpers</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <InputField
                                label="Full Name"
                                placeholder="Enter your name"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                            <InputField
                                label="Phone Number"
                                placeholder="Enter phone number"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                maxLength={10}
                                prefix="+91"
                            />
                            <InputField
                                label="Email Address"
                                placeholder="Enter email address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <InputField
                                label="Password"
                                placeholder="Min 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                            <InputField
                                label="Aadhaar Number"
                                placeholder="Enter 12-digit Aadhaar"
                                value={aadhaarNumber}
                                onChangeText={setAadhaarNumber}
                                keyboardType="number-pad"
                                maxLength={12}
                            />

                            {/* Security Notice */}
                            <View style={styles.notice}>
                                <Text style={styles.noticeText}>
                                    🔒 Your Aadhaar is encrypted and only the last 4 digits are stored visibly.
                                </Text>
                            </View>

                            {/* Register Button */}
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={COLORS.gradientAccent}
                                    style={styles.button}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>
                                            Create Account
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

function InputField({
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType,
    maxLength,
    prefix,
    secureTextEntry,
    autoCapitalize,
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                {prefix && <Text style={styles.prefix}>{prefix}</Text>}
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={autoCapitalize || 'none'}
                    value={value}
                    onChangeText={onChangeText}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.xxxl,
    },
    content: {},
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
        marginTop: SPACING.md,
    },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
    },
    subtitle: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    form: {
        gap: SPACING.lg,
    },
    inputGroup: {
        gap: SPACING.xs,
    },
    label: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textSecondary,
        marginLeft: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgInput,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.lg,
        height: 52,
    },
    prefix: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textSecondary,
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: FONTS.sizes.md,
        color: COLORS.textPrimary,
        height: '100%',
    },
    notice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.bgElevated,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    noticeText: {
        flex: 1,
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
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
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.xxl,
        marginBottom: SPACING.xl,
    },
    loginText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
    loginLink: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: COLORS.accent,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    backText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
});
