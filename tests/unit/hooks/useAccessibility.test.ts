import { renderHook, act } from '@testing-library/react-hooks';
import { useAccessibility } from '@/lib/accessibility';

// Mock the accessibility manager
jest.mock('@/lib/accessibility', () => ({
  ...jest.requireActual('@/lib/accessibility'),
  AccessibilityManager: {
    getInstance: jest.fn(() => ({
      getAccessibilitySettings: jest.fn(() => ({
        isScreenReaderEnabled: false,
        isReduceMotionEnabled: false,
        highContrastMode: false,
        fontSize: 'normal',
      })),
      generateLabel: jest.fn((baseLabel, additionalInfo) => 
        additionalInfo ? `${baseLabel}. ${additionalInfo}` : baseLabel
      ),
      generateHint: jest.fn((action, result) => 
        result ? `${action}. ${result}` : action
      ),
      checkColorContrast: jest.fn(() => true),
      getAccessibleColors: jest.fn((colors) => colors),
      getAccessibleFontSizes: jest.fn((sizes) => sizes),
    })),
  },
}));

describe('useAccessibility Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return accessibility settings', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.settings).toEqual({
      isScreenReaderEnabled: false,
      isReduceMotionEnabled: false,
      highContrastMode: false,
      fontSize: 'normal',
    });
  });

  it('should create accessibility props correctly', () => {
    const { result } = renderHook(() => useAccessibility());

    const props = result.current.createAccessibilityProps(
      'Test Label',
      'Test Hint',
      'button',
      { selected: true }
    );

    expect(props).toEqual({
      accessible: true,
      accessibilityLabel: 'Test Label',
      accessibilityHint: 'Test Hint',
      accessibilityRole: 'button',
      accessibilityState: { selected: true },
      importantForAccessibility: 'yes',
    });
  });

  it('should check color contrast', () => {
    const { result } = renderHook(() => useAccessibility());

    const isContrastGood = result.current.checkContrast('#000000', '#ffffff');

    expect(isContrastGood).toBe(true);
  });

  it('should get accessible colors', () => {
    const { result } = renderHook(() => useAccessibility());

    const baseColors = {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#000000',
      textSecondary: '#666666',
    };

    const colors = result.current.getAccessibleColors(baseColors);

    expect(colors).toEqual(baseColors);
  });

  it('should get accessible font sizes', () => {
    const { result } = renderHook(() => useAccessibility());

    const baseSizes = {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    };

    const sizes = result.current.getAccessibleFontSizes(baseSizes);

    expect(sizes).toEqual(baseSizes);
  });

  it('should update settings when accessibility settings change', () => {
    const { result, rerender } = renderHook(() => useAccessibility());

    // Initial settings
    expect(result.current.settings.isScreenReaderEnabled).toBe(false);

    // Simulate settings change
    jest.spyOn(result.current, 'settings', 'get').mockReturnValue({
      isScreenReaderEnabled: true,
      isReduceMotionEnabled: true,
      highContrastMode: true,
      fontSize: 'large',
    });

    rerender();

    // Settings should be updated
    expect(result.current.settings.isScreenReaderEnabled).toBe(true);
  });
});

describe('AccessibilityManager', () => {
  let manager: any;

  beforeEach(() => {
    // Reset singleton
    jest.resetModules();
    const { AccessibilityManager } = require('@/lib/accessibility');
    manager = AccessibilityManager.getInstance();
  });

  it('should initialize with default settings', () => {
    const settings = manager.getAccessibilitySettings();

    expect(settings).toEqual({
      isScreenReaderEnabled: false,
      isReduceMotionEnabled: false,
      highContrastMode: false,
      fontSize: 'normal',
    });
  });

  it('should generate labels with additional info for screen readers', () => {
    const label = manager.generateLabel('Base Label', 'Additional Info');

    expect(label).toBe('Base Label. Additional Info');
  });

  it('should generate labels without additional info', () => {
    const label = manager.generateLabel('Base Label');

    expect(label).toBe('Base Label');
  });

  it('should generate hints with result for screen readers', () => {
    const hint = manager.generateHint('Action', 'Result');

    expect(hint).toBe('Action. Result');
  });

  it('should generate hints without result', () => {
    const hint = manager.generateHint('Action');

    expect(hint).toBe('Action');
  });

  it('should check color contrast correctly', () => {
    const isGood = manager.checkColorContrast('#000000', '#ffffff');

    expect(isGood).toBe(true);
  });

  it('should return accessible colors unchanged when not in high contrast', () => {
    const baseColors = {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#000000',
      textSecondary: '#666666',
    };

    const colors = manager.getAccessibleColors(baseColors);

    expect(colors).toEqual(baseColors);
  });

  it('should return high contrast colors when in high contrast mode', () => {
    // Mock high contrast mode
    jest.spyOn(manager, 'getAccessibilitySettings').mockReturnValue({
      isScreenReaderEnabled: false,
      isReduceMotionEnabled: false,
      highContrastMode: true,
      fontSize: 'normal',
    });

    const baseColors = {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#000000',
      textSecondary: '#666666',
    };

    const colors = manager.getAccessibleColors(baseColors);

    expect(colors.primary).toBe('#000000');
    expect(colors.secondary).toBe('#FFFFFF');
    expect(colors.background).toBe('#FFFFFF');
    expect(colors.text).toBe('#000000');
  });

  it('should return font sizes unchanged for normal font size', () => {
    const baseSizes = {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    };

    const sizes = manager.getAccessibleFontSizes(baseSizes);

    expect(sizes).toEqual(baseSizes);
  });

  it('should scale font sizes for large font size', () => {
    // Mock large font size
    jest.spyOn(manager, 'getAccessibilitySettings').mockReturnValue({
      isScreenReaderEnabled: false,
      isReduceMotionEnabled: false,
      highContrastMode: false,
      fontSize: 'large',
    });

    const baseSizes = {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    };

    const sizes = manager.getAccessibleFontSizes(baseSizes);

    expect(sizes.base).toBe(18); // 16 * 1.125
    expect(sizes.lg).toBe(20); // 18 * 1.125
  });
});

describe('Accessibility Constants', () => {
  const { ACCESSIBILITY_ROLES, ACCESSIBILITY_ACTIONS } = require('@/lib/accessibility');

  it('should have correct accessibility roles', () => {
    expect(ACCESSIBILITY_ROLES.BUTTON).toBe('button');
    expect(ACCESSIBILITY_ROLES.LINK).toBe('link');
    expect(ACCESSIBILITY_ROLES.SEARCH).toBe('search');
    expect(ACCESSIBILITY_ROLES.IMAGE).toBe('image');
    expect(ACCESSIBILITY_ROLES.HEADER).toBe('header');
    expect(ACCESSIBILITY_ROLES.SUMMARY).toBe('summary');
    expect(ACCESSIBILITY_ROLES.ALERT).toBe('alert');
    expect(ACCESSIBILITY_ROLES.TAB).toBe('tab');
    expect(ACCESSIBILITY_ROLES.TABLIST).toBe('tablist');
    expect(ACCESSIBILITY_ROLES.TEXTBOX).toBe('textbox');
    expect(ACCESSIBILITY_ROLES.SLIDER).toBe('slider');
    expect(ACCESSIBILITY_ROLES.SPINBUTTON).toBe('spinbutton');
    expect(ACCESSIBILITY_ROLES.SWITCH).toBe('switch');
    expect(ACCESSIBILITY_ROLES.LIST).toBe('list');
    expect(ACCESSIBILITY_ROLES.LISTITEM).toBe('listitem');
    expect(ACCESSIBILITY_ROLES.GRID).toBe('grid');
    expect(ACCESSIBILITY_ROLES.GRIDCELL).toBe('gridcell');
    expect(ACCESSIBILITY_ROLES.MENU).toBe('menu');
    expect(ACCESSIBILITY_ROLES.MENUITEM).toBe('menuitem');
  });

  it('should have correct accessibility actions', () => {
    expect(ACCESSIBILITY_ACTIONS.ACTIVATE).toBe('activate');
    expect(ACCESSIBILITY_ACTIONS.LONGPRESS).toBe('longpress');
    expect(ACCESSIBILITY_ACTIONS.ESCAPE).toBe('escape');
    expect(ACCESSIBILITY_ACTIONS.MAGIC_TAP).toBe('magicTap');
    expect(ACCESSIBILITY_ACTIONS.INCREMENT).toBe('increment');
    expect(ACCESSIBILITY_ACTIONS.DECREMENT).toBe('decrement');
  });
});

describe('Accessibility Helper Functions', () => {
  const { createA11yLabel, createA11yHint, createA11yState } = require('@/lib/accessibility');

  it('should create accessibility label with context', () => {
    const label = createA11yLabel('Button', 'Click to submit');

    expect(label).toBe('Button, Click to submit');
  });

  it('should create accessibility label without context', () => {
    const label = createA11yLabel('Button');

    expect(label).toBe('Button');
  });

  it('should create accessibility hint with result', () => {
    const hint = createA11yHint('Double tap to activate', 'Submits the form');

    expect(hint).toBe('Double tap to activate. Submits the form');
  });

  it('should create accessibility hint without result', () => {
    const hint = createA11yHint('Double tap to activate');

    expect(hint).toBe('Double tap to activate');
  });

  it('should create accessibility state with all properties', () => {
    const state = createA11yState(true, false, true, 'mixed', false);

    expect(state).toEqual({
      selected: true,
      disabled: false,
      busy: true,
      checked: 'mixed',
      expanded: false,
    });
  });

  it('should create accessibility state with some properties', () => {
    const state = createA11yState(true, true);

    expect(state).toEqual({
      selected: true,
      disabled: true,
    });
  });

  it('should create empty accessibility state', () => {
    const state = createA11yState();

    expect(state).toEqual({});
  });
});
