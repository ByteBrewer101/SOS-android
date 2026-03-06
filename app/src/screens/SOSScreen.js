import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
    Dimensions,
    Easing,
    Platform,
} from 'react-native';
import * as SMS from 'expo-sms';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sos_emergency_contact';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SOS_MESSAGE = `🆘 SOS — I need help right now.

I'm reaching out because I'm going through a really difficult time mentally and I need support. Please check on me as soon as possible.

This is an automated SOS sent from my mental health safety app.`;

export default function SOSScreen({ contactNumber, onReset }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseRing1 = useRef(new Animated.Value(0)).current;
    const pulseRing2 = useRef(new Animated.Value(0)).current;
    const pulseRing3 = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;
    const [isSending, setIsSending] = useState(false);
    const [lastSent, setLastSent] = useState(null);

    // Pulsing rings animation
    useEffect(() => {
        const createPulse = (anim, delay) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2500,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        createPulse(pulseRing1, 0).start();
        createPulse(pulseRing2, 800).start();
        createPulse(pulseRing3, 1600).start();

        // Glow animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.7,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 8,
        }).start();
    };

    const handleSOS = async () => {
        if (isSending) return;

        // Haptic feedback
        if (Platform.OS !== 'web') {
            try {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (e) { }
        }

        setIsSending(true);

        try {
            const isAvailable = await SMS.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert(
                    'SMS Not Available',
                    'SMS is not available on this device. Please make sure you have a messaging app installed.',
                    [{ text: 'OK' }]
                );
                setIsSending(false);
                return;
            }

            const { result } = await SMS.sendSMSAsync(
                [contactNumber],
                SOS_MESSAGE
            );

            if (result === 'sent' || result === 'unknown') {
                setLastSent(new Date());
                if (Platform.OS !== 'web') {
                    try {
                        await Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success
                        );
                    } catch (e) { }
                }
            }
        } catch (error) {
            Alert.alert(
                'Error',
                'Failed to open SMS. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSending(false);
        }
    };

    const handleChangeContact = () => {
        Alert.alert(
            'Change Contact',
            'Do you want to change your emergency contact number?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Change',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem(STORAGE_KEY);
                        onReset();
                    },
                },
            ]
        );
    };

    const renderPulseRing = (anim, size) => {
        const ringScale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.8],
        });
        const ringOpacity = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0],
        });
        return (
            <Animated.View
                style={[
                    styles.pulseRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                    },
                ]}
            />
        );
    };

    const maskedNumber = contactNumber
        ? contactNumber.slice(0, -4).replace(/./g, '•') + contactNumber.slice(-4)
        : '';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.appTitle}>SOS</Text>
                <Text style={styles.appSubtitle}>Mental Health Emergency</Text>
            </View>

            {/* SOS Button Area */}
            <View style={styles.buttonArea}>
                {/* Pulse rings */}
                {renderPulseRing(pulseRing1, 220)}
                {renderPulseRing(pulseRing2, 220)}
                {renderPulseRing(pulseRing3, 220)}

                {/* Glow */}
                <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

                {/* Main SOS button */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                        style={styles.sosButton}
                        onPress={handleSOS}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={1}
                        disabled={isSending}
                    >
                        <Text style={styles.sosText}>SOS</Text>
                        <Text style={styles.sosSubText}>
                            {isSending ? 'SENDING...' : 'TAP FOR HELP'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                {lastSent && (
                    <Text style={styles.lastSentText}>
                        Last sent: {lastSent.toLocaleTimeString()}
                    </Text>
                )}

                <Text style={styles.contactText}>
                    Emergency contact: {maskedNumber}
                </Text>

                <TouchableOpacity
                    style={styles.changeButton}
                    onPress={handleChangeContact}
                    activeOpacity={0.7}
                >
                    <Text style={styles.changeButtonText}>Change Contact</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    You are not alone. Help is always available.
                </Text>
            </View>
        </View>
    );
}

const BUTTON_SIZE = 200;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0F',
    },
    header: {
        paddingTop: 70,
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#DC2626',
        letterSpacing: 6,
    },
    appSubtitle: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    buttonArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseRing: {
        position: 'absolute',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#DC2626',
    },
    glow: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#DC2626',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 60,
        elevation: 20,
    },
    sosButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 16,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    sosText: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 8,
    },
    sosSubText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
        letterSpacing: 2,
    },
    footer: {
        paddingBottom: 50,
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    lastSentText: {
        fontSize: 13,
        color: '#4ADE80',
        marginBottom: 12,
        fontWeight: '600',
    },
    contactText: {
        fontSize: 13,
        color: '#555',
        marginBottom: 12,
    },
    changeButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2A2A3A',
        marginBottom: 20,
    },
    changeButtonText: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    disclaimer: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
