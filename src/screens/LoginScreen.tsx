import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  DoctorDashboard: undefined;
  UserDashboard: undefined;
  DoctorDirectory: undefined;
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // <-- Add name state
  const [role, setRole] = useState<'doctor' | 'pet-owner'>('doctor');
  const [isNew, setIsNew] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Email and password are required.');
      return;
    }

    try {
      let userCredential;

      if (isNew) {
        if (!name) {
          Alert.alert('Missing info', 'Name is required.');
          return;
        }
        // 🔐 Create account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ Save role and name in Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email,
          name, // <-- Save name
          role,
        });

        // 👋 Sign out after account creation and return to login
        await signOut(auth);
        setIsNew(false);
        setName(''); // <-- Reset name
        Alert.alert('Account Created', 'Please log in with your credentials.');
        return;
      } else {
        // 🔐 Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // ✅ Fetch user data from Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        Alert.alert('Error', 'Login successful, but user profile not found in Firestore.');
        return;
      }

      const userData = userDoc.data();

      // 🚀 Navigate based on role
      if (userData.role === 'doctor') {
        navigation.replace('DoctorDashboard');
      } else {
        navigation.replace('UserDashboard');
      }

    } catch (error: any) {
      console.error('Auth error:', error.message);
      Alert.alert('Auth Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{isNew ? 'Sign Up' : 'Login'}</Text>

      {isNew && (
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {isNew && (
        <>
          <Text style={styles.roleLabel}>Select Role:</Text>
          <Button
            title={`Role: ${role}`}
            onPress={() => setRole(prev => (prev === 'doctor' ? 'pet-owner' : 'doctor'))}
          />
        </>
      )}

      <View style={styles.buttonGroup}>
        <Button
          title={isNew ? 'Create Account' : 'Login'}
          onPress={handleAuth}
        />
        <Button
          title={isNew ? 'Already have an account? Login' : 'New user? Sign up'}
          onPress={() => setIsNew(prev => !prev)}
          color="gray"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
  },
  roleLabel: { marginVertical: 10, fontWeight: '600' },
  buttonGroup: { marginTop: 20 },
});

export default LoginScreen;
