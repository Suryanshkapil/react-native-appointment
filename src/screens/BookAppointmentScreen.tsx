// src/screens/BookAppointmentScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const BookAppointmentScreen = () => {
  const route = useRoute<any>();
  const { doctorId, specialization } = route.params;
  const [petName, setPetName] = useState('');
  // Change: do not prefill disease with specialization
  const [disease, setDisease] = useState('');
  const [preferredDay, setPreferredDay] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Fetch doctor's schedule for the selected specialization
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!doctorId || !specialization) return;
      const userRef = doc(db, 'users', doctorId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const spec = (data.specializations || []).find((s: any) => s.name === specialization);
        if (spec && spec.schedule) {
          const days = Object.keys(spec.schedule);
          setAvailableDays(days);
        }
      }
    };
    fetchSchedule();
  }, [doctorId, specialization]);

  // Update available times when preferredDay changes
  useEffect(() => {
    const fetchTimes = async () => {
      if (!doctorId || !specialization || !preferredDay) return;
      const userRef = doc(db, 'users', doctorId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const spec = (data.specializations || []).find((s: any) => s.name === specialization);
        if (spec && spec.schedule && spec.schedule[preferredDay]) {
          setAvailableTimes(spec.schedule[preferredDay]);
        } else {
          setAvailableTimes([]);
        }
      }
    };
    fetchTimes();
  }, [doctorId, specialization, preferredDay]);

  const handleBooking = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    if (!petName || !disease || !preferredDay || !preferredTime) {
      Alert.alert('Incomplete', 'Please fill all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        doctorId,
        petName,
        disease,
        preferredDay,
        preferredTime,
        status: 'pending',
        timestamp: Timestamp.now(),
      });

      Alert.alert('Success', 'Appointment requested successfully!');
      setPetName('');
      setDisease('');
      setPreferredDay('');
      setPreferredTime('');
    } catch (err) {
      console.error('Error booking appointment:', err);
      Alert.alert('Error', 'Could not complete appointment booking.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Book Appointment</Text>
          <Text style={styles.subheading}>Select your preferred time slot</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pet Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Pet Name"
            value={petName}
            onChangeText={setPetName}
          />

          <TextInput
            style={styles.input}
            placeholder="Disease / Concern"
            value={disease}
            onChangeText={setDisease}
            editable={true}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.input}>
            <Picker
              selectedValue={preferredDay}
              onValueChange={setPreferredDay}
              enabled={availableDays.length > 0}
            >
              <Picker.Item label="Select a date" value="" />
              {availableDays.map(day => (
                <Picker.Item key={day} label={day} value={day} />
              ))}
            </Picker>
          </View>

          <View style={styles.input}>
            <Picker
              selectedValue={preferredTime}
              onValueChange={setPreferredTime}
              enabled={availableTimes.length > 0}
            >
              <Picker.Item label="Select a time" value="" />
              {availableTimes.map(time => (
                <Picker.Item key={time} label={time} value={time} />
              ))}
            </Picker>
          </View>
        </View>

        <Pressable style={styles.confirmButton} onPress={handleBooking}>
          <Text style={styles.confirmButtonText}>Confirm Appointment</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    padding: 12,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BookAppointmentScreen;
