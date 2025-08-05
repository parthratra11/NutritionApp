import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ConfirmationModal = ({ visible, message, onConfirm, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '80%',
    backgroundColor: '#0A1E33',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#562424',
  },
  confirmButton: {
    backgroundColor: '#16486B',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfirmationModal;