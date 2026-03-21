import React from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import { useAccessibility } from '@/lib/accessibility';

// Reduced motion hook
export function useReducedMotion() {
  const { settings } = useAccessibility();
  
  return {
    isReduceMotionEnabled: settings.isReduceMotionEnabled,
    // Animation configurations based on motion preference
    getAnimationConfig: (defaultConfig: any) => {
      if (settings.isReduceMotionEnabled) {
        return {
          ...defaultConfig,
          duration: 0, // No duration for reduced motion
          useNativeDriver: true,
        };
      }
      return defaultConfig;
    },
    // Animated value with reduced motion support
    createAnimatedValue: (value: number) => {
      return new Animated.Value(value);
    },
    // Spring animation with reduced motion support
    spring: (value: Animated.Value, toValue: number, config?: any) => {
      const defaultConfig = settings.isReduceMotionEnabled
        ? { toValue, useNativeDriver: true, tension: 0, friction: 0 }
        : { toValue, useNativeDriver: true, tension: 100, friction: 8 };
      
      return Animated.spring(value, { ...defaultConfig, ...config });
    },
    // Timing animation with reduced motion support
    timing: (value: Animated.Value, toValue: number, config?: any) => {
      const defaultConfig = settings.isReduceMotionEnabled
        ? { toValue, duration: 0, useNativeDriver: true }
        : { toValue, duration: 300, useNativeDriver: true };
      
      return Animated.timing(value, { ...defaultConfig, ...config });
    },
  };
}

// Accessible animation wrapper
interface AccessibleAnimationProps {
  children: React.ReactNode;
  animationType: 'fade' | 'slide' | 'scale' | 'rotate';
  duration?: number;
  delay?: number;
  style?: any;
  onAnimationComplete?: () => void;
}

export function AccessibleAnimation({
  children,
  animationType,
  duration = 300,
  delay = 0,
  style,
  onAnimationComplete,
}: AccessibleAnimationProps) {
  const { isReduceMotionEnabled } = useReducedMotion();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isReduceMotionEnabled) {
      // Skip animation for reduced motion
      animatedValue.setValue(1);
      onAnimationComplete?.();
      return;
    }

    const animationConfig = {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    };

    let animation: Animated.CompositeAnimation;

    switch (animationType) {
      case 'fade':
        animation = Animated.timing(animatedValue, animationConfig);
        break;
      case 'slide':
        animation = Animated.timing(animatedValue, animationConfig);
        break;
      case 'scale':
        animation = Animated.spring(animatedValue, {
          ...animationConfig,
          tension: 100,
          friction: 8,
        });
        break;
      case 'rotate':
        animation = Animated.timing(animatedValue, animationConfig);
        break;
      default:
        animation = Animated.timing(animatedValue, animationConfig);
    }

    animation.start(onAnimationComplete);

    return () => animation.stop();
  }, [animationType, duration, delay, isReduceMotionEnabled, onAnimationComplete]);

  const getAnimationStyle = () => {
    if (isReduceMotionEnabled) {
      return {}; // No animation styles for reduced motion
    }

    switch (animationType) {
      case 'fade':
        return {
          opacity: animatedValue,
        };
      case 'slide':
        return {
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
          opacity: animatedValue,
        };
      case 'scale':
        return {
          transform: [
            {
              scale: animatedValue,
            },
          ],
        };
      case 'rotate':
        return {
          transform: [
            {
              rotate: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        };
      default:
        return {};
    }
  };

  return (
    <Animated.View style={[getAnimationStyle(), style]}>
      {children}
    </Animated.View>
  );
}

// Screen reader announcements
export function useScreenReaderAnnouncements() {
  const { settings } = useAccessibility();
  const [announcement, setAnnouncement] = React.useState<string>('');

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.isScreenReaderEnabled) return;

    setAnnouncement(message);
    
    // Clear the announcement after it's read
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  }, [settings.isScreenReaderEnabled]);

  const announceScreenChange = React.useCallback((screenName: string) => {
    announce(`${screenName} screen opened`);
  }, [announce]);

  const announceAction = React.useCallback((action: string) => {
    announce(`Action completed: ${action}`);
  }, [announce]);

  const announceError = React.useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = React.useCallback((message: string) => {
    announce(`Success: ${message}`);
  }, [announce]);

  return {
    announcement,
    announce,
    announceScreenChange,
    announceAction,
    announceError,
    announceSuccess,
  };
}

// Focus trap for modals
export function useFocusTrap(isActive: boolean) {
  const focusableElements = React.useRef<Set<any>>(new Set());
  const previousFocus = React.useRef<any>(null);

  const addFocusable = React.useCallback((element: any) => {
    focusableElements.current.add(element);
  }, []);

  const removeFocusable = React.useCallback((element: any) => {
    focusableElements.current.delete(element);
  }, []);

  const trapFocus = React.useCallback(() => {
    if (!isActive || focusableElements.current.size === 0) return;

    // Store previous focus
    previousFocus.current = document.activeElement;

    // Focus first element
    const firstElement = focusableElements.current.values().next().value;
    if (firstElement) {
      firstElement.focus();
    }
  }, [isActive]);

  const releaseFocus = React.useCallback(() => {
    if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (isActive) {
      trapFocus();
    } else {
      releaseFocus();
    }

    return releaseFocus;
  }, [isActive, trapFocus, releaseFocus]);

  return {
    addFocusable,
    removeFocusable,
    trapFocus,
    releaseFocus,
  };
}

// Skip to main content link
export function SkipToMainContent() {
  const { settings } = useAccessibility();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsVisible(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleMouseDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, []);

  if (!settings.isScreenReaderEnabled || !isVisible) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: -40,
        left: 0,
        backgroundColor: '#007AFF',
        padding: 8,
        zIndex: 9999,
      }}
      accessible={true}
      accessibilityLabel="Skip to main content"
      accessibilityRole="link"
      onPress={() => {
        // Focus main content
        // Note: document.getElementById is not available in React Native
        // This would need to be implemented using React Native's focus management
        // const mainContent = document.getElementById('main-content');
        // if (mainContent) {
        //   mainContent.focus();
        // }
      }}
    >
      <Text style={{ color: '#ffffff', fontWeight: '600' }}>
        Skip to main content
      </Text>
    </View>
  );
}

// High contrast mode support
export function useHighContrast() {
  const { settings, getAccessibleColors } = useAccessibility();

  const getHighContrastColors = (baseColors: any) => {
    if (!settings.highContrastMode) {
      return baseColors;
    }

    return getAccessibleColors({
      ...baseColors,
      // High contrast colors
      primary: '#000000',
      secondary: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#F0F0F0',
      text: '#000000',
      textSecondary: '#333333',
      border: '#000000',
      error: '#FF0000',
      success: '#00FF00',
      warning: '#FFFF00',
    });
  };

  const getHighContrastStyles = (baseStyles: any) => {
    if (!settings.highContrastMode) {
      return baseStyles;
    }

    return {
      ...baseStyles,
      // High contrast style adjustments
      borderWidth: 2,
      borderColor: '#000000',
      shadowOpacity: 0, // Remove shadows for high contrast
    };
  };

  return {
    isHighContrastMode: settings.highContrastMode,
    getHighContrastColors,
    getHighContrastStyles,
  };
}

// Font size scaling
export function useFontSizeScaling() {
  const { settings, getAccessibleFontSizes } = useAccessibility();

  const getScaledFontSize = (baseSize: number) => {
    const sizes = getAccessibleFontSizes({
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    });

    // Find the closest size
    const sizeKeys = Object.keys(sizes);
    const closestKey = sizeKeys.reduce((prev, curr) => {
      const prevDiff = Math.abs(sizes[prev] - baseSize);
      const currDiff = Math.abs(sizes[curr] - baseSize);
      return currDiff < prevDiff ? curr : prev;
    });

    return sizes[closestKey];
  };

  const getScaledStyles = (baseStyles: any) => {
    const scaledStyles = { ...baseStyles };

    // Scale font sizes
    Object.keys(scaledStyles).forEach(key => {
      const style = scaledStyles[key];
      if (style && typeof style === 'object' && style.fontSize) {
        style.fontSize = getScaledFontSize(style.fontSize);
      }
    });

    return scaledStyles;
  };

  return {
    fontSize: settings.fontSize,
    getScaledFontSize,
    getScaledStyles,
  };
}

// Accessibility testing utilities
export const AccessibilityTesting = {
  // Check if element is accessible
  checkAccessibility: (element: any) => {
    const issues: string[] = [];

    if (!element.props.accessible && !element.props.importantForAccessibility) {
      issues.push('Element is not marked as accessible');
    }

    if (!element.props.accessibilityLabel && !element.props.accessibilityLabelledBy) {
      issues.push('Element has no accessibility label');
    }

    if (element.props.accessibilityRole === 'button' && !element.props.onPress) {
      issues.push('Button role without press handler');
    }

    return issues;
  },

  // Generate accessibility report
  generateReport: (components: any[]) => {
    const report = {
      totalComponents: components.length,
      accessibleComponents: 0,
      issues: [] as string[],
      componentDetails: [] as any[],
    };

    components.forEach((component, index) => {
      const issues = AccessibilityTesting.checkAccessibility(component);
      
      if (issues.length === 0) {
        report.accessibleComponents++;
      } else {
        report.issues.push(...issues.map(issue => `Component ${index + 1}: ${issue}`));
      }

      report.componentDetails.push({
        index: index + 1,
        type: component.type?.name || 'Unknown',
        accessible: issues.length === 0,
        issues,
      });
    });

    return report;
  },

  // Test color contrast
  testContrast: (foreground: string, background: string) => {
    const getLuminance = (color: string): number => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luminance;
    };

    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                    (Math.min(fgLuminance, bgLuminance) + 0.05);

    return {
      ratio: contrast,
      passes: contrast >= 4.5, // WCAG AA standard
      level: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : 'Fail',
    };
  },
};

export default {
  useReducedMotion,
  AccessibleAnimation,
  useScreenReaderAnnouncements,
  useFocusTrap,
  SkipToMainContent,
  useHighContrast,
  useFontSizeScaling,
  AccessibilityTesting,
};
