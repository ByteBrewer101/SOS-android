/**
 * Volunteer Home Screen — SOS alerts list
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getVolunteerAlerts } from '../services/api';

const { width } = Dimensions.get('window');

export default function VolunteerHomeScreen({ navigation }) {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        fetchAlerts(1);
    }, []);

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
                    <View style={styles.alertBadge}>
                        <Text style={styles.alertBadgeText}>
                            {isRecent ? '🔴 ACTIVE' : '⏱️ PAST'}
                        </Text>
                    </View>
                    <Text style={styles.alertTime}>{formatTime(item.createdAt)}</Text>
                </View>

                {/* Elder Info */}
                <View style={styles.alertBody}>
                    <Text style={styles.alertEmoji}>🚨</Text>
                    <View style={styles.alertInfo}>
                        <Text style={styles.alertName}>{item.elderName}</Text>
                        <Text style={styles.alertPhone}>+91 {item.elderPhone}</Text>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.alertLocation}>
                    <Text style={styles.locationText}>
                        📍 {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.alertActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL(`tel:${item.elderPhone}`)}
                    >
                        <LinearGradient
                            colors={[COLORS.success, '#38A169']}
                            style={styles.actionGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.actionEmoji}>📞</Text>
                            <Text style={styles.actionText}>Call</Text>
                        </LinearGradient>
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
                        <LinearGradient
                            colors={[COLORS.info, '#4299E1']}
                            style={styles.actionGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.actionEmoji}>🗺️</Text>
                            <Text style={styles.actionText}>Map</Text>
                        </LinearGradient>
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
                    <Text style={styles.profileEmoji}>👤</Text>
                </TouchableOpacity>
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <View style={styles.statusItem}>
                        <Text style={styles.statusValue}>
                            {user?.isVerified ? '✅' : '⏳'}
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
            <Text style={styles.emptyEmoji}>🛡️</Text>
            <Text style={styles.emptyText}>No alerts yet</Text>
            <Text style={styles.emptySubtext}>
                SOS alerts from elders will appear here
            </Text>
        </View>
    );

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
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
        marginBottom: SPACING.xxl,
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
        color: COLORS.textPrimary,
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
        color: COLORS.textPrimary,
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
        borderColor: COLORS.primary,
        borderWidth: 1.5,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    alertBadge: {
        backgroundColor: 'rgba(229,62,62,0.15)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    alertBadgeText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.bold,
        color: COLORS.primary,
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
    alertEmoji: { fontSize: 32, marginRight: SPACING.md },
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
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 46,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
    },
    actionEmoji: { fontSize: 18 },
    actionText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textPrimary,
    },
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
        textAlign: 'center',
    },
});
