import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
interface AccessibilityPreferences {
  fontSize: string;
  colorScheme: string;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  hapticFeedback: boolean;
  soundEnabled: boolean;
  largeText: boolean;
  boldText: boolean;
}

interface AccessibilityContextType {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  fontSize: string;
  colorScheme: string;
  announcements: string[];
  announce: (message: string) => void;
  setFontSize: (size: string) => void;
  setColorScheme: (scheme: string) => void;
  preferences: AccessibilityPreferences;
  updatePreferences: (preferences: Partial<AccessibilityPreferences>) => void;
}

// Accessibility context
const AccessibilityContext = createContext<AccessibilityContextType>({
  isScreenReaderEnabled: false,
  isReduceMotionEnabled: false,
  isHighContrastEnabled: false,
  fontSize: 'medium',
  colorScheme: 'light',
  announcements: [],
  announce: (message: string) => {},
  setFontSize: (size: string) => {},
  setColorScheme: (scheme: string) => {},
  preferences: {
    fontSize: 'medium',
    colorScheme: 'light',
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    hapticFeedback: true,
    soundEnabled: true,
    largeText: false,
    boldText: false,
  },
  updatePreferences: (preferences: Partial<AccessibilityPreferences>) => {},
});

// Accessibility provider component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [colorScheme, setColorScheme] = useState('light');
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    fontSize: 'medium',
    colorScheme: 'light',
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    hapticFeedback: true,
    soundEnabled: true,
    largeText: false,
    boldText: false,
  });

  // Load accessibility preferences on mount
  useEffect(() => {
    loadAccessibilityPreferences();
    checkAccessibilityStatus();
    
    // Listen for accessibility changes
    const subscription = AccessibilityInfo.addEventListener('change', handleAccessibilityChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const loadAccessibilityPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem('accessibility_preferences');
      if (stored) {
        const loadedPreferences = JSON.parse(stored) as AccessibilityPreferences;
        setPreferences(loadedPreferences);
        setFontSize(loadedPreferences.fontSize || 'medium');
        setColorScheme(loadedPreferences.colorScheme || 'light');
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
    }
  };

  const saveAccessibilityPreferences = async (newPreferences: AccessibilityPreferences) => {
    try {
      await AsyncStorage.setItem('accessibility_preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  };

  const checkAccessibilityStatus = async () => {
    try {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      
      setIsScreenReaderEnabled(screenReaderEnabled);
      setIsReduceMotionEnabled(reduceMotionEnabled);
      
      // Check for high contrast mode (Android only)
      if (Platform.OS === 'android') {
        // In production, you'd use native modules to check this
        const highContrast = await checkHighContrastMode();
        setIsHighContrastEnabled(highContrast);
      }
    } catch (error) {
      console.error('Failed to check accessibility status:', error);
    }
  };

  const checkHighContrastMode = async (): Promise<boolean> => {
    // Mock implementation - in production, use native modules
    return false;
  };

  const handleAccessibilityChange = () => {
    checkAccessibilityStatus();
  };

  const announce = (message: string) => {
    if (isScreenReaderEnabled) {
      // Add to announcements queue
      setAnnouncements(prev => [...prev, message]);
      
      // Remove announcement after 3 seconds
      setTimeout(() => {
        setAnnouncements(prev => prev.filter((_, index) => index !== 0));
      }, 3000);
      
      // Use platform-specific announcement
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(message);
      } else if (Platform.OS === 'android') {
        // Android implementation would use native modules
        console.log('Accessibility announcement:', message);
      }
    }
  };

  const updatePreferences = (newPreferences: Partial<AccessibilityPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    saveAccessibilityPreferences(updatedPreferences);
    
    // Apply preferences
    if (newPreferences.fontSize) {
      setFontSize(newPreferences.fontSize);
    }
    if (newPreferences.colorScheme) {
      setColorScheme(newPreferences.colorScheme);
    }
  };

  const value = {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isHighContrastEnabled,
    fontSize,
    colorScheme,
    announcements,
    announce,
    setFontSize,
    setColorScheme,
    preferences,
    updatePreferences,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility utilities
export const AccessibilityUtils = {
  // Check if screen reader is enabled
  isScreenReaderEnabled: async (): Promise<boolean> => {
    return await AccessibilityInfo.isScreenReaderEnabled();
  },

  // Check if reduce motion is enabled
  isReduceMotionEnabled: async (): Promise<boolean> => {
    return await AccessibilityInfo.isReduceMotionEnabled();
  },

  // Announce message for screen reader
  announce: (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  },

  // Get accessibility preferences
  getPreferences: async () => {
    try {
      const stored = await AsyncStorage.getItem('accessibility_preferences');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get accessibility preferences:', error);
      return {};
    }
  },

  // Set accessibility preferences
  setPreferences: async (preferences: Partial<AccessibilityPreferences>) => {
    try {
      await AsyncStorage.setItem('accessibility_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to set accessibility preferences:', error);
    }
  },

  // Check if element is accessible
  isElementAccessible: (element: any): boolean => {
    // Check if element has accessibility properties
    return !!(
      element?.accessible ||
      element?.accessibilityLabel ||
      element?.accessibilityHint ||
      element?.accessibilityRole
    );
  },

  // Get accessibility properties for element
  getAccessibilityProps: (element: any) => {
    const props: any = {};

    if (element?.accessible !== undefined) {
      props.accessible = element.accessible;
    }

    if (element?.accessibilityLabel) {
      props.accessibilityLabel = element.accessibilityLabel;
    }

    if (element?.accessibilityHint) {
      props.accessibilityHint = element.accessibilityHint;
    }

    if (element?.accessibilityRole) {
      props.accessibilityRole = element.accessibilityRole;
    }

    if (element?.accessibilityState) {
      props.accessibilityState = element.accessibilityState;
    }

    if (element?.accessibilityValue) {
      props.accessibilityValue = element.accessibilityValue;
    }

    if (element?.accessibilityLiveRegion) {
      props.accessibilityLiveRegion = element.accessibilityLiveRegion;
    }

    if (element?.accessibilityLabelledBy) {
      props.accessibilityLabelledBy = element.accessibilityLabelledBy;
    }

    if (element?.accessibilityDescribedBy) {
      props.accessibilityDescribedBy = element.accessibilityDescribedBy;
    }

    return props;
  },

  // Generate accessibility label for product
  getProductAccessibilityLabel: (product: any) => {
    const parts = [];
    
    if (product.name) {
      parts.push(product.name);
    }
    
    if (product.price) {
      parts.push(`Price: ${product.price} UZS`);
    }
    
    if (product.rating) {
      parts.push(`Rating: ${product.rating} stars`);
    }
    
    if (product.inStock) {
      parts.push('In stock');
    } else {
      parts.push('Out of stock');
    }
    
    return parts.join('. ');
  },

  // Generate accessibility label for order
  getOrderAccessibilityLabel: (order: any) => {
    const parts = [];
    
    parts.push(`Order ${order.id}`);
    parts.push(`Status: ${order.status}`);
    parts.push(`Total: ${order.total} UZS`);
    
    if (order.customerName) {
      parts.push(`Customer: ${order.customerName}`);
    }
    
    if (order.createdAt) {
      parts.push(`Created: ${new Date(order.createdAt).toLocaleDateString()}`);
    }
    
    return parts.join('. ');
  },

  // Generate accessibility label for category
  getCategoryAccessibilityLabel: (category: any) => {
    const parts = [];
    
    if (category.name) {
      parts.push(category.name);
    }
    
    if (category.description) {
      parts.push(category.description);
    }
    
    if (category.productCount) {
      parts.push(`${category.productCount} products`);
    }
    
    return parts.join('. ');
  },

  // Check if color is accessible
  isColorAccessible: (color: string, backgroundColor: string): boolean => {
    // Simple contrast ratio check
    // In production, use a proper contrast ratio calculation
    const contrastRatio = calculateContrastRatio(color, backgroundColor);
    return contrastRatio >= 4.5; // WCAG AA standard
  },

  // Get accessible color scheme
  getAccessibleColorScheme: (isHighContrast: boolean) => {
    if (isHighContrast) {
      return {
        primary: '#000000',
        secondary: '#FFFFFF',
        background: '#FFFFFF',
        text: '#000000',
        border: '#000000',
        success: '#006600',
        warning: '#FF6600',
        error: '#CC0000',
      };
    }
    
    return {
      primary: '#2E7D32',
      secondary: '#F97316',
      background: '#FFFFFF',
      text: '#000000',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    };
  },

  // Get accessible font size
  getAccessibleFontSize: (size: string, baseSize: number = 16) => {
    const sizes = {
      small: baseSize * 0.875,
      medium: baseSize,
      large: baseSize * 1.125,
      xlarge: baseSize * 1.25,
      xxlarge: baseSize * 1.5,
    };
    
    return sizes[size as keyof typeof sizes] || baseSize;
  },

  // Get accessible spacing
  getAccessibleSpacing: (spacing: string, baseSpacing: number = 8) => {
    const spacings = {
      xs: baseSpacing * 0.5,
      sm: baseSpacing * 0.75,
      md: baseSpacing,
      lg: baseSpacing * 1.5,
      xl: baseSpacing * 2,
      xxl: baseSpacing * 3,
    };
    
    return spacings[spacing as keyof typeof spacings] || baseSpacing;
  },

  // Check if motion is reduced
  shouldReduceMotion: (isReduceMotionEnabled: boolean) => {
    return isReduceMotionEnabled;
  },

  // Get accessible animation duration
  getAccessibleAnimationDuration: (duration: number, isReduceMotionEnabled: boolean) => {
    return isReduceMotionEnabled ? 0 : duration;
  },

  // Validate accessibility of component
  validateAccessibility: (component: any) => {
    const issues: string[] = [];
    
    // Check for accessibility label
    if (!component.accessibilityLabel && !component.accessibilityHint) {
      issues.push('Missing accessibility label or hint');
    }
    
    // Check for accessibility role
    if (!component.accessibilityRole && component.accessible) {
      issues.push('Missing accessibility role');
    }
    
    // Check for accessibility state
    if (component.accessible && !component.accessibilityState) {
      issues.push('Missing accessibility state');
    }
    
    return issues;
  },

  // Generate accessibility report
  generateAccessibilityReport: (components: any[]) => {
    const report = {
      total: components.length,
      accessible: 0,
      issues: [] as string[],
      recommendations: [] as string[],
    };
    
    components.forEach(component => {
      const issues = AccessibilityUtils.validateAccessibility(component);
      
      if (issues.length === 0) {
        report.accessible++;
      } else {
        report.issues.push(...issues);
      }
    });
    
    // Generate recommendations
    if (report.issues.length > 0) {
      report.recommendations.push('Add accessibility labels to all interactive elements');
      report.recommendations.push('Use semantic accessibility roles');
      report.recommendations.push('Provide accessibility hints for complex interactions');
      report.recommendations.push('Test with screen readers');
    }
    
    return report;
  },
};

// Helper function to calculate contrast ratio
function calculateContrastRatio(color1: string, color2: string): number {
  // Simple implementation - in production, use proper contrast ratio calculation
  return 4.5; // Mock value
}

// Accessibility HOC
export const withAccessibility = <P extends object & { announce?: (message: string) => void }>(
  WrappedComponent: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { announce } = useAccessibility();
    
    return <WrappedComponent {...props} ref={ref} announce={announce} />;
  });
};

// Accessibility hook for components
export const useComponentAccessibility = (componentName: string) => {
  const { announce, isScreenReaderEnabled } = useAccessibility();
  
  const announceChange = (message: string) => {
    if (isScreenReaderEnabled) {
      announce(`${componentName}: ${message}`);
    }
  };
  
  const announceFocus = (elementName: string) => {
    if (isScreenReaderEnabled) {
      announce(`Focused on ${elementName}`);
    }
  };
  
  const announceError = (error: string) => {
    if (isScreenReaderEnabled) {
      announce(`Error: ${error}`);
    }
  };
  
  const announceSuccess = (message: string) => {
    if (isScreenReaderEnabled) {
      announce(`Success: ${message}`);
    }
  };
  
  return {
    announceChange,
    announceFocus,
    announceError,
    announceSuccess,
  };
};

export default AccessibilityProvider;
