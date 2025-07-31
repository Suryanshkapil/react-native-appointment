import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const UserAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch doctor's available schedule when rescheduling
  useEffect(() => {
    const fetchDoctorSchedule = async () => {
      if (!reschedulingAppointment) return;
      
      const doctorRef = doc(db, 'users', reschedulingAppointment.doctorId);
      const doctorDoc = await getDoc(doctorRef);
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        const spec = (data.specializations || []).find((s: any) => s.name === reschedulingAppointment.disease);
        if (spec && spec.schedule) {
          // Get all available dates except the original appointment date
          const allDates = Object.keys(spec.schedule);
          const filteredDates = allDates.filter(date => date !== reschedulingAppointment.preferredDay);
          setAvailableDates(filteredDates);
        }
      }
    };
    fetchDoctorSchedule();
  }, [reschedulingAppointment]);

  // Update available times when new date is selected
  useEffect(() => {
    const fetchTimesForDate = async () => {
      if (!reschedulingAppointment || !newDate) return;
      
      const doctorRef = doc(db, 'users', reschedulingAppointment.doctorId);
      const doctorDoc = await getDoc(doctorRef);
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        const spec = (data.specializations || []).find((s: any) => s.name === reschedulingAppointment.disease);
        if (spec && spec.schedule && spec.schedule[newDate]) {
          setAvailableTimes(spec.schedule[newDate]);
        } else {
          setAvailableTimes([]);
        }
      }
    };
    fetchTimesForDate();
  }, [reschedulingAppointment, newDate]);

  const fetchAppointments = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    
    const q = query(collection(db, 'appointments'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const list: any[] = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Fetch doctor name
      let doctorName = '';
      if (data.doctorId) {
        const doctorRef = doc(db, 'users', data.doctorId);
        const doctorDoc = await getDoc(doctorRef);
        if (doctorDoc.exists()) {
          doctorName = doctorDoc.data().name || '';
        }
      }
      list.push({ id: docSnap.id, ...data, doctorName });
    }
    setAppointments(list);
    setLoading(false);
  };

  const handleReschedule = async () => {
    if (!reschedulingAppointment || !newDate || !newTime) {
      return;
    }

    try {
      // Create new appointment with rescheduled details
      await addDoc(collection(db, 'appointments'), {
        userId: reschedulingAppointment.userId,
        doctorId: reschedulingAppointment.doctorId,
        petName: reschedulingAppointment.petName,
        disease: reschedulingAppointment.disease,
        preferredDay: newDate,
        preferredTime: newTime,
        status: 'pending',
        timestamp: Timestamp.now(),
        originalAppointmentId: reschedulingAppointment.id,
      });

      // Update original appointment status
      const originalRef = doc(db, 'appointments', reschedulingAppointment.id);
      await updateDoc(originalRef, { status: 'rescheduled_by_user' });

      setReschedulingAppointment(null);
      setNewDate('');
      setNewTime('');
      fetchAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rescheduled': return '#FF5722';
      case 'rescheduled_by_user': return '#9C27B0';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Pending';
      case 'approved': return '✓ Approved';
      case 'rescheduled': return '↻ Rescheduled by Doctor';
      case 'rescheduled_by_user': return '↻ Rescheduled by You';
      default: return status;
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Appointments</Text>
      
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No appointments yet</Text>
        </View>
      ) : (
        <FlatList
          data={[...appointments].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
              <Text style={styles.petName}>Pet: {item.petName}</Text>
              <Text style={styles.disease}>Disease: {item.disease}</Text>
              <Text style={styles.dateTime}>Date: {item.preferredDay} | Time: {item.preferredTime}</Text>
              <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
              
              {item.status === 'rescheduled' && (
                <Pressable
                  style={styles.rescheduleButton}
                  onPress={() => setReschedulingAppointment(item)}
                >
                  <Text style={styles.rescheduleButtonText}>Select New Time</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingAppointment && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.modalSubtitle}>Select new date and time</Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>New Date:</Text>
              <View style={styles.picker}>
                <Picker
                  selectedValue={newDate}
                  onValueChange={setNewDate}
                >
                  <Picker.Item label="Select date" value="" />
                  {availableDates.map(date => (
                    <Picker.Item key={date} label={date} value={date} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>New Time:</Text>
              <View style={styles.picker}>
                <Picker
                  selectedValue={newTime}
                  onValueChange={setNewTime}
                  enabled={availableTimes.length > 0}
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
                  setReschedulingAppointment(null);
                  setNewDate('');
                  setNewTime('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleReschedule}
              >
                <Text style={styles.confirmButtonText}>Reschedule</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  petName: { fontSize: 14, color: '#666', marginBottom: 2 },
  disease: { fontSize: 14, color: '#666', marginBottom: 2 },
  dateTime: { fontSize: 14, color: '#666', marginBottom: 8 },
  status: { fontSize: 16, fontWeight: '600' },
  rescheduleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rescheduleButtonText: { color: '#fff', fontWeight: '600' },
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
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
  confirmButton: { backgroundColor: '#007AFF' },
  cancelButtonText: { color: '#666', fontWeight: '600' },
  confirmButtonText: { color: '#fff', fontWeight: '600' },
});

export default UserAppointmentsScreen; 