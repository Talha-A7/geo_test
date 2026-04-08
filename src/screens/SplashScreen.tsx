import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/useAuthStore';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (user) {
          navigation.replace('Main');
        } else {
          navigation.replace('Auth');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isLoading, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Placeholder for App Logo */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>GET</Text>
        </View>
        <Text style={styles.appName}>Group Event Tracker</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
});

export default SplashScreen;
