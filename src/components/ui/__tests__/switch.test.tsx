import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '../switch';

describe('Switch Component', () => {
  it('renders without crashing', () => {
    render(<Switch />);
  });

  it('calls onCheckedChange when clicked', () => {
    const handleChange = jest.fn();
    render(<Switch onCheckedChange={handleChange} />);

    const switchElement = screen.getByRole('checkbox');
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onCheckedChange with false when unchecking', () => {
    const handleChange = jest.fn();
    render(<Switch checked onCheckedChange={handleChange} />);

    const switchElement = screen.getByRole('checkbox');
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('respects checked prop', () => {
    const { rerender } = render(<Switch checked={false} />);
    let switchElement = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchElement.checked).toBe(false);

    rerender(<Switch checked={true} />);
    switchElement = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchElement.checked).toBe(true);
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Switch ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('does not throw console warning for onCheckedChange', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const handleChange = jest.fn();

    render(<Switch onCheckedChange={handleChange} />);

    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Unknown event handler property')
    );

    consoleSpy.mockRestore();
  });
});
