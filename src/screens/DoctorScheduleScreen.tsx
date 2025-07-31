import React, { useState } from 'react';
import { Calendar } from 'react-native-calendars';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DoctorScheduleScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [specializations, setSpecializations] = useState<Array<{ name: string, schedule: { [date: string]: string[] } }>>([]);
  const [currentSpec, setCurrentSpec] = useState('');
  const [currentSchedule, setCurrentSchedule] = useState<{ [date: string]: string[] }>({});
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<{ [date: string]: boolean }>({});
  const [activeDate, setActiveDate] = useState<string>('');
  const [doctorName, setDoctorName] = useState('');
  const colorScheme = useColorScheme();

  const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeOptions = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  React.useEffect(() => {
    const fetchDoctorName = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setDoctorName(userSnap.data().name || '');
      }
    };
    fetchDoctorName();
  }, []);

  const addSpecialization = () => {
    if (!currentSpec) {
      Alert.alert('Please enter a specialization');
      return;
    }
    setSpecializations(prev => [...prev, { name: currentSpec, schedule: currentSchedule }]);
    setCurrentSpec('');
    setCurrentSchedule({});
    setExpandedDays([]);
  };

  const handleSave = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user is currently signed in.");
      return;
    }
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userRef, {
        specializations,
      });
      Alert.alert('Success', `Specializations and schedules saved for Dr. ${doctorName}!`);
    } catch (error) {
      console.error('Error saving profile to Firestore:', error);
      Alert.alert('Error', 'Failed to save schedule.');
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      Alert.alert('Signed Out', 'You have been logged out.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Error', 'Failed to sign out.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Doctor Specializations & Schedule</Text>
        <TextInput
          style={styles.input}
          placeholder="Add Specialization (e.g., Skin, Dental)"
          value={currentSpec}
          onChangeText={setCurrentSpec}
        />
        <Text style={styles.subHeading}>Select Available Dates:</Text>
        <Calendar
          markingType={'multi-dot'}
          markedDates={Object.keys(selectedDates).reduce((acc, date) => {
            acc[date] = selectedDates[date]
              ? { selected: true, selectedColor: 'green' }
              : {};
            return acc;
          }, {} as any)}
          onDayPress={day => {
            setSelectedDates(prev => {
              const newDates = { ...prev };
              if (newDates[day.dateString]) {
                delete newDates[day.dateString];
              } else {
                newDates[day.dateString] = true;
              }
              return newDates;
            });
            setActiveDate(day.dateString);
          }}
        />
        {/* Horizontal chips for selected dates */}
        {Object.keys(selectedDates).length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            {Object.keys(selectedDates).map(date => (
              <Pressable
                key={date}
                onPress={() => setActiveDate(date)}
                style={{
                  backgroundColor: activeDate === date ? 'green' : '#eee',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  borderWidth: activeDate === date ? 2 : 0,
                  borderColor: activeDate === date ? '#1e7d22' : 'transparent',
                }}
              >
                <Text style={{ color: activeDate === date ? '#fff' : '#333', fontWeight: 'bold' }}>{date}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {/* Card for time selection */}
        {activeDate && selectedDates[activeDate] ? (
           <View style={{
             backgroundColor: '#fff',
             borderRadius: 16,
             padding: 18,
             marginVertical: 10,
             shadowColor: '#000',
             shadowOpacity: 0.08,
             shadowRadius: 8,
             elevation: 2,
           }}>
             <Text style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 16, color: '#222' }}>
               Select times for <Text style={{ color: 'green' }}>{activeDate}</Text>:
             </Text>
             <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
               {timeOptions.map((time) => {
                 const selected = currentSchedule[activeDate]?.includes(time);
                 return (
                   <Pressable
                     key={`${activeDate}-${time}`}
                     onPress={() => {
                       setCurrentSchedule((prev) => {
                         const dateSlots = prev[activeDate] || [];
                         const updated = dateSlots.includes(time)
                           ? dateSlots.filter((t) => t !== time)
                           : [...dateSlots, time];
                         return { ...prev, [activeDate]: updated };
                       });
                     }}
                     style={{
                       backgroundColor: selected ? 'green' : '#f2f2f2',
                       paddingHorizontal: 16,
                       paddingVertical: 10,
                       borderRadius: 20,
                       marginBottom: 10,
                       marginRight: 10,
                       borderWidth: selected ? 2 : 0,
                       borderColor: selected ? '#1e7d22' : 'transparent',
                     }}
                   >
                     <Text style={{ color: selected ? '#fff' : '#333', fontWeight: '600' }}>{time}</Text>
                   </Pressable>
                 );
               })}
             </View>
           </View>
        ) : null}
        <View style={styles.saveBtn}>
          <Button title="Add Specialization" onPress={addSpecialization} />
        </View>
        <Text style={styles.subHeading}>Added Specializations:</Text>
        {specializations.map((spec, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.name}>{spec.name}</Text>
            <Text style={styles.days}>
              Available: {Object.keys(spec.schedule).join(', ') || 'No schedule'}
            </Text>
          </View>
        ))}
        <View style={styles.saveBtn}>
          <Button title="Save All" onPress={handleSave} />
        </View>
        <View style={{ marginTop: 20 }}>
          <Button title="Sign Out" onPress={handleLogout} color="#333" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  subHeading: { marginTop: 10, fontWeight: '600', fontSize: 16, marginBottom: 10 },
  dropdownSection: {
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 18,
    color: '#777',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  timeSlot: {
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
    borderRadius: 20,
  },
  timeSlotSelected: {
    backgroundColor: '#4CAF50',
  },
  saveBtn: { marginTop: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  days: {
    fontSize: 14,
    color: '#555',
  },
});

export default DoctorScheduleScreen;