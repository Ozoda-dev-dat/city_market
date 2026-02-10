import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { AppText, AppCard, AppButton, AppInput } from '@/components/ui';
import { useAddressStore } from '@/src/lib/address-store';
import Colors from '@/constants/colors';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddressModal = ({ visible, onClose }: AddressModalProps) => {
  const [address, setAddress] = useState('');
  const setStoreAddress = useAddressStore((state) => state.setAddress);

  const handleSave = () => {
    if (address.trim().length > 0) {
      // Mocking lat/lng for manual input
      setStoreAddress(address, 41.2995, 69.2401); 
      setAddress('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <AppCard style={styles.modalContent}>
            <AppText variant="title">Delivery Address</AppText>
            <AppText variant="caption" style={styles.subtitle}>
              Please enter your delivery address manually to proceed.
            </AppText>
            
            <AppInput
              placeholder="Enter address..."
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />

            <View style={styles.actions}>
              <AppButton 
                title="Cancel" 
                variant="secondary" 
                onPress={onClose} 
                style={styles.button}
              />
              <AppButton 
                title="Save" 
                onPress={handleSave} 
                style={styles.button}
              />
            </View>
          </AppCard>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    gap: 16,
  },
  subtitle: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
