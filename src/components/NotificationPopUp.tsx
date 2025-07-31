import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NotificationPopUpProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}

const NotificationPopUp: React.FC<NotificationPopUpProps> = ({ message, actionLabel, onAction, onDismiss }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  closeText: {
    fontSize: 22,
    color: '#888',
  },
  message: {
    fontSize: 16,
    marginBottom: 18,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NotificationPopUp; 