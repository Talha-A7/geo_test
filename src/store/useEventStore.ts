import { create } from 'zustand';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Member {
  uid: string;
  displayName: string;
  photoURL?: string;
  currentLocation?: Location;
  progress: number; // 0 to 100
  arrived: boolean;
}

export interface Event {
  id: string;
  name: string;
  destinationName: string;
  destinationLocation: Location;
  members: Record<string, Member>;
  totalRouteDistance: number;
  routePolyline: string;
  createdAt: number;
  createdBy: string;
  status: 'active' | 'completed';
}

interface EventState {
  events: Event[];
  activeEvent: Event | null;
  setEvents: (events: Event[]) => void;
  setActiveEvent: (event: Event | null) => void;
  updateMemberLocation: (eventId: string, userId: string, location: Location, progress: number, arrived: boolean) => void;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  activeEvent: null,
  setEvents: (events) => set({ events }),
  setActiveEvent: (event) => set({ activeEvent: event }),
  updateMemberLocation: (eventId, userId, location, progress, arrived) => {
    set((state) => {
      const updatedEvents = state.events.map((event) => {
        if (event.id === eventId && event.members[userId]) {
          return {
            ...event,
            members: {
              ...event.members,
              [userId]: {
                ...event.members[userId],
                currentLocation: location,
                progress,
                arrived,
              },
            },
          };
        }
        return event;
      });

      const updatedActiveEvent =
        state.activeEvent?.id === eventId
          ? {
              ...state.activeEvent,
              members: {
                ...state.activeEvent.members,
                [userId]: {
                  ...state.activeEvent.members[userId],
                  currentLocation: location,
                  progress,
                  arrived,
                },
              },
            }
          : state.activeEvent;

      return { events: updatedEvents, activeEvent: updatedActiveEvent };
    });
  },
}));
