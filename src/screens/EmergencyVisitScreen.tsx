import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, Pressable, ScrollView } from 'react-native';
import { getDocs, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from 'firebase/auth';

type Doctor = {
  id: string;
  name: string;
  specializations: Array<{ name: string }>;
};

type DoctorListItem = {
  doctorId: string;
  name: string;
  specialization: string;
};

const EmergencyVisitScreen = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [petName, setPetName] = useState('');
  const [disease, setDisease] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Generate available dates (next 7 days)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD format
    }
    return dates;
  };

  // Generate available times (24-hour format)
  const generateAvailableTimes = () => {
    const times = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const availableDates = generateAvailableDates();
  const availableTimes = generateAvailableTimes();

  const fetchDoctors = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const list: Doctor[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === 'doctor' && Array.isArray(data.specializations)) {
          list.push({ id: doc.id, name: data.name, specializations: data.specializations });
        }
      });
      setDoctors(list);
      setFiltered(list);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFiltered(doctors);
      return;
    }
    const result = doctors.filter(doctor =>
      doctor.specializations.some(spec => spec.name.toLowerCase().includes(text.toLowerCase()))
    );
    setFiltered(result);
  };

  const handleEmergencyBooking = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !selectedDoctor || !selectedDate || !selectedTime || !petName || !disease) {
      return;
    }

    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        doctorId: selectedDoctor.doctorId,
        petName,
        disease,
        preferredDay: selectedDate,
        preferredTime: selectedTime,
        status: 'emergency_pending',
        timestamp: Timestamp.now(),
        isEmergency: true,
      });

      setShowBookingModal(false);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
      setPetName('');
      setDisease('');
    } catch (error) {
      console.error('Error booking emergency appointment:', error);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  const doctorListItems: DoctorListItem[] = filtered.flatMap(doctor =>
    doctor.specializations
      .filter(spec =>
        !search || spec.name.toLowerCase().includes(search.toLowerCase())
      )
      .map(spec => ({
        doctorId: doctor.id,
        name: doctor.name,
        specialization: spec.name,
      }))
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>🚨 Emergency Visit</Text>
      <Text style={styles.subheading}>Find a doctor for urgent care</Text>

      <TextInput
        placeholder="Search by specialization (e.g., Skin, Dental)"
        value={search}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />

      <FlatList
        data={doctorListItems}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }: { item: DoctorListItem }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              setSelectedDoctor(item);
              setShowBookingModal(true);
            }}
          >
            <Text style={styles.name}>Dr. {item.name}</Text>
            <Text style={styles.specialization}>{item.specialization}</Text>
            <Text style={styles.emergencyTag}>🚨 Emergency Available</Text>
          </Pressable>
        )}
      />

      {/* Emergency Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <View style={styles.modal}>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🚨 Emergency Appointment</Text>
            <Text style={styles.modalSubtitle}>Dr. {selectedDoctor.name} - {selectedDoctor.specialization}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Pet Name"
              value={petName}
              onChangeText={setPetName}
            />

            <TextInput
              style={styles.input}
              placeholder="Emergency Description"
              value={disease}
              onChangeText={setDisease}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Date:</Text>
              <View style={styles.picker}>
                <Picker
                  selectedValue={selectedDate}
                  onValueChange={setSelectedDate}
                >
                  <Picker.Item label="Select date" value="" />
                  {availableDates.map(date => (
                    <Picker.Item key={date} label={date} value={date} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Time:</Text>
              <View style={styles.picker}>
                <Picker
                  selectedValue={selectedTime}
                  onValueChange={setSelectedTime}
                  enabled={Boolean(selectedDate)}
                >
                  <Picker.Item label="Select time" value="" />
                  {availableTimes.map(time => (
                    <Picker.Item key={time} label={time} value={time} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowBookingModal(false);
                  setSelectedDoctor(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setPetName('');
                  setDisease('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.emergencyButton]}
                onPress={handleEmergencyBooking}
              >
                <Text style={styles.emergencyButtonText}>Book Emergency</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#d32f2f' },
  subheading: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  specialization: { fontSize: 14, color: '#666', marginBottom: 4 },
  emergencyTag: { fontSize: 12, color: '#d32f2f', fontWeight: 'bold' },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: '80%',
    width: '90%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: '#d32f2f' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  pickerContainer: { marginBottom: 16 },
  pickerLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#f1f1f1' },
  emergencyButton: { backgroundColor: '#d32f2f' },
  cancelButtonText: { color: '#666', fontWeight: '600' },
  emergencyButtonText: { color: '#fff', fontWeight: '600' },
});

export default EmergencyVisitScreen; 