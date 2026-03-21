/**
 * Profile Screen — view/edit profile, logout
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
    getElderProfile,
    updateElderProfile,
    getVolunteerProfile,
} from '../services/api';

export default function ProfileScreen({ navigation }) {
    const { user, role, logout, updateUser } = useAuth();

    const isElder = role === 'elder';

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable fields (elder only)
    const [name, setName] = useState(user?.name || '');
    const [emergencyContactName, setEmergencyContactName] = useState(
        user?.emergencyContactName || ''
    );
    const [emergencyContactNumber, setEmergencyContactNumber] = useState(
        user?.emergencyContactNumber || ''
    );

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
        refreshProfile();
    }, []);

    const refreshProfile = async () => {
        try {
            const result = isElder
                ? await getElderProfile()
                : await getVolunteerProfile();

            if (result.ok && result.data.success) {
                const userData = result.data.data.user;
                updateUser(userData);
                setName(userData.name || '');
                setEmergencyContactName(userData.emergencyContactName || '');
                setEmergencyContactNumber(userData.emergencyContactNumber || '');
            }
        } catch (error) {
            console.log('Error fetching profile:', error);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Name', 'Name cannot be empty.');
            return;
        }
        if (
            emergencyContactNumber.trim() &&
            !/^[6-9]\d{9}$/.test(emergencyContactNumber.trim())
        ) {
            Alert.alert(
                'Invalid Number',
                'Please enter a valid 10-digit Indian phone number.'
            );
            return;
        }

        setSaving(true);
        try {
            const body = {};
            if (name.trim() !== user?.name) body.name = name.trim();
            if (emergencyContactName.trim() !== user?.emergencyContactName)
                body.emergencyContactName = emergencyContactName.trim();
            if (emergencyContactNumber.trim() !== user?.emergencyContactNumber)
                body.emergencyContactNumber = emergencyContactNumber.trim();

            if (Object.keys(body).length === 0) {
                setEditing(false);
                return;
            }

            const result = await updateElderProfile(body);
            if (result.ok && result.data.success) {
                updateUser(result.data.data.user);
                setEditing(false);
                Alert.alert('✅ Saved', 'Profile updated successfully.');
            } else {
                Alert.alert('Error', result.data.message || 'Could not update profile.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: logout,
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={isElder ? COLORS.gradientSOS : COLORS.gradientAccent}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>
                                {isElder ? 'EL' : 'VO'}
                            </Text>
                        </LinearGradient>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {isElder ? 'ELDER' : 'VOLUNTEER'}
                            </Text>
                        </View>
                    </View>

                    {/* Profile Fields */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Profile Information</Text>

                        {/* Name */}
                        <ProfileField
                            label="Full Name"
                            value={name}
                            editable={editing && isElder}
                            onChangeText={setName}
                        />

                        {/* Phone (read-only) */}
                        <ProfileField
                            label="Phone Number"
                            value={`+91 ${user?.phone || ''}`}
                            editable={false}
                        />

                        {/* Elder-specific fields */}
                        {isElder && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>Emergency Contact</Text>

                                <ProfileField
                                    label="Contact Name"
                                    value={emergencyContactName}
                                    editable={editing}
                                    onChangeText={setEmergencyContactName}
                                />
                                <ProfileField
                                    label="Contact Number"
                                    value={emergencyContactNumber}
                                    editable={editing}
                                    onChangeText={setEmergencyContactNumber}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </>
                        )}

                        {/* Volunteer-specific fields */}
                        {!isElder && (
                            <>
                                <ProfileField
                                    label="Aadhaar (Masked)"
                                    value={user?.aadhaarMasked || 'XXXX-XXXX-XXXX'}
                                    editable={false}
                                />
                                <ProfileField
                                    label="Verification Status"
                                    value={user?.isVerified ? 'Verified' : 'Pending'}
                                    editable={false}
                                />
                                <ProfileField
                                    label="Aadhaar Verified"
                                    value={user?.aadhaarVerified ? 'Yes' : 'No'}
                                    editable={false}
                                />
                            </>
                        )}
                    </View>

                    {/* Edit / Save Button (Elder only) */}
                    {isElder && (
                        <View style={styles.actionContainer}>
                            {editing ? (
                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => {
                                            setEditing(false);
                                            setName(user?.name || '');
                                            setEmergencyContactName(user?.emergencyContactName || '');
                                            setEmergencyContactNumber(
                                                user?.emergencyContactNumber || ''
                                            );
                                        }}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={handleSave}
                                        disabled={saving}
                                        style={{ flex: 1 }}
                                    >
                                        <LinearGradient
                                            colors={COLORS.gradientAccent}
                                            style={styles.saveButton}
                                        >
                                            {saving ? (
                                                <ActivityIndicator color="#FFFFFF" size="small" />
                                            ) : (
                                                <Text style={styles.saveText}>Save Changes</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => setEditing(true)}
                                >
                                    <LinearGradient
                                        colors={COLORS.gradientAccent}
                                        style={styles.editButton}
                                    >
                                        <Text style={styles.editText}>Edit Profile</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                    {/* App Info */}
                    <View style={styles.appInfo}>
                        <Text style={styles.appInfoText}>SOS Emergency Alert v1.0</Text>
                        <Text style={styles.appInfoText}>
                            Helping elders stay safe
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

function ProfileField({
    label,
    value,
    editable,
    onChangeText,
    keyboardType,
    maxLength,
}) {
    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {editable ? (
                <TextInput
                    style={[styles.fieldValue, styles.fieldEditable]}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    placeholderTextColor={COLORS.textMuted}
                />
            ) : (
                <Text style={styles.fieldValue}>{value}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scrollContent: {
        paddingHorizontal: SPACING.xxl,
        paddingTop: 60,
        paddingBottom: SPACING.huge,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    backText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
    // Avatar
    avatarContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xxxl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        ...SHADOWS.card,
    },
    avatarText: { fontSize: 32, fontWeight: FONTS.weights.bold, color: '#FFFFFF' },
    userName: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        marginBottom: SPACING.sm,
    },
    roleBadge: {
        backgroundColor: COLORS.navy,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    roleText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.bold,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    // Section
    section: {
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    sectionTitle: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: COLORS.navy,
        marginBottom: SPACING.lg,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.xl,
    },
    // Fields
    fieldContainer: {
        marginBottom: SPACING.lg,
    },
    fieldLabel: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldValue: {
        fontSize: FONTS.sizes.lg,
        color: COLORS.textPrimary,
        fontWeight: FONTS.weights.medium,
    },
    fieldEditable: {
        backgroundColor: COLORS.bgElevated,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        padding: SPACING.md,
        height: 48,
    },
    // Actions
    actionContainer: {
        marginTop: SPACING.xxl,
    },
    editButton: {
        borderRadius: RADIUS.md,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
    },
    editText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
        color: '#FFFFFF',
    },
    editActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    cancelButton: {
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.md,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xxl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelText: {
        fontSize: FONTS.sizes.md,
        color: COLORS.textSecondary,
    },
    saveButton: {
        height: 52,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
    },
    saveText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        color: '#FFFFFF',
    },
    // Logout
    logoutButton: {
        marginTop: SPACING.xxl,
        backgroundColor: 'rgba(211,47,47,0.1)',
        borderRadius: RADIUS.md,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(211,47,47,0.3)',
    },
    logoutText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.danger,
    },
    // App Info
    appInfo: {
        alignItems: 'center',
        marginTop: SPACING.xxxl,
        gap: SPACING.xs,
    },
    appInfoText: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textMuted,
    },
});
