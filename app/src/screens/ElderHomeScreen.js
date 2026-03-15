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
    Alert,
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
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { triggerSOS } from '../services/api';

const { width } = Dimensions.get('window');
const SOS_BUTTON_SIZE = Math.min(width * 0.55, 220);

export default function ElderHomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [sosActive, setSOSActive] = useState(false);
    const [loading, setLoading] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current; // optional, could be used for entrance

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

        return () => {
            pulseLoop.stop();
            glowLoop.stop();
        };
    }, []);

    const handleSOS = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        Alert.alert(
            '🚨 TRIGGER SOS?',
            'This will send an emergency alert with your location to your emergency contact and all volunteers.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'YES, SEND SOS',
                    style: 'destructive',
                    onPress: executeSOS,
                },
            ]
        );
    };

    const executeSOS = async () => {
        setLoading(true);
        setSOSActive(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        try {
            // Get location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Location Required',
                    'Please enable location services to send your GPS coordinates in the SOS alert.',
                    [{ text: 'OK' }]
                );
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

                // Trigger native SMS
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

                Alert.alert(
                    '✅ SOS Sent!',
                    `Emergency alert sent.\n\nVolunteers notified: ${result.data.data.volunteersNotified}\nLocation shared with emergency contact.`,
                    [{ text: 'OK' }]
                );

                // Prompt to call emergency contact
                if (user?.emergencyContactNumber) {
                    setTimeout(() => {
                        Alert.alert(
                            '📞 Call Emergency Contact?',
                            `Would you like to call ${user.emergencyContactName || 'your emergency contact'}?`,
                            [
                                { text: 'No', style: 'cancel' },
                                {
                                    text: 'Call Now',
                                    onPress: () => Linking.openURL(`tel:${user.emergencyContactNumber}`),
                                },
                            ]
                        );
                    }, 1500);
                }
            } else {
                Alert.alert('SOS Failed', result.data.message || 'Could not send SOS. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send SOS. Please try again.');
        } finally {
            setLoading(false);
            setSOSActive(false);
        }
    };

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Top Menu */}
                    <View style={styles.topMenu}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('VolunteerSelection')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="people-outline" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="person-outline" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Centered SOS Button */}
                    <View style={styles.center}>
                        <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleSOS}
                                disabled={loading}
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
                                        {loading ? 'Please wait' : 'Tap for emergency'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

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
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'space-between', // pushes bottom to bottom, but center needs to be centered
        // We'll use a combination: center is flex:1 to take remaining space
    },
    topMenu: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: SPACING.xxl,
        paddingTop: Platform.OS === 'android' ? 40 : SPACING.md, // Add padding for Android SafeAreaView
        gap: SPACING.md,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.bgCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // marginVertical optional
    },
    glowRing: {
        position: 'absolute',
        width: SOS_BUTTON_SIZE + 60,
        height: SOS_BUTTON_SIZE + 60,
        borderRadius: (SOS_BUTTON_SIZE + 60) / 2,
        backgroundColor: COLORS.primary,
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
        color: COLORS.textPrimary,
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
});