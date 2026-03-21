import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AccessibleButton } from '@/components/AccessibleComponents';
import { ThemeProvider } from '@/context/ThemeContext';

// Test utilities
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('AccessibleButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with title', () => {
    const { getByText } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Test Button');
  });

  it('calls onPress when pressed', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} disabled={true} />
    );

    const button = getByRole('button');
    expect(button.props.disabled).toBe(true);
  });

  it('does not call onPress when disabled', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} disabled={true} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with icon when provided', () => {
    const { getByTestId } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} icon="home" />
    );

    // Note: Icon testing would require mocking Ionicons properly
    expect(getByTestId('accessible-button')).toBeTruthy();
  });

  it('applies correct variant styles', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} variant="outline" />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    // Style testing would require more specific assertions
  });

  it('applies correct size styles', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton title="Test Button" onPress={mockOnPress} size="lg" />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    // Style testing would require more specific assertions
  });

  it('uses custom accessibility label when provided', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton 
        title="Test Button" 
        onPress={mockOnPress} 
        accessibilityLabel="Custom Label"
      />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Custom Label');
  });

  it('uses custom accessibility hint when provided', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleButton 
        title="Test Button" 
        onPress={mockOnPress} 
        accessibilityHint="Custom hint"
      />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityHint).toBe('Custom hint');
  });
});

describe('AccessibleInput', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    mockOnChangeText.mockClear();
  });

  it('renders correctly with label', () => {
    const { getByText } = renderWithTheme(
      <AccessibleInput 
        label="Test Input" 
        value="" 
        onChangeText={mockOnChangeText} 
      />
    );

    expect(getByText('Test Input')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleInput 
        label="Test Input" 
        value="" 
        onChangeText={mockOnChangeText} 
      />
    );

    const input = getByRole('textbox');
    expect(input).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleInput 
        label="Test Input" 
        value="" 
        onChangeText={mockOnChangeText} 
      />
    );

    const input = getByRole('textbox');
    fireEvent.changeText(input, 'test text');

    expect(mockOnChangeText).toHaveBeenCalledWith('test text');
  });

  it('displays error message when provided', () => {
    const { getByText } = renderWithTheme(
      <AccessibleInput 
        label="Test Input" 
        value="" 
        onChangeText={mockOnChangeText} 
        error="Error message"
      />
    );

    expect(getByText('Error message')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleInput 
        label="Test Input" 
        value="" 
        onChangeText={mockOnChangeText} 
        disabled={true}
      />
    );

    const input = getByRole('textbox');
    expect(input.props.editable).toBe(false);
  });

  it('uses secure text entry when specified', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleInput 
        label="Password Input" 
        value="" 
        onChangeText={mockOnChangeText} 
        secureTextEntry={true}
      />
    );

    const input = getByRole('textbox');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('uses custom accessibility label when provided', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleInput 
        label="Test Input" 
        value="" 
        onChangeText={mockOnChangeText} 
        accessibilityLabel="Custom Label"
      />
    );

    const input = getByRole('textbox');
    expect(input.props.accessibilityLabel).toBe('Custom Label');
  });

  it('uses placeholder when provided', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <AccessibleInput 
        label="Test Input" 
        value="" 
        onChangeText={mockOnChangeText} 
        placeholder="Enter text here"
      />
    );

    const input = getByPlaceholderText('Enter text here');
    expect(input).toBeTruthy();
  });
});

describe('AccessibleCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with title', () => {
    const { getByText } = renderWithTheme(
      <AccessibleCard title="Test Card" />
    );

    expect(getByText('Test Card')).toBeTruthy();
  });

  it('renders with subtitle when provided', () => {
    const { getByText } = renderWithTheme(
      <AccessibleCard title="Test Card" subtitle="Subtitle" />
    );

    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Subtitle')).toBeTruthy();
  });

  it('renders with description when provided', () => {
    const { getByText } = renderWithTheme(
      <AccessibleCard title="Test Card" description="Description text" />
    );

    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Description text')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleCard title="Test Card" onPress={mockOnPress} />
    );

    const card = getByRole('button');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleCard title="Test Card" onPress={mockOnPress} />
    );

    const card = getByRole('button');
    expect(card).toBeTruthy();
    expect(card.props.accessibilityLabel).toBe('Test Card');
  });

  it('displays badge when provided', () => {
    const { getByText } = renderWithTheme(
      <AccessibleCard title="Test Card" badge="New" />
    );

    expect(getByText('New')).toBeTruthy();
  });

  it('does not have button role when onPress is not provided', () => {
    const { queryByRole } = renderWithTheme(
      <AccessibleCard title="Test Card" />
    );

    const button = queryByRole('button');
    expect(button).toBeFalsy();
  });

  it('uses custom accessibility label when provided', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleCard 
        title="Test Card" 
        onPress={mockOnPress} 
        accessibilityLabel="Custom Label"
      />
    );

    const card = getByRole('button');
    expect(card.props.accessibilityLabel).toBe('Custom Label');
  });
});

describe('AccessibleListItem', () => {
  const mockOnPress = jest.fn();
  const mockItem = { id: '1', name: 'Test Item' };

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders correctly with item', () => {
    const { getByText } = renderWithTheme(
      <AccessibleListItem
        item={mockItem}
        index={0}
        onPress={mockOnPress}
        renderTitle={(item) => item.name}
      />
    );

    expect(getByText('Test Item')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleListItem
        item={mockItem}
        index={0}
        onPress={mockOnPress}
        renderTitle={(item) => item.name}
      />
    );

    const listItem = getByRole('listitem');
    fireEvent.press(listItem);

    expect(mockOnPress).toHaveBeenCalledWith(mockItem);
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleListItem
        item={mockItem}
        index={0}
        onPress={mockOnPress}
        renderTitle={(item) => item.name}
      />
    );

    const listItem = getByRole('listitem');
    expect(listItem).toBeTruthy();
    expect(listItem.props.accessibilityLabel).toBe('Test Item');
  });

  it('renders with subtitle when provided', () => {
    const { getByText } = renderWithTheme(
      <AccessibleListItem
        item={mockItem}
        index={0}
        onPress={mockOnPress}
        renderTitle={(item) => item.name}
        renderSubtitle={(item) => `Subtitle for ${item.name}`}
      />
    );

    expect(getByText('Test Item')).toBeTruthy();
    expect(getByText('Subtitle for Test Item')).toBeTruthy();
  });

  it('renders with description when provided', () => {
    const { getByText } = renderWithTheme(
      <AccessibleListItem
        item={mockItem}
        index={0}
        onPress={mockOnPress}
        renderTitle={(item) => item.name}
        renderDescription={(item) => `Description for ${item.name}`}
      />
    );

    expect(getByText('Test Item')).toBeTruthy();
    expect(getByText('Description for Test Item')).toBeTruthy();
  });

  it('uses custom accessibility label when provided', () => {
    const { getByRole } = renderWithTheme(
      <AccessibleListItem
        item={mockItem}
        index={0}
        onPress={mockOnPress}
        renderTitle={(item) => item.name}
        accessibilityLabel={() => 'Custom Label'}
      />
    );

    const listItem = getByRole('listitem');
    expect(listItem.props.accessibilityLabel).toBe('Custom Label');
  });
});
