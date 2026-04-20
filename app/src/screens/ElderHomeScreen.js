/**
 * Elder Home Screen — Big SOS button + emergency contact at bottom
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Linking,
    SafeAreaView,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as SMS from 'expo-sms';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { triggerSOS } from '../services/api';

const { width } = Dimensions.get('window');
const SOS_BUTTON_SIZE = Math.min(width * 0.55, 220);

export default function ElderHomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [sosActive, setSOSActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAlarmActive, setIsAlarmActive] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current; // optional, could be used for entrance
    const soundRef = useRef(null);

    // Check volunteer selection status on focus
    useFocusEffect(
        useCallback(() => {
            if (!user?.selectedVolunteers || user.selectedVolunteers.length < 2) {
                navigation.replace('VolunteerSelection');
            }
        }, [user, navigation])
    );

    useEffect(() => {
        // Only animate if staying on screen
        if (!user?.selectedVolunteers || user.selectedVolunteers.length < 2) return;

        // Entry animation (optional)
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Pulse animation loop
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseLoop.start();

        // Glow animation loop
        const glowLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.8,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        glowLoop.start();

        // Pre-load sound
        const loadSound = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    staysActiveInBackground: true,
                    playThroughEarpieceAndroid: false,
                });

                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/ringtone.mp3'),
                    { shouldPlay: false, isLooping: true }
                );
                soundRef.current = sound;
            } catch (error) {
                console.log('Error loading sound:', error);
            }
        };
        loadSound();

        return () => {
            pulseLoop.stop();
            glowLoop.stop();
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const playSound = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.playAsync();
            } else {
                // Fallback if not loaded yet
                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/ringtone.mp3'),
                    { shouldPlay: true, isLooping: true }
                );
                soundRef.current = sound;
            }
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    };

    const stopSound = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
            }
            setIsAlarmActive(false);
        } catch (error) {
            console.log('Error stopping sound:', error);
        }
    };

    const handleSOS = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (loading || isAlarmActive) return;
        setIsAlarmActive(true);
        playSound();
        executeSOS();
    };

    const executeSOS = async () => {
        setLoading(true);
        setSOSActive(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        try {
            // Get location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                setLoading(false);
                setSOSActive(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;

            // Send SOS
            const result = await triggerSOS(latitude, longitude);

            if (result.ok && result.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Trigger native SMS silently
                if (user?.emergencyContactNumber) {
                    try {
                        const isAvailable = await SMS.isAvailableAsync();
                        if (isAvailable) {
                            const message = `EMERGENCY SOS! I need help immediately! My location: https://maps.google.com/?q=${latitude},${longitude}`;
                            await SMS.sendSMSAsync([user.emergencyContactNumber], message);
                        }
                    } catch (err) {
                        console.log('SMS trigger error:', err);
                    }
                }
            } else {
                console.log('SOS failed:', result.data.message);
            }
        } catch (error) {
            console.log('SOS error:', error);
        } finally {
            setLoading(false);
            setSOSActive(false);
            // Alarm continues until manually silenced
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Top Menu */}
                    <View style={styles.topMenu}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('VolunteerSelection')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="people-outline" size={24} color={COLORS.textOnDark} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="person-outline" size={24} color={COLORS.textOnDark} />
                        </TouchableOpacity>
                    </View>

                    {/* Centered SOS Button */}
                    <View style={styles.center}>
                        <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleSOS}
                            >
                                <LinearGradient
                                    colors={sosActive ? ['#9B2C2C', '#742A2A'] : COLORS.gradientSOS}
                                    style={styles.sosButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.sosText}>
                                        {loading ? 'SENDING...' : 'SOS'}
                                    </Text>
                                    <Text style={styles.sosSubtext}>
                                        {loading ? 'SOS SENDING...' : 'Tap for emergency'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Silence Alarm Button Section */}
                    {isAlarmActive && (
                        <View style={styles.alarmControl}>
                            <TouchableOpacity
                                style={styles.silenceButton}
                                onPress={stopSound}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="volume-mute" size={24} color="#FFFFFF" />
                                <Text style={styles.silenceText}>STOP EMERGENCY ALARM</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Emergency Contact Info at Bottom */}
                    {user?.emergencyContactNumber && (
                        <View style={styles.bottom}>
                            <TouchableOpacity
                                style={styles.contactCard}
                                activeOpacity={0.7}
                                onPress={() => Linking.openURL(`tel:${user.emergencyContactNumber}`)}
                            >
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>Emergency Contact</Text>
                                    <Text style={styles.contactName}>{user.emergencyContactName}</Text>
                                    <Text style={styles.contactPhone}>+91 {user.emergencyContactNumber}</Text>
                                </View>
                                <View style={styles.callButton}>
                                    <Text style={styles.callText}>Call</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    safeArea: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topMenu: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: SPACING.xxl,
        paddingTop: Platform.OS === 'android' ? 40 : SPACING.md,
        gap: SPACING.md,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.navy,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.card,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowRing: {
        position: 'absolute',
        width: SOS_BUTTON_SIZE + 60,
        height: SOS_BUTTON_SIZE + 60,
        borderRadius: (SOS_BUTTON_SIZE + 60) / 2,
        backgroundColor: COLORS.sos,
    },
    sosButton: {
        width: SOS_BUTTON_SIZE,
        height: SOS_BUTTON_SIZE,
        borderRadius: SOS_BUTTON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.glow,
    },
    sosText: {
        fontSize: FONTS.sizes.hero,
        fontWeight: FONTS.weights.extrabold,
        color: '#FFFFFF',
        letterSpacing: 4,
    },
    sosSubtext: {
        fontSize: FONTS.sizes.sm,
        color: 'rgba(255,255,255,0.7)',
        marginTop: SPACING.xs,
    },
    bottom: {
        paddingHorizontal: SPACING.xxl,
        paddingBottom: SPACING.xxl,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    contactInfo: { flex: 1 },
    contactLabel: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    contactName: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textPrimary,
    },
    contactPhone: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    callButton: {
        width: 50,
        height: 50,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callText: { fontSize: FONTS.sizes.xs, color: '#FFFFFF', fontWeight: FONTS.weights.bold },
    alarmControl: {
        paddingHorizontal: SPACING.xxl,
        marginBottom: SPACING.lg,
    },
    silenceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.navy, // Different color than SOS
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.lg,
        gap: SPACING.md,
        ...SHADOWS.card,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    silenceText: {
        fontSize: FONTS.sizes.md,
        color: '#FFFFFF',
        fontWeight: FONTS.weights.bold,
        letterSpacing: 1.5,
    },
});