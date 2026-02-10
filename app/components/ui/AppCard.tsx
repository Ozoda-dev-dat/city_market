import React from 'react';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface AppCardProps {
  children: React.ReactNode;
  style?: any;
}

export const AppCard = ({ children, style }: AppCardProps) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
});
