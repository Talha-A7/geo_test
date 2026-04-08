export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  CreateEvent: undefined;
  Map: { eventId: string };
};

export type BottomTabParamList = {
  Home: undefined;
  MapTab: { eventId?: string };
  Profile: undefined;
};
