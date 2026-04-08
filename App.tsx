import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { RootStackParamList } from './src/navigation/types';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import MainTabs from './src/navigation/MainTabs';
import CreateEventScreen from './src/screens/CreateEventScreen';
import MapScreen from './src/screens/MapScreen';
import { useAuthStore } from './src/store/useAuthStore';
import auth from '@react-native-firebase/auth';

const Stack = createStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A90E2',
    accent: '#F5A623',
  },
};

const App = () => {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email || undefined,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
        });
      } else {
        setUser(null);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, [setUser]);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
