/**
 * Volunteer Selection Screen
 * Screen for Elders to pick at least 1 volunteer to be notified during an SOS.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getAvailableVolunteers, selectVolunteers } from '../services/api';

export default function VolunteerSelectionScreen({ navigation }) {
    const { user, updateUser, logout } = useAuth();
    const [volunteers, setVolunteers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        if (user?.selectedVolunteers && Array.isArray(user.selectedVolunteers)) {
            const ids = user.selectedVolunteers.map(v => typeof v === 'string' ? v : v._id);
            setSelectedIds(ids);
        }

        fetchVolunteers();
    }, [user]);

    const fetchVolunteers = async () => {
        try {
            const result = await getAvailableVolunteers();
            if (result.ok && result.data.success) {
                setVolunteers(result.data.data.volunteers || []);
            } else {
                Alert.alert('Error', 'Failed to fetch volunteers.');
            }
        } catch (error) {
            console.log('Error fetching available volunteers:', error);
            Alert.alert('Network Error', 'Could not load volunteers.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(val => val !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSave = async () => {
        if (selectedIds.length < 1) {
            Alert.alert('Selection Required', 'Please select at least 1 volunteer to receive your SOS alerts.');
            return;
        }

        setSaving(true);
        try {
            const result = await selectVolunteers(selectedIds);
            if (result.ok && result.data.success) {
                updateUser(result.data.data.user);
                Alert.alert('Success', 'Your emergency volunteers have been saved.', [
                    { text: 'OK', onPress: () => navigation.replace('ElderHome') }
                ]);
            } else {
                Alert.alert('Error', result.data.message || 'Could not save your selection.');
            }
        } catch (error) {
            console.log('Error saving selection:', error);
            Alert.alert('Error', 'Something went wrong while saving your selection.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => await logout(),
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isSelected = selectedIds.includes(item._id);

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleSelection(item._id)}
                style={[styles.volunteerCard, isSelected && styles.selectedCard]}
            >
                <View style={styles.cardLeft}>
                    <View style={styles.volunteerInfo}>
                        <Text style={styles.volunteerName}>{item.name}</Text>
                    </View>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View style={styles.header}>
            {user?.selectedVolunteers && user.selectedVolunteers.length >= 1 && (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.title}>Select Volunteers</Text>
            <Text style={styles.subtitle}>
                Choose at least 1 volunteer who will be notified when you trigger an SOS.
            </Text>
            <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                    Selected: {selectedIds.length}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
                <FlatList
                    data={volunteers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No verified volunteers available yet.</Text>
                        </View>
                    }
                />

                <View style={styles.footer}>
                    {/* Save button */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleSave}
                        disabled={saving || selectedIds.length < 1}
                    >
                        <LinearGradient
                            colors={selectedIds.length >= 1 ? COLORS.gradientAccent : [COLORS.bgElevated, COLORS.bgElevated]}
                            style={styles.saveButton}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={[styles.saveButtonText, selectedIds.length < 1 && { color: COLORS.textMuted }]}>
                                    {selectedIds.length < 1 ? 'Select at least 1' : 'Save Selection'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Logout button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={20} color={COLORS.error || '#E74C3C'} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: SPACING.xxl,
        paddingTop: 60,
        paddingBottom: 160, // space for footer with two buttons
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxxl,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    backText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
    counterBadge: {
        backgroundColor: COLORS.navy,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    counterText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.bold,
        color: '#FFFFFF',
    },
    volunteerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    selectedCard: {
        borderColor: COLORS.accent,
        backgroundColor: 'rgba(230, 126, 34, 0.08)',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    volunteerInfo: {},
    volunteerName: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textPrimary,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    checkmark: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: SPACING.xxl,
    },
    emptyText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textMuted,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.xl,
        backgroundColor: COLORS.bg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveButton: {
        height: 56,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
    },
    saveButtonText: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        color: '#FFFFFF',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        marginTop: SPACING.sm,
    },
    logoutText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.error || '#E74C3C',
        fontWeight: FONTS.weights.medium,
    },
});