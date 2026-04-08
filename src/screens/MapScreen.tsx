import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, FlatList, Animated, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Avatar, Text, Card, ProgressBar, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import database from '@react-native-firebase/database';
import { useAuthStore } from '../store/useAuthStore';
import { useEventStore, Event, Member, Location } from '../store/useEventStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const theme = useTheme();
  const { user } = useAuthStore();
  const { activeEvent, setActiveEvent } = useEventStore();
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const eventId = route.params?.eventId;

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    // 1. Fetch event data and listen for updates
    const eventRef = database().ref(`/events/${eventId}`);
    eventRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setActiveEvent(data);
        setLoading(false);
      }
    });

    // 2. Start location tracking
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMyLocation(latitude, longitude);
      },
      (error) => console.log(error),
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
    );

    // 3. Pulse animation for own marker
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      eventRef.off('value');
      Geolocation.clearWatch(watchId);
    };
  }, [eventId]);

  const updateMyLocation = async (lat: number, lng: number) => {
    if (!user || !eventId || !activeEvent) return;

    // Calculate progress (simplified for demo)
    // In a real app, use distance to destination vs total distance
    const dest = activeEvent.destinationLocation;
    const dist = Math.sqrt(Math.pow(lat - dest.latitude, 2) + Math.pow(lng - dest.longitude, 2));
    const progress = Math.max(0, Math.min(100, (1 - dist / 0.1) * 100)); // 0.1 degree as max dist
    const arrived = dist < 0.0005; // ~50 meters

    await database().ref(`/events/${eventId}/members/${user.uid}`).update({
      currentLocation: { latitude: lat, longitude: lng },
      progress: Math.round(progress),
      arrived: arrived,
    });

    if (arrived && !activeEvent.members[user.uid]?.arrived) {
      // Trigger notification logic here
      Alert.alert('Arrival', 'You have arrived at the destination!');
    }
  };

  const centerOnMe = () => {
    if (activeEvent && user && activeEvent.members[user.uid]?.currentLocation) {
      const loc = activeEvent.members[user.uid].currentLocation!;
      mapRef.current?.animateToRegion({
        ...loc,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const fitAllMarkers = () => {
    if (!activeEvent) return;
    const coordinates = Object.values(activeEvent.members)
      .filter(m => m.currentLocation)
      .map(m => m.currentLocation!);
    coordinates.push(activeEvent.destinationLocation);

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  if (!activeEvent) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="map-marker-off" size={64} color="#BDBDBD" />
        <Text style={styles.emptyText}>No active event selected. Please select an event from Home.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home' as never)}>
          <Text style={styles.linkText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const members = Object.values(activeEvent.members);

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapSection}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            ...activeEvent.destinationLocation,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={fitAllMarkers}
        >
          {/* Destination Marker */}
          <Marker
            coordinate={activeEvent.destinationLocation}
            title="Destination"
            description={activeEvent.destinationName}
          >
            <View style={styles.destMarker}>
              <MaterialCommunityIcons name="flag-checkered" size={30} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Member Markers */}
          {members.map((member) => (
            member.currentLocation && (
              <Marker
                key={member.uid}
                coordinate={member.currentLocation}
                title={member.displayName}
              >
                <View style={styles.memberMarkerContainer}>
                  {member.uid === user?.uid && (
                    <Animated.View 
                      style={[
                        styles.pulseCircle, 
                        { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.6, 0] }) }
                      ]} 
                    />
                  )}
                  <Avatar.Text 
                    size={36} 
                    label={member.displayName.substring(0, 2).toUpperCase()} 
                    style={{ backgroundColor: member.uid === user?.uid ? theme.colors.primary : '#757575' }}
                  />
                </View>
              </Marker>
            )
          ))}

          {/* Route Polyline (Mock for now) */}
          {/* In real app, use actual polyline from Directions API */}
        </MapView>

        <TouchableOpacity style={styles.centerBtn} onPress={centerOnMe}>
          <IconButton icon="crosshairs-gps" size={24} iconColor="#4A90E2" style={styles.iconBtn} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fitBtn} onPress={fitAllMarkers}>
          <IconButton icon="arrow-expand-all" size={24} iconColor="#4A90E2" style={styles.iconBtn} />
        </TouchableOpacity>
      </View>

      {/* Member Panel */}
      <View style={styles.panelSection}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>{activeEvent.name}</Text>
          <Text style={styles.panelSubtitle}>{members.length} members tracking</Text>
        </View>

        <FlatList
          horizontal
          data={members}
          keyExtractor={(item) => item.uid}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberList}
          renderItem={({ item }) => (
            <Card style={styles.memberCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Avatar.Text 
                    size={40} 
                    label={item.displayName.substring(0, 2).toUpperCase()} 
                    style={{ backgroundColor: item.uid === user?.uid ? theme.colors.primary : '#9E9E9E' }}
                  />
                  <View style={styles.nameContainer}>
                    <Text style={styles.memberName} numberOfLines={1}>{item.displayName}</Text>
                    <Text style={styles.memberStatus}>
                      {item.arrived ? 'Arrived!' : `${item.progress}% completed`}
                    </Text>
                  </View>
                </View>
                <ProgressBar 
                  progress={item.progress / 100} 
                  color={item.arrived ? '#4CAF50' : theme.colors.primary} 
                  style={styles.progressBar} 
                />
              </Card.Content>
            </Card>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999999',
    textAlign: 'center',
    marginVertical: 20,
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapSection: {
    height: '65%',
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  destMarker: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  memberMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
  },
  centerBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    elevation: 4,
  },
  fitBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    elevation: 4,
  },
  iconBtn: {
    margin: 0,
  },
  panelSection: {
    height: '35%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    paddingTop: 20,
  },
  panelHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  panelSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  memberList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  memberCard: {
    width: 220,
    marginHorizontal: 5,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#F8F9FA',
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  memberStatus: {
    fontSize: 12,
    color: '#666666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});

export default MapScreen;
