import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: any;
}

export const AppButton = ({ title, onPress, variant = 'primary', style }: AppButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.button, styles[variant], style]}
      onPress={onPress}
    >
      <Text style={[styles.text, variant === 'primary' ? styles.primaryText : styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryText: {
    color: Colors.background,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
});
