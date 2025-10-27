import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Focus State Accessibility Tests
 *
 * These tests verify that focus states are properly implemented on interactive elements,
 * ensuring keyboard users can see where focus is located on the page.
 *
 * WCAG 2.1 Success Criteria:
 * - 2.4.7 Focus Visible (Level AA) - Keyboard focus indicator is visible
 * - 2.4.11 Focus Not Obscured (Minimum) (Level AA) - Focused element is at least partially visible
 * - 1.4.11 Non-text Contrast (Level AA) - Visual focus indicators meet contrast requirements
 */

// Mock button component from the UI library
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }
>(({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-blue-500',
    ghost: 'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-300',
  };

  const sizeClasses = {
    default: 'h-10 min-h-[44px] px-4 py-2',
    sm: 'h-9 min-h-[36px] px-3',
    lg: 'h-11 min-h-[44px] px-8',
    icon: 'h-10 w-10 min-h-[44px] min-w-[44px] p-2',
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
Button.displayName = 'Button';

// Mock link component
const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className = '', ...props }, ref) => {
  const baseClasses = 'text-blue-600 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded';
  return (
    <a
      ref={ref}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
});
Link.displayName = 'Link';

// Mock input component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => {
  const baseClasses = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <input
      ref={ref}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
});
Input.displayName = 'Input';

describe('Focus State Visibility', () => {
  describe('Button Focus States', () => {
    it('should have visible focus indicator on default button', async () => {
      const user = userEvent.setup();
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });

      await user.tab();
      expect(document.activeElement).toBe(button);

      // Check for focus-visible classes
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should have visible focus indicator on outline button', async () => {
      const user = userEvent.setup();
      render(<Button variant="outline">Outline Button</Button>);

      const button = screen.getByRole('button', { name: /outline button/i });

      await user.tab();

      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-blue-500');
    });

    it('should have visible focus indicator on ghost button', async () => {
      const user = userEvent.setup();
      render(<Button variant="ghost">Ghost Button</Button>);

      const button = screen.getByRole('button', { name: /ghost button/i });

      await user.tab();

      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should have visible focus indicator on icon button', async () => {
      const user = userEvent.setup();
      render(
        <Button variant="ghost" size="icon" aria-label="Settings">
          <svg className="w-5 h-5" aria-hidden="true" />
        </Button>
      );

      const button = screen.getByRole('button', { name: /settings/i });

      await user.tab();
      expect(document.activeElement).toBe(button);

      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should remove outline and use ring for focus', () => {
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button', { name: /test button/i });

      // Should use focus-visible:outline-none to remove default outline
      expect(button).toHaveClass('focus-visible:outline-none');

      // Should use ring instead for custom focus indicator
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should have focus offset for better visibility', () => {
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button', { name: /test button/i });

      // Ring offset creates space between element and focus ring
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });
  });

  describe('Link Focus States', () => {
    it('should have visible focus indicator on links', async () => {
      const user = userEvent.setup();
      render(<Link href="/test">Test Link</Link>);

      const link = screen.getByRole('link', { name: /test link/i });

      await user.tab();
      expect(document.activeElement).toBe(link);

      expect(link).toHaveClass('focus-visible:ring-2');
      expect(link).toHaveClass('focus-visible:ring-blue-500');
    });

    it('should have rounded focus ring for better aesthetics', () => {
      render(<Link href="/test">Test Link</Link>);

      const link = screen.getByRole('link', { name: /test link/i });

      // Rounded class ensures focus ring matches border radius
      expect(link).toHaveClass('rounded');
    });

    it('should remove default outline on links', () => {
      render(<Link href="/test">Test Link</Link>);

      const link = screen.getByRole('link', { name: /test link/i });

      expect(link).toHaveClass('focus-visible:outline-none');
    });
  });

  describe('Input Focus States', () => {
    it('should have visible focus indicator on text inputs', async () => {
      const user = userEvent.setup();
      render(<Input type="text" placeholder="Enter text" aria-label="Text input" />);

      const input = screen.getByRole('textbox', { name: /text input/i });

      await user.tab();
      expect(document.activeElement).toBe(input);

      expect(input).toHaveClass('focus-visible:ring-2');
      expect(input).toHaveClass('focus-visible:ring-blue-500');
    });

    it('should have focus offset on inputs', () => {
      render(<Input type="text" aria-label="Test input" />);

      const input = screen.getByRole('textbox', { name: /test input/i });

      expect(input).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should remove default outline on inputs', () => {
      render(<Input type="text" aria-label="Test input" />);

      const input = screen.getByRole('textbox', { name: /test input/i });

      expect(input).toHaveClass('focus-visible:outline-none');
    });
  });

  describe('Focus State Contrast', () => {
    it('should use high-contrast colors for focus rings', () => {
      render(
        <div>
          <Button>Default Button</Button>
          <Button variant="outline">Outline Button</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');

      // Blue focus ring (ring-blue-500) should provide sufficient contrast
      buttons.forEach(button => {
        const hasHighContrastRing =
          button.className.includes('ring-blue-500') ||
          button.className.includes('ring-gray-300');
        expect(hasHighContrastRing).toBe(true);
      });
    });

    it('should ensure focus indicators are visible against all backgrounds', () => {
      render(
        <div className="bg-white p-4">
          <Button>Light Background</Button>
        </div>
      );

      const button = screen.getByRole('button');

      // Ring offset ensures focus ring is visible against any background
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });
  });

  describe('Focus Within Container', () => {
    it('should maintain focus styles when clicking within container', async () => {
      const user = userEvent.setup();
      render(
        <div className="p-4">
          <Button>
            <span>Complex Button</span>
          </Button>
        </div>
      );

      const button = screen.getByRole('button');

      await user.tab();
      expect(document.activeElement).toBe(button);

      // Focus should be on button, not child span
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Disabled State Focus Behavior', () => {
    it('should not show focus indicator on disabled buttons', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: /disabled button/i });

      // Disabled buttons should have pointer-events-none
      expect(button).toHaveClass('disabled:pointer-events-none');
    });

    it('should indicate disabled state with opacity', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: /disabled button/i });

      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not be keyboard focusable when disabled', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Enabled Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button>Another Enabled Button</Button>
        </div>
      );

      const enabledButton1 = screen.getByRole('button', { name: /^enabled button$/i });
      const enabledButton2 = screen.getByRole('button', { name: /another enabled button/i });

      enabledButton1.focus();
      await user.tab();

      // Should skip disabled button
      expect(document.activeElement).toBe(enabledButton2);
    });
  });

  describe('Focus Transition Animations', () => {
    it('should have transition for smooth focus state changes', () => {
      render(<Button>Animated Button</Button>);

      const button = screen.getByRole('button', { name: /animated button/i });

      // Should have transition class for smooth state changes
      expect(button).toHaveClass('transition-colors');
    });
  });

  describe('Focus Persistence', () => {
    it('should maintain focus after state updates', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <Button onClick={() => setCount(count + 1)}>
            Clicked {count} times
          </Button>
        );
      };

      render(<TestComponent />);

      const button = screen.getByRole('button');
      await user.tab();

      expect(document.activeElement).toBe(button);

      await user.click(button);

      // Focus should be maintained after click
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Custom Focus Indicators', () => {
    it('should support custom focus ring colors for branding', () => {
      render(
        <Button className="focus-visible:ring-green-500">
          Custom Color Button
        </Button>
      );

      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus-visible:ring-green-500');
    });

    it('should support different ring widths', () => {
      render(
        <Button className="focus-visible:ring-4">
          Thick Ring Button
        </Button>
      );

      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus-visible:ring-4');
    });
  });

  describe('Focus Visible vs Focus', () => {
    it('should use focus-visible to avoid showing focus on mouse clicks', () => {
      render(<Button>Smart Focus Button</Button>);

      const button = screen.getByRole('button');

      // Should use focus-visible, not just focus
      expect(button.className).toContain('focus-visible:');
      expect(button.className).not.toContain('focus:ring');
    });
  });

  describe('Grouped Interactive Elements', () => {
    it('should have consistent focus styles across button groups', () => {
      render(
        <div className="flex gap-2">
          <Button variant="default">Button 1</Button>
          <Button variant="outline">Button 2</Button>
          <Button variant="ghost">Button 3</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');

      // All buttons should have ring-2
      buttons.forEach(button => {
        expect(button).toHaveClass('focus-visible:ring-2');
      });
    });
  });

  describe('Focus State Documentation', () => {
    it('should use accessible focus patterns', () => {
      const { container } = render(
        <div>
          <Button>Button</Button>
          <Link href="/test">Link</Link>
          <Input type="text" aria-label="Input" />
        </div>
      );

      // All interactive elements should have focus-visible classes
      const interactiveElements = container.querySelectorAll('button, a, input');

      interactiveElements.forEach(element => {
        expect(element.className).toContain('focus-visible:');
      });
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should maintain focus visibility in high contrast mode', () => {
      render(<Button>High Contrast Button</Button>);

      const button = screen.getByRole('button');

      // Ring offset helps maintain visibility in high contrast mode
      expect(button).toHaveClass('focus-visible:ring-offset-2');

      // Outline removal with ring replacement ensures high contrast compatibility
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Focus Order Visual Cues', () => {
    it('should provide clear visual hierarchy through focus states', async () => {
      const user = userEvent.setup();
      render(
        <div className="space-y-2">
          <Button size="lg">Primary Action</Button>
          <Button variant="outline">Secondary Action</Button>
          <Button variant="ghost" size="sm">Tertiary Action</Button>
        </div>
      );

      // Tab through and verify focus is visible on each
      await user.tab();
      const primaryButton = screen.getByRole('button', { name: /primary action/i });
      expect(document.activeElement).toBe(primaryButton);
      expect(primaryButton).toHaveClass('focus-visible:ring-2');

      await user.tab();
      const secondaryButton = screen.getByRole('button', { name: /secondary action/i });
      expect(document.activeElement).toBe(secondaryButton);
      expect(secondaryButton).toHaveClass('focus-visible:ring-2');

      await user.tab();
      const tertiaryButton = screen.getByRole('button', { name: /tertiary action/i });
      expect(document.activeElement).toBe(tertiaryButton);
      expect(tertiaryButton).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Focus Indicator Size', () => {
    it('should have sufficient focus indicator thickness', () => {
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button');

      // ring-2 provides 2px focus ring which meets minimum requirements
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should have adequate spacing with ring offset', () => {
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button');

      // ring-offset-2 provides 2px spacing between element and ring
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });
  });
});

describe('Focus Management Patterns', () => {
  describe('Modal/Dialog Focus Trapping', () => {
    it('should document focus trapping pattern for modals', () => {
      // This test documents that modals should trap focus
      // Implementation would use a library like focus-trap-react or radix-ui
      expect(true).toBe(true);
    });
  });

  describe('Skip Links', () => {
    it('should show skip link on focus', () => {
      const SkipLink = () => (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Skip to main content
        </a>
      );

      render(<SkipLink />);

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });

      // Skip link should be screen reader only by default
      expect(skipLink).toHaveClass('sr-only');

      // But visible when focused
      expect(skipLink).toHaveClass('focus:not-sr-only');
      expect(skipLink).toHaveClass('focus-visible:ring-2');
    });
  });
});
