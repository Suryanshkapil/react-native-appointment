import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Pressable, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

const DoctorAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, 'appointments'), where('doctorId', '==', user.uid));
      const snapshot = await getDocs(q);
      const list: any[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let userName = '';
        if (data.userId) {
          const userRef = doc(db, 'users', data.userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            userName = userDoc.data().name || '';
          }
        }
        list.push({ id: docSnap.id, ...data, userName });
      }
      setAppointments(list);
      setLoading(false);
    };
    fetchAppointments();
  }, []);

  const markAsSeen = async (appointmentId: string) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, { status: 'seen' });
    setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: 'seen' } : app));
  };

  const notifyUser = async (userId: string, message: string) => {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'appointment_update',
      message,
      createdAt: Timestamp.now(),
      read: false,
    });
  };

  const approveAppointment = async (appointmentId: string) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, { status: 'approved' });
    setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: 'approved' } : app));
    // Notify user
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment && appointment.userId) {
      await notifyUser(appointment.userId, 'Your appointment has been approved!');
    }
  };

  const rescheduleAppointment = async (appointmentId: string) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, { status: 'rescheduled' });
    setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: 'rescheduled' } : app));
    // Notify user
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment && appointment.userId) {
      await notifyUser(appointment.userId, 'Your appointment has been rescheduled.');
    }
  };

  const transferEmergency = async (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (!appointment) return;
    const { disease, doctorId } = appointment;

    // Find another doctor with the same specialization (case-insensitive)
    const doctorsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'doctor')));
    const doctors = doctorsSnapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((doc: any) => {
        if (doc.id === doctorId) return false;
        if (!doc.specializations) return false;
        return doc.specializations.some((s: any) =>
          (s.name || '').toLowerCase() === (disease || '').toLowerCase()
        );
      });
    console.log('Transfer Emergency: Looking for specialization:', disease);
    console.log('Doctors found:', doctors.map(d => ((d as any).name || d.id)));

    if (doctors.length === 0) {
      Alert.alert('No other doctor with the same specialization found.');
      return;
    }

    // Pick the first available doctor
    const newDoctor = doctors[0];
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, { doctorId: newDoctor.id, status: 'emergency_pending' });
    setAppointments(prev => prev.filter(app => app.id !== appointmentId));

    // Notify the new doctor
    await addDoc(collection(db, 'notifications'), {
      userId: newDoctor.id,
      type: 'emergency',
      message: 'You have received a transferred emergency appointment.',
      createdAt: Timestamp.now(),
      read: false,
    });
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  if (appointments.length === 0) {
    return <SafeAreaView style={styles.container}><Text>No appointments yet.</Text></SafeAreaView>;
  }

  // Sort: emergencies first, then by timestamp (descending)
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;
    // If both are same type, sort by timestamp (most recent first)
    if (a.timestamp && b.timestamp) {
      return b.timestamp.seconds - a.timestamp.seconds;
    }
    return 0;
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sortedAppointments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              item.isEmergency && styles.emergencyCard,
            ]}
          >
            {item.isEmergency && (
              <Text style={styles.emergencyLabel}>EMERGENCY</Text>
            )}
            <Text style={styles.patient}>User: {item.userName} | Pet: {item.petName}</Text>
            <Text>Disease: {item.disease}</Text>
            <Text>Day: {item.preferredDay}</Text>
            <Text>Time: {item.preferredTime}</Text>
            {!item.isEmergency && (
              <Text style={[styles.status, { color: '#666' }]}>{item.status}</Text>
            )}
            {item.status === 'pending' && !item.isEmergency && (
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                <Pressable
                  style={{
                    backgroundColor: '#4CAF50',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flex: 1,
                  }}
                  onPress={() => approveAppointment(item.id)}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Approve</Text>
                </Pressable>
                <Pressable
                  style={{
                    backgroundColor: '#FF9800',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flex: 1,
                  }}
                  onPress={() => rescheduleAppointment(item.id)}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Reschedule</Text>
                </Pressable>
              </View>
            )}
            {item.status === 'emergency_pending' && item.isEmergency && (
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                <Pressable
                  style={{
                    backgroundColor: '#4CAF50',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flex: 1,
                  }}
                  onPress={() => approveAppointment(item.id)}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Approve Emergency</Text>
                </Pressable>
                <Pressable
                  style={{
                    backgroundColor: '#9C27B0',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flex: 1,
                  }}
                  onPress={() => transferEmergency(item.id)}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Transfer</Text>
                </Pressable>
              </View>
            )}
            {item.status === 'approved' && (
              <Text style={{ color: '#4CAF50', fontWeight: 'bold', marginTop: 8 }}>✓ Approved</Text>
            )}
            {item.status === 'rescheduled' && (
              <Text style={{ color: '#FF9800', fontWeight: 'bold', marginTop: 8 }}>↻ Rescheduled</Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  patient: { fontWeight: 'bold', marginBottom: 4 },
  status: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  emergencyCard: {
    borderColor: '#d32f2f',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  emergencyLabel: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default DoctorAppointmentsScreen; 