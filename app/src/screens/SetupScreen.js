import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sos_emergency_contact';

export default function SetupScreen({ onComplete }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleSave = async () => {
        const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
        if (cleaned.length < 7) {
            Alert.alert(
                'Invalid Number',
                'Please enter a valid phone number with at least 7 digits.'
            );
            return;
        }

        setIsSaving(true);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, cleaned);
            onComplete(cleaned);
        } catch (error) {
            Alert.alert('Error', 'Failed to save contact. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Icon */}
                <Animated.View
                    style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
                >
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>🛡️</Text>
                    </View>
                </Animated.View>

                {/* Title */}
                <Text style={styles.title}>SOS Setup</Text>
                <Text style={styles.subtitle}>
                    Enter the phone number of someone you trust.{'\n'}They'll receive your
                    SOS message when you need help.
                </Text>

                {/* Input */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Emergency Contact Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+1 234 567 8900"
                        placeholderTextColor="#999999"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        autoFocus
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? 'Saving...' : 'Save & Continue'}
                    </Text>
                </TouchableOpacity>

                {/* Footer note */}
                <Text style={styles.footerNote}>
                    Your number is stored locally on your device only.{'\n'}It is never
                    shared with anyone.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6F0',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(211, 47, 47, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1E3A5F',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    inputWrapper: {
        width: '100%',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E3A5F',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 20,
        fontSize: 18,
        color: '#333333',
        borderWidth: 1.5,
        borderColor: '#E0DDD6',
        letterSpacing: 1,
    },
    saveButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#E67E22',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E67E22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    footerNote: {
        marginTop: 32,
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 18,
    },
});
