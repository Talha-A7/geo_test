import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Avatar, Title, Text, Button, List, Divider, useTheme } from 'react-native-paper';
import { useAuthStore } from '../store/useAuthStore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              logout();
              navigation.replace('Auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={user?.displayName?.substring(0, 2).toUpperCase() || 'U'} 
          style={{ backgroundColor: theme.colors.primary }}
        />
        <Title style={styles.userName}>{user?.displayName || 'User'}</Title>
        <Text style={styles.userEmail}>{user?.email || user?.phoneNumber || 'No contact info'}</Text>
      </View>

      <View style={styles.section}>
        <List.Item
          title="Account Settings"
          left={props => <List.Icon {...props} icon="account-cog" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Notifications"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="shield-check-outline" />}
          onPress={() => {}}
        />
        <Divider />
        <List.Item
          title="Help & Support"
          left={props => <List.Icon {...props} icon="help-circle-outline" />}
          onPress={() => {}}
        />
      </View>

      <View style={styles.logoutSection}>
        <Button 
          mode="outlined" 
          onPress={handleLogout} 
          style={styles.logoutButton}
          textColor="#F44336"
        >
          Logout
        </Button>
      </View>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  userName: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666666',
    fontSize: 14,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  logoutSection: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  logoutButton: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  versionText: {
    textAlign: 'center',
    color: '#999999',
    marginTop: 30,
    marginBottom: 20,
    fontSize: 12,
  },
});

export default ProfileScreen;
