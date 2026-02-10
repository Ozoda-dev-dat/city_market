import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import Colors from '@/constants/colors';

interface AppInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  style?: any;
}

export const AppInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  style,
}: AppInputProps) => {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
});
