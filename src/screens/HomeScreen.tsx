import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { FAB, Card, Title, Paragraph, Avatar, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useEventStore, Event } from '../store/useEventStore';
import { useAuthStore } from '../store/useAuthStore';
import database from '@react-native-firebase/database';
import moment from 'moment';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuthStore();
  const { events, setEvents } = useEventStore();
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchEvents = () => {
    if (!user) return;
    setRefreshing(true);
    // Real-time listener for events where user is a member
    const eventsRef = database().ref('/events');
    eventsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventList: Event[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((event: Event) => event.members && event.members[user.uid]);
        
        // Sort by creation time (descending)
        eventList.sort((a, b) => b.createdAt - a.createdAt);
        setEvents(eventList);
      } else {
        setEvents([]);
      }
      setRefreshing(false);
    });

    return () => eventsRef.off('value');
  };

  useEffect(() => {
    const unsubscribe = fetchEvents();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const onRefresh = () => {
    fetchEvents();
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const memberCount = Object.keys(item.members || {}).length;
    const dateStr = moment(item.createdAt).fromNow();

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('Map', { eventId: item.id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.eventTitle}>{item.name}</Title>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#4CAF50' : '#9E9E9E' }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <Paragraph style={styles.destination}>
            📍 {item.destinationName}
          </Paragraph>
          <View style={styles.cardFooter}>
            <View style={styles.memberInfo}>
              <Avatar.Icon size={24} icon="account-group" style={{ backgroundColor: theme.colors.primary }} />
              <Text style={styles.footerText}>{memberCount} members</Text>
            </View>
            <Text style={styles.footerText}>{dateStr}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Avatar.Icon size={80} icon="calendar-blank" style={{ backgroundColor: '#F5F5F5' }} color="#BDBDBD" />
            <Text style={styles.emptyText}>No active events. Create one to start tracking!</Text>
          </View>
        }
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('CreateEvent')}
        label="Create Event"
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  destination: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default HomeScreen;
