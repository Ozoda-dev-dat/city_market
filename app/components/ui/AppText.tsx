import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface AppTextProps {
  children: React.ReactNode;
  variant?: 'title' | 'body' | 'caption';
  style?: any;
}

export const AppText = ({ children, variant = 'body', style }: AppTextProps) => {
  return (
    <Text style={[styles.base, styles[variant], style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: Colors.textPrimary,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
});
