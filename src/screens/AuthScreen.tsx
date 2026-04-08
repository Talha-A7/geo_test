import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirm, setConfirm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    // In a real app, integrate Google Sign-In via @react-native-google-signin/google-signin
    Alert.alert('Google Sign-In', 'Google Sign-In integration would be here.');
    // navigation.replace('Main');
  };

  const handlePhoneSignIn = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      // Firebase phone auth integration would be here
      // const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      // setConfirm(confirmation);
      Alert.alert('Phone Auth', 'OTP sent to ' + phoneNumber);
      setConfirm({ confirm: true }); // Mock confirm object
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      // await confirm.confirm(otp);
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to GET</Text>
        <Text style={styles.subtitle}>Sign in to start tracking events</Text>
      </View>

      {!phoneMode ? (
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleGoogleSignIn}
            style={styles.googleButton}
            icon={() => <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" />}
            labelStyle={styles.buttonLabel}
          >
            Sign in with Google
          </Button>

          <Button
            mode="outlined"
            onPress={() => setPhoneMode(true)}
            style={styles.phoneButton}
            icon={() => <MaterialCommunityIcons name="phone" size={24} color="#4A90E2" />}
            labelStyle={[styles.buttonLabel, { color: '#4A90E2' }]}
          >
            Sign in with Phone
          </Button>
        </View>
      ) : (
        <View style={styles.phoneAuthContainer}>
          {!confirm ? (
            <>
              <TextInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                placeholder="+1 234 567 8900"
              />
              <Button
                mode="contained"
                onPress={handlePhoneSignIn}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
              >
                Send OTP
              </Button>
              <TouchableOpacity onPress={() => setPhoneMode(false)}>
                <Text style={styles.backText}>Back to options</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                label="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleVerifyOtp}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
              >
                Verify & Sign In
              </Button>
              <TouchableOpacity onPress={() => setConfirm(null)}>
                <Text style={styles.backText}>Change Phone Number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  buttonContainer: {
    width: '100%',
  },
  googleButton: {
    backgroundColor: '#DB4437',
    marginBottom: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  phoneButton: {
    borderColor: '#4A90E2',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  phoneAuthContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  backText: {
    textAlign: 'center',
    color: '#4A90E2',
    fontSize: 16,
  },
});

export default AuthScreen;
