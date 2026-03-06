/**
 * Role Selection Screen
 * First screen — pick Elder or Volunteer
 */
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

export default function RoleSelectScreen({ navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleElder = useRef(new Animated.Value(0.9)).current;
    const scaleVolunteer = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleElder, {
                toValue: 1,
                friction: 8,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleVolunteer, {
                toValue: 1,
                friction: 8,
                delay: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePress = (role) => {
        navigation.navigate('Login', { role });
    };

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <Text style={styles.emoji}>🚨</Text>
                <Text style={styles.title}>SOS Emergency</Text>
                <Text style={styles.subtitle}>Choose your role to get started</Text>
            </Animated.View>

            {/* Role Cards */}
            <View style={styles.cardsContainer}>
                {/* Elder Card */}
                <Animated.View style={{ transform: [{ scale: scaleElder }] }}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handlePress('elder')}
                    >
                        <LinearGradient
                            colors={COLORS.gradientSOS}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.cardEmoji}>👴</Text>
                            <Text style={styles.cardTitle}>Elder User</Text>
                            <Text style={styles.cardDesc}>
                                I need emergency help & want to alert my contacts
                            </Text>
                            <View style={styles.cardArrow}>
                                <Text style={styles.arrowText}>Get Started →</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Volunteer Card */}
                <Animated.View style={{ transform: [{ scale: scaleVolunteer }] }}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handlePress('volunteer')}
                    >
                        <LinearGradient
                            colors={COLORS.gradientAccent}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.cardEmoji}>🤝</Text>
                            <Text style={[styles.cardTitle, { color: '#0A0A0F' }]}>
                                Volunteer
                            </Text>
                            <Text style={[styles.cardDesc, { color: '#1A1A2E' }]}>
                                I want to help elders in emergency situations
                            </Text>
                            <View style={[styles.cardArrow, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                                <Text style={[styles.arrowText, { color: '#0A0A0F' }]}>
                                    Get Started →
                                </Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Text style={styles.footerText}>
                    Helping elders stay safe, one tap at a time
                </Text>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.xxl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.huge,
    },
    emoji: {
        fontSize: 56,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: FONTS.weights.extrabold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONTS.sizes.lg,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    cardsContainer: {
        gap: SPACING.xl,
    },
    card: {
        padding: SPACING.xxl,
        borderRadius: RADIUS.xl,
        ...SHADOWS.card,
    },
    cardEmoji: {
        fontSize: 44,
        marginBottom: SPACING.md,
    },
    cardTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    cardDesc: {
        fontSize: FONTS.sizes.md,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
        marginBottom: SPACING.lg,
    },
    cardArrow: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    arrowText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.textPrimary,
    },
    footer: {
        alignItems: 'center',
        marginTop: SPACING.huge,
    },
    footerText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
