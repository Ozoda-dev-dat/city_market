import React from 'react';
import {
  AccessibilityState,
  AccessibilityRole,
  AccessibilityAction,
  AccessibilityActionName,
} from 'react-native';

// Accessibility configuration
export interface AccessibilityConfig {
  accessible: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: AccessibilityAction[];
  onAccessibilityAction?: (event: any) => void;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityDescribedBy?: string;
  accessibilityLabelledBy?: string;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

// Accessibility utilities
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private isScreenReaderEnabled: boolean = false;
  private isReduceMotionEnabled: boolean = false;
  private highContrastMode: boolean = false;
  private fontSize: 'small' | 'normal' | 'large' | 'extra-large' = 'normal';

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Detect screen reader
      this.isScreenReaderEnabled = await this.detectScreenReader();
      
      // Detect reduced motion preference
      this.isReduceMotionEnabled = await this.detectReducedMotion();
      
      // Detect high contrast mode
      this.highContrastMode = await this.detectHighContrast();
      
      // Detect font size preference
      this.fontSize = await this.detectFontSize();
      
      console.log('Accessibility initialized', {
        screenReader: this.isScreenReaderEnabled,
        reduceMotion: this.isReduceMotionEnabled,
        highContrast: this.highContrastMode,
        fontSize: this.fontSize,
      });
    } catch (error) {
      console.error('Failed to initialize accessibility', error);
    }
  }

  private async detectScreenReader(): Promise<boolean> {
    // In a real app, you would use platform-specific APIs
    // For React Native, you might use Expo's Accessibility module
    try {
      // This is a placeholder - actual implementation would use platform APIs
      return false; // Default to false for demo
    } catch (error) {
      return false;
    }
  }

  private async detectReducedMotion(): Promise<boolean> {
    try {
      // Check for reduced motion preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        return mediaQuery.matches;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async detectHighContrast(): Promise<boolean> {
    try {
      // Check for high contrast mode
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        return mediaQuery.matches;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async detectFontSize(): Promise<'small' | 'normal' | 'large' | 'extra-large'> {
    try {
      // Detect system font size preference
      if (typeof window !== 'undefined') {
        const fontSize = window.getComputedStyle(document.body).fontSize;
        const size = parseFloat(fontSize);
        
        if (size < 14) return 'small';
        if (size < 16) return 'normal';
        if (size < 18) return 'large';
        return 'extra-large';
      }
      return 'normal';
    } catch (error) {
      return 'normal';
    }
  }

  getAccessibilitySettings() {
    return {
      isScreenReaderEnabled: this.isScreenReaderEnabled,
      isReduceMotionEnabled: this.isReduceMotionEnabled,
      highContrastMode: this.highContrastMode,
      fontSize: this.fontSize,
    };
  }

  // Generate accessibility labels
  generateLabel(baseLabel: string, additionalInfo?: string): string {
    let label = baseLabel;
    
    if (additionalInfo && this.isScreenReaderEnabled) {
      label += `. ${additionalInfo}`;
    }
    
    return label;
  }

  // Generate accessibility hints
  generateHint(action: string, result?: string): string {
    let hint = action;
    
    if (result && this.isScreenReaderEnabled) {
      hint += `. ${result}`;
    }
    
    return hint;
  }

  // Check color contrast
  checkColorContrast(foreground: string, background: string): boolean {
    // Simple contrast ratio calculation
    const getLuminance = (color: string): number => {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      // Calculate luminance
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luminance;
    };
    
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                    (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    // WCAG AA standard: 4.5:1 for normal text, 3:1 for large text
    return contrast >= 4.5;
  }

  // Get accessible colors
  getAccessibleColors(baseColors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  }) {
    if (this.highContrastMode) {
      return {
        ...baseColors,
        primary: '#000000',
        secondary: '#FFFFFF',
        background: '#FFFFFF',
        surface: '#F0F0F0',
        text: '#000000',
        textSecondary: '#333333',
      };
    }
    
    return baseColors;
  }

  // Get accessible font sizes
  getAccessibleFontSizes(baseSizes: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  }) {
    const multiplier = {
      small: 0.875,
      normal: 1,
      large: 1.125,
      'extra-large': 1.25,
    }[this.fontSize];
    
    return Object.fromEntries(
      Object.entries(baseSizes).map(([key, size]) => [
        key,
        Math.round(size * multiplier),
      ])
    );
  }
}

// Accessibility hook
export function useAccessibility() {
  const manager = AccessibilityManager.getInstance();
  const [settings, setSettings] = React.useState(manager.getAccessibilitySettings());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSettings(manager.getAccessibilitySettings());
    }, 1000);

    return () => clearInterval(interval);
  }, [manager]);

  const createAccessibilityProps = (
    label: string,
    hint?: string,
    role?: AccessibilityRole,
    state?: AccessibilityState
  ): AccessibilityConfig => {
    return {
      accessible: true,
      accessibilityLabel: manager.generateLabel(label),
      accessibilityHint: hint ? manager.generateHint(hint) : undefined,
      accessibilityRole: role,
      accessibilityState: state,
      importantForAccessibility: 'yes',
    };
  };

  const checkContrast = (foreground: string, background: string): boolean => {
    return manager.checkColorContrast(foreground, background);
  };

  const getAccessibleColors = (baseColors: any) => {
    return manager.getAccessibleColors(baseColors);
  };

  const getAccessibleFontSizes = (baseSizes: any) => {
    return manager.getAccessibleFontSizes(baseSizes);
  };

  return {
    settings,
    createAccessibilityProps,
    checkContrast,
    getAccessibleColors,
    getAccessibleFontSizes,
  };
}

// Accessibility constants
export const ACCESSIBILITY_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  SEARCH: 'search',
  IMAGE: 'image',
  HEADER: 'header',
  SUMMARY: 'summary',
  ALERT: 'alert',
  TAB: 'tab',
  TABLIST: 'tablist',
  TEXTBOX: 'textbox',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  SWITCH: 'switch',
  LIST: 'list',
  LISTITEM: 'listitem',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  MENU: 'menu',
  MENUITEM: 'menuitem',
} as const;

export const ACCESSIBILITY_ACTIONS = {
  ACTIVATE: 'activate',
  LONGPRESS: 'longpress',
  ESCAPE: 'escape',
  MAGIC_TAP: 'magicTap',
  INCREMENT: 'increment',
  DECREMENT: 'decrement',
} as const;

// Accessibility helper functions
export const createA11yLabel = (text: string, context?: string): string => {
  if (!context) return text;
  return `${text}, ${context}`;
};

export const createA11yHint = (action: string, result?: string): string => {
  if (!result) return action;
  return `${action}. ${result}`;
};

export const createA11yState = (
  selected?: boolean,
  disabled?: boolean,
  busy?: boolean,
  checked?: boolean,
  expanded?: boolean
): AccessibilityState => {
  const state: AccessibilityState = {};
  
  if (selected !== undefined) state.selected = selected;
  if (disabled !== undefined) state.disabled = disabled;
  if (busy !== undefined) state.busy = busy;
  if (checked !== undefined) state.checked = checked;
  if (expanded !== undefined) state.expanded = expanded;
  
  return state;
};

export default AccessibilityManager;
