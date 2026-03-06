/**
 * Elder Registration Screen
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
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { registerElder } from '../services/api';

export default function RegisterElderScreen({ navigation }) {
    const { login } = useAuth();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
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
        // Validate
        if (!name.trim() || !phone.trim() || !password.trim() || !emergencyContactName.trim() || !emergencyContactNumber.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }
        if (!/^[6-9]\d{9}$/.test(phone.trim())) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian phone number.');
            return;
        }
        if (!/^[6-9]\d{9}$/.test(emergencyContactNumber.trim())) {
            Alert.alert('Invalid Emergency Number', 'Please enter a valid 10-digit Indian phone number for emergency contact.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const result = await registerElder({
                name: name.trim(),
                phone: phone.trim(),
                password,
                emergencyContactName: emergencyContactName.trim(),
                emergencyContactNumber: emergencyContactNumber.trim(),
            });

            if (result.ok && result.data.success) {
                const { user, token } = result.data.data;
                await login(user, token, 'elder');
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
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
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
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.emoji}>👴</Text>
                            <Text style={styles.title}>Elder Registration</Text>
                            <Text style={styles.subtitle}>Create your account</Text>
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
                                label="Password"
                                placeholder="Min 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>Emergency Contact</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <InputField
                                label="Contact Name"
                                placeholder="Emergency contact name"
                                value={emergencyContactName}
                                onChangeText={setEmergencyContactName}
                                autoCapitalize="words"
                            />
                            <InputField
                                label="Contact Number"
                                placeholder="Emergency contact number"
                                value={emergencyContactNumber}
                                onChangeText={setEmergencyContactNumber}
                                keyboardType="phone-pad"
                                maxLength={10}
                                prefix="+91"
                            />

                            {/* Register Button */}
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleRegister}
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
                                        <Text style={styles.buttonText}>Create Account</Text>
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
        </LinearGradient>
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
    container: { flex: 1 },
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
        marginTop: SPACING.xl,
    },
    emoji: { fontSize: 48, marginBottom: SPACING.sm },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textPrimary,
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
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginVertical: SPACING.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.medium,
        color: COLORS.textMuted,
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
        color: COLORS.textPrimary,
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
});
