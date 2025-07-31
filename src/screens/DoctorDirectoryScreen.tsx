import React, { useEffect, useState } from 'react';
import SignOutButton from '../components/SignOutButton';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BookAppointment'>;
};

type Doctor = {
  id: string;
  name: string;
  specializations: Array<{ name: string; schedule: { [day: string]: string[] } }>;
};

type DoctorListItem = {
  doctorId: string;
  name: string;
  specialization: string;
  schedule: { [day: string]: string[] };
};

const DoctorDirectoryScreen = ({ navigation }: Props) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    // Only keep doctors who have at least one matching specialization
    const result = doctors.filter(doctor =>
      doctor.specializations.some(spec => spec.name.toLowerCase().includes(text.toLowerCase()))
    );
    setFiltered(result);
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  let doctorListItems: DoctorListItem[] = filtered.flatMap(doctor =>
    doctor.specializations
      .filter(spec =>
        !search || spec.name.toLowerCase().includes(search.toLowerCase())
      )
      .map(spec => ({
        doctorId: doctor.id,
        name: doctor.name,
        specialization: spec.name,
        schedule: spec.schedule,
      }))
  );

  return (
    <SafeAreaView style={styles.container}>
      <SignOutButton navigation={navigation} />
      <Text style={styles.heading}>Find a Doctor</Text>

      <TextInput
        placeholder="Search by disease (e.g., Skin, Dental)"
        value={search}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />

      <FlatList
        data={doctorListItems}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }: { item: DoctorListItem }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BookAppointment', { doctorId: item.doctorId, specialization: item.specialization })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialization}>{item.specialization}</Text>
            <Text style={styles.days}>
              Available: {Object.entries(item.schedule || {})
                .map(([day, times]) => `${day}: ${times.join(', ')}`)
                .join(' | ') || 'No schedule'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, marginTop: 20 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  name: { fontSize: 18, fontWeight: '600' },
  specialization: { marginTop: 4, color: '#555' },
  days: { marginTop: 8, fontStyle: 'italic' },
});

export default DoctorDirectoryScreen;
