import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SetupScreen from './src/screens/SetupScreen';
import SOSScreen from './src/screens/SOSScreen';

const STORAGE_KEY = '@sos_emergency_contact';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [contactNumber, setContactNumber] = useState(null);

  useEffect(() => {
    loadContact();
  }, []);

  const loadContact = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setContactNumber(saved);
      }
    } catch (error) {
      console.log('Error loading contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = (number) => {
    setContactNumber(number);
  };

  const handleReset = () => {
    setContactNumber(null);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {contactNumber ? (
        <SOSScreen contactNumber={contactNumber} onReset={handleReset} />
      ) : (
        <SetupScreen onComplete={handleSetupComplete} />
      )}
    </>
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
