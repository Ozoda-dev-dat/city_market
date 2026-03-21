import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import getColors from '@/constants/colors';

interface ThemedBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ThemedBackground({ children, style }: ThemedBackgroundProps) {
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
