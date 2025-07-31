import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DoctorScheduleScreen from './DoctorScheduleScreen';
import DoctorAppointmentsScreen from './DoctorAppointmentsScreen';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const Tab = createBottomTabNavigator();

const DoctorDashboardScreen = () => {
  const [selectedTab, setSelectedTab] = useState('Schedule');
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      // Fetch doctor name
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setDoctorName(userSnap.data().name || '');
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
          Welcome, Dr. {doctorName}
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
        <Tab.Screen name="Schedule" component={DoctorScheduleScreen} />
        <Tab.Screen name="Appointments" component={DoctorAppointmentsScreen} />
      </Tab.Navigator>
    </>
  );
};

export default DoctorDashboardScreen; 