import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

function NavigationWrapper() {
    const { isAuthenticated, isLoading, role } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/role-select');
        } else if (isAuthenticated) {
            if (role === 'elder' && segments[0] !== '(actions)' && segments[0] !== '(elder)') {
                router.replace('/(elder)/home');
            } else if (role !== 'elder' && segments[0] !== '(volunteer)') {
                router.replace('/(volunteer)/home');
            }
        }
    }, [isAuthenticated, isLoading, role, segments]);

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color="#E67E22" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F6F0' }, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(elder)" />
            <Stack.Screen name="(volunteer)" />
            <Stack.Screen name="(actions)" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <NavigationWrapper />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: '#F8F6F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
