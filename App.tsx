import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import DoctorDashboardScreen from './src/screens/DoctorDashboardScreen';
import UserDashboardScreen from './src/screens/UserDashboardScreen';
import DoctorDirectoryScreen from './src/screens/DoctorDirectoryScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';

export type RootStackParamList = {
  Login: undefined;
  DoctorDashboard: undefined;
  UserDashboard: undefined;
  DoctorDirectory: undefined;
  BookAppointment: { doctorId: string; specialization: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
        <Stack.Screen name="DoctorDirectory" component={DoctorDirectoryScreen} />
        <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
