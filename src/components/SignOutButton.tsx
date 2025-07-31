// components/SignOutButton.tsx
import React from 'react';
import { Button, Alert } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const SignOutButton = ({ navigation }: Props) => {
  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      Alert.alert('Signed Out', 'You have been logged out.');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Logout Error', 'Something went wrong. Please try again.');
    }
  };

  return <Button title="Sign Out" color="#333" onPress={handleSignOut} />;
};

export default SignOutButton;
