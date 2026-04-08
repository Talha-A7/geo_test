import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Title, Text, Avatar, List, Divider, IconButton, useTheme } from 'react-native-paper';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/useAuthStore';
import { GOOGLE_MAPS_API_KEY } from '../constants/Config';
import database from '@react-native-firebase/database';
import axios from 'axios';

type CreateEventNavigationProp = StackNavigationProp<RootStackParamList, 'CreateEvent'>;

interface SelectedMember {
  uid: string;
  displayName: string;
  phoneNumber?: string;
}

const CreateEventScreen = () => {
  const navigation = useNavigation<CreateEventNavigationProp>();
  const { user } = useAuthStore();
  const theme = useTheme();

  const [eventName, setEventName] = useState('');
  const [destination, setDestination] = useState<any>(null);
  const [invitePhone, setInvitePhone] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<SelectedMember[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddMember = async () => {
    if (!invitePhone) return;
    if (invitedMembers.length >= 7) {
      Alert.alert('Limit reached', 'You can invite up to 7 more people.');
      return;
    }

    setLoading(true);
    try {
      // In a real app, search users by phone number in Firebase
      // For this demo, we'll mock adding a member
      const mockUid = 'mock_user_' + Math.random().toString(36).substr(2, 9);
      const newMember: SelectedMember = {
        uid: mockUid,
        displayName: 'User ' + invitePhone.slice(-4),
        phoneNumber: invitePhone,
      };
      
      setInvitedMembers([...invitedMembers, newMember]);
      setInvitePhone('');
    } catch (error) {
      Alert.alert('Error', 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = (uid: string) => {
    setInvitedMembers(invitedMembers.filter(m => m.uid !== uid));
  };

  const handleStartEvent = async () => {
    if (!eventName || !destination || !user) {
      Alert.alert('Missing Info', 'Please provide event name and destination.');
      return;
    }

    setLoading(true);
    try {
      const { lat, lng } = destination.geometry.location;
      
      // 1. Fetch route from Google Directions API
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lng}&destination=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      // Note: In a real app, origin would be user's current location.
      // For creation, we'll just store the destination and calculate routes per user later.
      
      const eventId = database().ref('/events').push().key;
      
      const membersData: Record<string, any> = {};
      // Add current user
      membersData[user.uid] = {
        uid: user.uid,
        displayName: user.displayName || 'Me',
        progress: 0,
        arrived: false,
      };
      // Add invited members
      invitedMembers.forEach(m => {
        membersData[m.uid] = {
          uid: m.uid,
          displayName: m.displayName,
          progress: 0,
          arrived: false,
        };
      });

      const eventData = {
        id: eventId,
        name: eventName,
        destinationName: destination.description,
        destinationLocation: { latitude: lat, longitude: lng },
        members: membersData,
        createdAt: database.ServerValue.TIMESTAMP,
        createdBy: user.uid,
        status: 'active',
        routePolyline: '', // Will be updated when members start tracking
        totalRouteDistance: 0,
      };

      await database().ref(`/events/${eventId}`).set(eventData);
      
      navigation.replace('Map', { eventId: eventId! });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Title>Create New Event</Title>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.label}>Event Name</Text>
          <TextInput
            mode="outlined"
            placeholder="e.g. Weekend Trip to Beach"
            value={eventName}
            onChangeText={setEventName}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Destination</Text>
          <GooglePlacesAutocomplete
            placeholder="Search destination"
            onPress={(data, details = null) => {
              setDestination(details);
            }}
            query={{
              key: GOOGLE_MAPS_API_KEY,
              language: 'en',
            }}
            fetchDetails={true}
            styles={{
              container: { flex: 0 },
              textInput: styles.placesInput,
              listView: styles.placesListView,
            }}
            enablePoweredByContainer={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Invite Members (2-8 people)</Text>
          <View style={styles.inviteRow}>
            <TextInput
              mode="outlined"
              placeholder="Phone number"
              value={invitePhone}
              onChangeText={setInvitePhone}
              keyboardType="phone-pad"
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />
            <Button 
              mode="contained" 
              onPress={handleAddMember} 
              style={styles.addButton}
              disabled={!invitePhone || loading}
            >
              Add
            </Button>
          </View>

          <View style={styles.memberList}>
            {invitedMembers.map((m) => (
              <List.Item
                key={m.uid}
                title={m.displayName}
                description={m.phoneNumber}
                left={props => <Avatar.Text {...props} size={40} label={m.displayName.substring(0, 2).toUpperCase()} />}
                right={props => <IconButton {...props} icon="close-circle" onPress={() => removeMember(m.uid)} />}
                style={styles.memberItem}
              />
            ))}
            {invitedMembers.length === 0 && (
              <Text style={styles.emptyText}>No members invited yet.</Text>
            )}
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleStartEvent}
          loading={loading}
          disabled={loading || !eventName || !destination}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
        >
          Start Event
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  placesInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#757575',
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  placesListView: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginTop: 2,
    zIndex: 1000,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    marginLeft: 10,
    height: 50,
    justifyContent: 'center',
  },
  memberList: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 5,
  },
  memberItem: {
    paddingVertical: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    marginVertical: 15,
  },
  startButton: {
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
  startButtonContent: {
    height: 50,
  },
});

export default CreateEventScreen;
