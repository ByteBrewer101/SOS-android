/**
 * Volunteer Home Screen — SOS alerts list with real-time SSE notifications
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    FlatList,
    RefreshControl,
    Linking,
    Dimensions,
    Vibration,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getVolunteerAlerts } from '../services/api';
import sseService from '../services/sseService';

const { width } = Dimensions.get('window');

export default function VolunteerHomeScreen({ navigation }) {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Real-time notification state
    const [notification, setNotification] = useState(null);
    const [sseConnected, setSseConnected] = useState(false);
    const notifAnim = useRef(new Animated.Value(-120)).current;
    const notifOpacity = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        fetchAlerts(1);
    }, []);

    // ─── SSE Connection ─────────────────────────────────────────────────
    useEffect(() => {
        // Connect to SSE for real-time notifications
        sseService.connect();

        // Listen for connection status
        const unsubConnected = sseService.on('connected', () => {
            setSseConnected(true);
        });

        // Listen for SOS alerts
        const unsubSOS = sseService.on('sos_alert', (data) => {
            console.log('🚨 Real-time SOS received:', data);
            handleIncomingSOS(data);
        });

        return () => {
            unsubConnected();
            unsubSOS();
            sseService.disconnect();
        };
    }, []);

    /**
     * Handle incoming SOS alert from SSE
     */
    const handleIncomingSOS = useCallback((data) => {
        // Vibrate to get attention
        if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 500, 200, 500]);
        }

        // Show notification banner
        setNotification(data);
        showNotificationBanner();

        // Refresh alerts list to include the new one
        fetchAlerts(1);
    }, []);

    /**
     * Animate notification banner in and out
     */
    const showNotificationBanner = () => {
        // Slide in and fade in
        Animated.parallel([
            Animated.spring(notifAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 12,
                bounciness: 8,
            }),
            Animated.timing(notifOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for urgency
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.03,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Auto-dismiss after 15 seconds
        setTimeout(() => {
            dismissNotification();
        }, 15000);
    };

    const dismissNotification = () => {
        Animated.parallel([
            Animated.timing(notifAnim, {
                toValue: -120,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(notifOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setNotification(null);
            pulseAnim.setValue(1);
        });
    };

    const fetchAlerts = async (pageNum = 1) => {
        try {
            const result = await getVolunteerAlerts(pageNum, 20);
            if (result.ok && result.data.success) {
                const { alerts: newAlerts, pagination } = result.data.data;
                if (pageNum === 1) {
                    setAlerts(newAlerts);
                } else {
                    setAlerts((prev) => [...prev, ...newAlerts]);
                }
                setHasMore(pagination.page < pagination.pages);
                setPage(pageNum);
            }
        } catch (error) {
            console.log('Error fetching alerts:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAlerts(1);
        setRefreshing(false);
    }, []);

    const loadMore = () => {
        if (hasMore) {
            fetchAlerts(page + 1);
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        });
    };

    const renderAlertItem = ({ item, index }) => {
        const isRecent = Date.now() - new Date(item.createdAt).getTime() < 3600000; // < 1 hour

        return (
            <Animated.View
                style={[
                    styles.alertCard,
                    isRecent && styles.alertCardUrgent,
                ]}
            >
                {/* Header */}
                <View style={styles.alertHeader}>
                    <View style={[styles.alertBadge, isRecent ? styles.alertBadgeActive : styles.alertBadgePast]}>
                        <Text style={[styles.alertBadgeText, isRecent ? styles.alertBadgeTextActive : styles.alertBadgeTextPast]}>
                            {isRecent ? 'ACTIVE' : 'PAST'}
                        </Text>
                    </View>
                    <Text style={styles.alertTime}>{formatTime(item.createdAt)}</Text>
                </View>

                {/* Elder Info */}
                <View style={styles.alertBody}>
                    <View style={styles.alertInfo}>
                        <Text style={styles.alertName}>{item.elderName}</Text>
                        <Text style={styles.alertPhone}>+91 {item.elderPhone}</Text>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.alertLocation}>
                    <Text style={styles.locationText}>
                        Loc: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.alertActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL(`tel:${item.elderPhone}`)}
                    >
                        <View style={styles.actionGradientCall}>
                            <Text style={styles.actionText}>Call</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (item.locationLink) {
                                Linking.openURL(item.locationLink);
                            }
                        }}
                    >
                        <View style={styles.actionGradientMap}>
                            <Text style={styles.actionText}>Map</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    const ListHeader = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            {/* Greeting */}
            <View style={styles.greeting}>
                <View style={styles.greetingLeft}>
                    <Text style={styles.greetingHi}>Hello,</Text>
                    <Text style={styles.greetingName} numberOfLines={1}>
                        {user?.name || 'Volunteer'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileText}>Edit</Text>
                </TouchableOpacity>
            </View>

            {/* SSE Connection Status */}
            <View style={styles.sseStatusRow}>
                <View style={[styles.sseStatusDot, sseConnected ? styles.sseStatusDotActive : styles.sseStatusDotInactive]} />
                <Text style={styles.sseStatusText}>
                    {sseConnected ? 'Live updates active' : 'Connecting...'}
                </Text>
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <View style={styles.statusItem}>
                        <Text style={styles.statusValue}>
                            {user?.isVerified ? 'Yes' : 'No'}
                        </Text>
                        <Text style={styles.statusLabel}>
                            {user?.isVerified ? 'Verified' : 'Pending'}
                        </Text>
                    </View>
                    <View style={styles.statusDivider} />
                    <View style={styles.statusItem}>
                        <Text style={styles.statusValue}>{alerts.length}</Text>
                        <Text style={styles.statusLabel}>Total Alerts</Text>
                    </View>
                    <View style={styles.statusDivider} />
                    <View style={styles.statusItem}>
                        <Text style={styles.statusValue}>
                            {user?.aadhaarMasked?.slice(-4) || '----'}
                        </Text>
                        <Text style={styles.statusLabel}>Aadhaar</Text>
                    </View>
                </View>
            </View>

            {/* Section Title */}
            <Text style={styles.sectionTitle}>SOS Alerts</Text>
            <Text style={styles.sectionSubtitle}>
                Elders who need your help
            </Text>
        </Animated.View>
    );

    const ListEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alerts yet</Text>
            <Text style={styles.emptySubtext}>
                SOS alerts from elders will appear here
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={alerts}
                renderItem={renderAlertItem}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={ListEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.accent}
                        colors={[COLORS.accent]}
                    />
                }
            />

            {/* ─── Real-time SOS Notification Banner ──────────────────────── */}
            {notification && (
                <Animated.View
                    style={[
                        styles.notificationBanner,
                        {
                            transform: [
                                { translateY: notifAnim },
                                { scale: pulseAnim },
                            ],
                            opacity: notifOpacity,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.notificationContent}
                        activeOpacity={0.9}
                        onPress={() => {
                            dismissNotification();
                            // Scroll to top to see the new alert
                            onRefresh();
                        }}
                    >
                        <View style={styles.notifHeader}>
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>🚨 SOS ALERT</Text>
                            </View>
                            <TouchableOpacity onPress={dismissNotification} style={styles.notifDismiss}>
                                <Text style={styles.notifDismissText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.notifName}>{notification.elderName} needs help!</Text>
                        <Text style={styles.notifPhone}>+91 {notification.elderPhone}</Text>
                        <View style={styles.notifActions}>
                            <TouchableOpacity
                                style={styles.notifCallBtn}
                                onPress={() => {
                                    dismissNotification();
                                    Linking.openURL(`tel:${notification.elderPhone}`);
                                }}
                            >
                                <Text style={styles.notifCallText}>📞 Call Now</Text>
                            </TouchableOpacity>
                            {notification.locationLink && (
                                <TouchableOpacity
                                    style={styles.notifMapBtn}
                                    onPress={() => {
                                        dismissNotification();
                                        Linking.openURL(notification.locationLink);
                                    }}
                                >
                                    <Text style={styles.notifMapText}>📍 Open Map</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
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
        marginBottom: SPACING.md,
    },
    greetingLeft: {},
    greetingHi: {
        fontSize: FONTS.sizes.lg,
        color: COLORS.textSecondary,
    },
    greetingName: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        maxWidth: width * 0.6,
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.navy,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileText: { fontSize: FONTS.sizes.xs, color: '#FFFFFF', fontWeight: FONTS.weights.bold, textTransform: 'uppercase' },
    // SSE Status
    sseStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    sseStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.sm,
    },
    sseStatusDotActive: {
        backgroundColor: '#4CAF50',
    },
    sseStatusDotInactive: {
        backgroundColor: '#FFA726',
    },
    sseStatusText: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
    },
    // Status Card
    statusCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        marginBottom: SPACING.xxl,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusItem: {
        flex: 1,
        alignItems: 'center',
    },
    statusValue: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        marginBottom: SPACING.xs,
    },
    statusLabel: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusDivider: {
        width: 1,
        height: 36,
        backgroundColor: COLORS.border,
    },
    // Section
    sectionTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        marginBottom: SPACING.xs,
    },
    sectionSubtitle: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        marginBottom: SPACING.xl,
    },
    // Alert Card
    alertCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    alertCardUrgent: {
        borderColor: COLORS.danger,
        borderWidth: 1.5,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    alertBadge: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    alertBadgeActive: {
        backgroundColor: 'rgba(211,47,47,0.12)',
    },
    alertBadgePast: {
        backgroundColor: COLORS.bgElevated,
    },
    alertBadgeText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.bold,
    },
    alertBadgeTextActive: {
        color: COLORS.danger,
    },
    alertBadgeTextPast: {
        color: COLORS.textMuted,
    },
    alertTime: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
    },
    alertBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    alertInfo: {},
    alertName: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textPrimary,
    },
    alertPhone: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    alertLocation: {
        backgroundColor: COLORS.bgElevated,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    locationText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textSecondary,
    },
    alertActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    actionButton: {
        flex: 1,
    },
    actionGradientCall: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 46,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
        backgroundColor: COLORS.success,
    },
    actionGradientMap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 46,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
        backgroundColor: COLORS.navy,
    },
    actionText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: '#FFFFFF',
    },
    // Empty
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.huge,
    },
    emptyText: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textSecondary,
    },
    emptySubtext: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
    // ─── Notification Banner ─────────────────────────────────────────
    notificationBanner: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 50,
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 1000,
        elevation: 20,
    },
    notificationContent: {
        backgroundColor: '#1A1A2E',
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 2,
        borderColor: '#D32F2F',
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 20,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    notifBadge: {
        backgroundColor: '#D32F2F',
        borderRadius: RADIUS.full,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    notifBadgeText: {
        color: '#FFFFFF',
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.bold,
        letterSpacing: 1,
    },
    notifDismiss: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifDismissText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: FONTS.weights.bold,
    },
    notifName: {
        color: '#FFFFFF',
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        marginBottom: 2,
    },
    notifPhone: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: FONTS.sizes.sm,
        marginBottom: SPACING.md,
    },
    notifActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    notifCallBtn: {
        flex: 1,
        backgroundColor: '#4CAF50',
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    notifCallText: {
        color: '#FFFFFF',
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.bold,
    },
    notifMapBtn: {
        flex: 1,
        backgroundColor: '#1565C0',
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    notifMapText: {
        color: '#FFFFFF',
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.bold,
    },
});
