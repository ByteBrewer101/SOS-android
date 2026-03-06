/**
 * SOS Emergency Alert — Main App Entry
 * Navigation setup with AuthContext
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import RoleSelectScreen from './src/screens/RoleSelectScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterElderScreen from './src/screens/RegisterElderScreen';
import RegisterVolunteerScreen from './src/screens/RegisterVolunteerScreen';
import ElderHomeScreen from './src/screens/ElderHomeScreen';
import VolunteerHomeScreen from './src/screens/VolunteerHomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VolunteerSelectionScreen from './src/screens/VolunteerSelectionScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0A0A0F' },
  animation: 'slide_from_right',
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterElder" component={RegisterElderScreen} />
      <Stack.Screen name="RegisterVolunteer" component={RegisterVolunteerScreen} />
    </Stack.Navigator>
  );
}

function ElderStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ElderHome" component={ElderHomeScreen} />
      <Stack.Screen name="VolunteerSelection" component={VolunteerSelectionScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function VolunteerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="VolunteerHome" component={VolunteerHomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#E53E3E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {!isAuthenticated ? (
        <AuthStack />
      ) : role === 'elder' ? (
        <ElderStack />
      ) : (
        <VolunteerStack />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
