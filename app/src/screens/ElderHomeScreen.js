/**
 * Elder Home Screen — Big SOS button + history
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
    FlatList,
    RefreshControl,
    Dimensions,
    Linking,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { triggerSOS, getSOSLogs } from '../services/api';

const { width } = Dimensions.get('window');
const SOS_BUTTON_SIZE = Math.min(width * 0.55, 220);

export default function ElderHomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const isFocused = useIsFocused();
    const [sosActive, setSOSActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Check volunteer selection status on focus
    useFocusEffect(
        useCallback(() => {
            if (!user?.selectedVolunteers || user.selectedVolunteers.length < 2) {
                // Redirection must be to VolunteerSelection screen
                navigation.replace('VolunteerSelection');
            }
        }, [user, navigation])
    );

    useEffect(() => {
        // Only animate if staying on screen
        if (!user?.selectedVolunteers || user.selectedVolunteers.length < 2) return;
        // Entry animation
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

        fetchLogs();

        return () => {
            pulseLoop.stop();
            glowLoop.stop();
        };
    }, []);

    const fetchLogs = async () => {
        try {
            const result = await getSOSLogs(1, 10);
            if (result.ok && result.data.success) {
                setLogs(result.data.data.logs);
            }
        } catch (error) {
            console.log('Error fetching logs:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    }, []);

    const handleSOS = async () => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Confirm
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
                Alert.alert(
                    '✅ SOS Sent!',
                    `Emergency alert sent.\n\nVolunteers notified: ${result.data.data.volunteersNotified}\nLocation shared with emergency contact.`,
                    [{ text: 'OK' }]
                );
                fetchLogs();

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

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderLogItem = ({ item }) => (
        <TouchableOpacity
            style={styles.logItem}
            activeOpacity={0.7}
            onPress={() => {
                if (item.locationLink) {
                    Linking.openURL(item.locationLink);
                }
            }}
        >
            <View style={styles.logDot} />
            <View style={styles.logContent}>
                <Text style={styles.logTime}>{formatTime(item.createdAt)}</Text>
                <Text style={styles.logDetails}>
                    📍 {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                </Text>
                <Text style={styles.logVolunteers}>
                    {item.notifiedVolunteers || 0} volunteers notified
                </Text>
            </View>
            <Text style={styles.logStatus}>
                {item.status === 'resolved' ? '✅' : item.status === 'acknowledged' ? '👁️' : '🔴'}
            </Text>
        </TouchableOpacity>
    );

    const ListHeader = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            {/* Greeting */}
            <View style={styles.greeting}>
                <View style={styles.greetingLeft}>
                    <Text style={styles.greetingHi}>Hello,</Text>
                    <Text style={styles.greetingName} numberOfLines={1}>
                        {user?.name || 'User'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileEmoji}>👤</Text>
                </TouchableOpacity>
            </View>

            {/* SOS Button */}
            <View style={styles.sosContainer}>
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
                            <Text style={styles.sosEmoji}>🚨</Text>
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

            {/* Emergency Contact Info */}
            {user?.emergencyContactNumber && (
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
                        <Text style={styles.callEmoji}>📞</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Emergency Volunteers Info */}
            <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('VolunteerSelection')}
            >
                <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Emergency Volunteers</Text>
                    <Text style={styles.contactName}>
                        {user?.selectedVolunteers?.length || 0} Volunteers Selected
                    </Text>
                    <Text style={styles.contactPhone}>Tap to manage your selections</Text>
                </View>
                <View style={[styles.callButton, { backgroundColor: COLORS.bgInput }]}>
                    <Text style={styles.callEmoji}>🤝</Text>
                </View>
            </TouchableOpacity>

            {/* History Header */}
            <Text style={styles.sectionTitle}>Recent SOS Alerts</Text>
        </Animated.View>
    );

    const ListEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛡️</Text>
            <Text style={styles.emptyText}>No SOS alerts yet</Text>
            <Text style={styles.emptySubtext}>
                Your emergency history will appear here
            </Text>
        </View>
    );

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            <FlatList
                data={logs}
                renderItem={renderLogItem}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={ListEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: {
        paddingHorizontal: SPACING.xxl,
        paddingTop: 60,
        paddingBottom: SPACING.huge,
    },
    // Greeting
    greeting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xxxl,
    },
    greetingLeft: {},
    greetingHi: {
        fontSize: FONTS.sizes.lg,
        color: COLORS.textSecondary,
    },
    greetingName: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textPrimary,
        maxWidth: width * 0.6,
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    profileEmoji: { fontSize: 24 },
    // SOS
    sosContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xxxl,
        paddingVertical: SPACING.xl,
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
    sosEmoji: { fontSize: 40, marginBottom: SPACING.xs },
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
    // Contact Card
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xxxl,
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
    callEmoji: { fontSize: 22 },
    // Section
    sectionTitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
    },
    // Log Items
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    logDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.md,
    },
    logContent: { flex: 1 },
    logTime: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textPrimary,
    },
    logDetails: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    logVolunteers: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    logStatus: { fontSize: 18 },
    // Empty
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.huge,
    },
    emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
    emptyText: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textSecondary,
    },
    emptySubtext: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
});
