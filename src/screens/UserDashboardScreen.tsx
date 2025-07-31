import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DoctorDirectoryScreen from './DoctorDirectoryScreen';
import UserAppointmentsScreen from './UserAppointmentsScreen';
import EmergencyVisitScreen from './EmergencyVisitScreen';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const Tab = createBottomTabNavigator();

const UserDashboardScreen = () => {
  const [selectedTab, setSelectedTab] = useState('Find Doctor');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      // Fetch user name
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserName(userSnap.data().name || '');
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) return null;

  return (
    <>
      <View style={{ padding: 16, backgroundColor: '#f5f5f5', marginTop: 56 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1976D2' }}>
          Welcome, {userName}
        </Text>
      </View>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={selectedTab}
        screenListeners={{
          state: (e) => {
            const routeName = e.data.state?.routeNames[e.data.state.index];
            if (routeName !== selectedTab) setSelectedTab(routeName);
          },
        }}
      >
        <Tab.Screen name="Find Doctor" component={DoctorDirectoryScreen} />
        <Tab.Screen name="Applied Appointments" component={UserAppointmentsScreen} />
        <Tab.Screen name="Emergency Visit" component={EmergencyVisitScreen} />
      </Tab.Navigator>
    </>
  );
};

export default UserDashboardScreen; 