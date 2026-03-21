import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility, ACCESSIBILITY_ROLES } from '@/lib/accessibility';
import { useTheme } from '@/context/ThemeContext';

// Accessible Button Component
interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

export function AccessibleButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  style,
}: AccessibleButtonProps) {
  const { createAccessibilityProps, getAccessibleColors } = useAccessibility();
  const { isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const colors = getAccessibleColors({
    primary: '#007AFF',
    secondary: '#5856D6',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    surface: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
  });

  const getButtonStyles = () => {
    const baseStyles = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 8,
      borderWidth: 2,
      transition: 'all 0.2s ease',
    };

    const sizeStyles = {
      sm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 32 },
      md: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 44 },
      lg: { paddingHorizontal: 20, paddingVertical: 16, minHeight: 48 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: disabled ? colors.textSecondary : colors.primary,
        borderColor: disabled ? colors.textSecondary : colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? colors.textSecondary : colors.secondary,
        borderColor: disabled ? colors.textSecondary : colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: disabled ? colors.textSecondary : colors.primary,
      },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
      transform: [{ scale: isPressed ? 0.95 : isFocused ? 1.05 : 1 }],
    };
  };

  const getTextStyles = () => {
    const sizeStyles = {
      sm: { fontSize: 14, fontWeight: '500' as const },
      md: { fontSize: 16, fontWeight: '600' as const },
      lg: { fontSize: 18, fontWeight: '600' as const },
    };

    const variantStyles = {
      primary: { color: '#ffffff' },
      secondary: { color: '#ffffff' },
      outline: { color: disabled ? colors.textSecondary : colors.primary },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const a11yProps = createAccessibilityProps(
    accessibilityLabel || title,
    accessibilityHint || `Double tap to ${title.toLowerCase()}`,
    ACCESSIBILITY_ROLES.BUTTON,
    { disabled }
  );

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPress();
    }
  };

  return (
    <Pressable
      {...a11yProps}
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyPress={handleKeyPress}
      accessible={true}
      focusable={!disabled}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
          color={variant === 'outline' ? colors.primary : '#ffffff'}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={getTextStyles()}>{title}</Text>
    </Pressable>
  );
}

// Accessible Input Component
interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AccessibleInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  error,
  disabled = false,
  multiline = false,
  maxLength,
  accessibilityLabel,
  accessibilityHint,
}: AccessibleInputProps) {
  const { createAccessibilityProps, getAccessibleColors } = useAccessibility();
  const { isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const colors = getAccessibleColors({
    primary: '#007AFF',
    secondary: '#5856D6',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    surface: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
  });

  const getInputStyles = () => ({
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: disabled ? colors.textSecondary : colors.surface,
    borderColor: error 
      ? '#ff5252' 
      : isFocused 
        ? colors.primary 
        : colors.textSecondary,
    minHeight: multiline ? 100 : 44,
  });

  const getLabelStyles = () => ({
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  });

  const getErrorStyles = () => ({
    fontSize: 12,
    color: '#ff5252',
    marginTop: 4,
  });

  const a11yProps = createAccessibilityProps(
    accessibilityLabel || label,
    accessibilityHint || `Enter ${label.toLowerCase()}`,
    ACCESSIBILITY_ROLES.TEXTBOX,
    { disabled }
  );

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={getLabelStyles()}>{label}</Text>
      <TextInput
        {...a11yProps}
        ref={inputRef}
        style={getInputStyles()}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={!disabled}
        multiline={multiline}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessible={true}
        importantForAccessibility="yes"
      />
      {error && <Text style={getErrorStyles()}>{error}</Text>}
    </View>
  );
}

// Accessible Card Component
interface AccessibleCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  onPress?: () => void;
  image?: string;
  badge?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

export function AccessibleCard({
  title,
  subtitle,
  description,
  onPress,
  image,
  badge,
  accessibilityLabel,
  accessibilityHint,
  style,
}: AccessibleCardProps) {
  const { createAccessibilityProps, getAccessibleColors } = useAccessibility();
  const { isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const colors = getAccessibleColors({
    primary: '#007AFF',
    secondary: '#5856D6',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    surface: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
  });

  const getCardStyles = () => ({
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: isFocused ? colors.primary : 'transparent',
    transform: [{ scale: isFocused ? 1.02 : 1 }],
  });

  const a11yProps = createAccessibilityProps(
    accessibilityLabel || `${title}${subtitle ? `, ${subtitle}` : ''}${description ? `, ${description}` : ''}`,
    accessibilityHint || onPress ? 'Double tap to view details' : undefined,
    onPress ? ACCESSIBILITY_ROLES.BUTTON : undefined
  );

  const CardContent = (
    <View style={getCardStyles()}>
      {badge && (
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: colors.primary,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
            {badge}
          </Text>
        </View>
      )}
      
      {image && (
        <View style={{
          width: 60,
          height: 60,
          backgroundColor: colors.textSecondary,
          borderRadius: 8,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name="image" size={24} color={colors.text} />
        </View>
      )}
      
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        }}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 4,
          }}>
            {subtitle}
          </Text>
        )}
        
        {description && (
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
          }}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        {...a11yProps}
        onPress={onPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={style}
        accessible={true}
        focusable={true}
      >
        {CardContent}
      </Pressable>
    );
  }

  return (
    <View style={style} accessible={true} importantForAccessibility="yes">
      {CardContent}
    </View>
  );
}

// Accessible List Component
interface AccessibleListItemProps {
  item: any;
  index: number;
  onPress: (item: any) => void;
  renderTitle: (item: any) => string;
  renderSubtitle?: (item: any) => string;
  renderDescription?: (item: any) => string;
  accessibilityLabel?: (item: any) => string;
  accessibilityHint?: string;
}

export function AccessibleListItem({
  item,
  index,
  onPress,
  renderTitle,
  renderSubtitle,
  renderDescription,
  accessibilityLabel,
  accessibilityHint,
}: AccessibleListItemProps) {
  const { createAccessibilityProps, getAccessibleColors } = useAccessibility();
  const { isDarkMode } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const colors = getAccessibleColors({
    primary: '#007AFF',
    secondary: '#5856D6',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    surface: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
  });

  const getItemStyles = () => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary,
    borderWidth: 2,
    borderColor: isFocused ? colors.primary : 'transparent',
  });

  const title = renderTitle(item);
  const subtitle = renderSubtitle?.(item);
  const description = renderDescription?.(item);

  const a11yProps = createAccessibilityProps(
    accessibilityLabel?.(item) || `${title}${subtitle ? `, ${subtitle}` : ''}${description ? `, ${description}` : ''}`,
    accessibilityHint || 'Double tap to select',
    ACCESSIBILITY_ROLES.LISTITEM
  );

  return (
    <Pressable
      {...a11yProps}
      style={getItemStyles()}
      onPress={() => onPress(item)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      accessible={true}
      focusable={true}
    >
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 2,
        }}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 2,
          }}>
            {subtitle}
          </Text>
        )}
        
        {description && (
          <Text style={{
            fontSize: 12,
            color: colors.textSecondary,
          }}>
            {description}
          </Text>
        )}
      </View>
      
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

// Keyboard Navigation Hook
export function useKeyboardNavigation() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardMode) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => prev + 1);
          break;
        case 'Tab':
          setIsKeyboardMode(true);
          break;
        case 'Escape':
          setIsKeyboardMode(false);
          Keyboard.dismiss();
          break;
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isKeyboardMode]);

  return {
    focusedIndex,
    setFocusedIndex,
    isKeyboardMode,
    setIsKeyboardMode,
  };
}

// Focus Management Hook
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const focusableElements = useRef<Map<string, any>>(new Map());

  const registerFocusable = (id: string, ref: any) => {
    focusableElements.current.set(id, ref);
  };

  const unregisterFocusable = (id: string) => {
    focusableElements.current.delete(id);
  };

  const focusElement = (id: string) => {
    const element = focusableElements.current.get(id);
    if (element) {
      element.focus?.();
      setFocusedElement(id);
    }
  };

  const focusNext = () => {
    const elements = Array.from(focusableElements.current.keys());
    const currentIndex = elements.indexOf(focusedElement || '');
    const nextIndex = (currentIndex + 1) % elements.length;
    focusElement(elements[nextIndex]);
  };

  const focusPrevious = () => {
    const elements = Array.from(focusableElements.current.keys());
    const currentIndex = elements.indexOf(focusedElement || '');
    const prevIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
    focusElement(elements[prevIndex]);
  };

  return {
    focusedElement,
    registerFocusable,
    unregisterFocusable,
    focusElement,
    focusNext,
    focusPrevious,
  };
}

export default {
  AccessibleButton,
  AccessibleInput,
  AccessibleCard,
  AccessibleListItem,
  useKeyboardNavigation,
  useFocusManagement,
};
