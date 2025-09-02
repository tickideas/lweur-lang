// src/__tests__/components/admin/checkout-settings.test.tsx
// Tests for checkout settings admin component - form validation, API integration, and user interactions
// Verifies currency management, amount settings, hero configuration, and error handling
// RELEVANT FILES: admin/checkout-settings/page.tsx, api/admin/checkout-settings/route.ts, utils/index.ts, admin-layout.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutSettingsPage from '@/app/admin/checkout-settings/page';

// Mock AdminLayout
jest.mock('@/components/admin/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>
}));

// Mock utils
jest.mock('@/utils', () => ({
  formatCurrency: jest.fn((amount: number, currency: string) => {
    return `${currency === 'GBP' ? '£' : '$'}${(amount / 100).toFixed(2)}`;
  }),
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockValidSettings = {
  availableCurrencies: ['GBP', 'EUR', 'USD'],
  defaultCurrency: 'GBP',
  adoptLanguageDefaultAmount: 15000,
  adoptLanguagePresetAmounts: [5000, 10000, 15000, 25000],
  adoptLanguageMinAmount: 1000,
  adoptLanguageMaxAmount: 100000,
  sponsorTranslationDefaultAmount: 15000,
  sponsorTranslationPresetAmounts: [5000, 10000, 15000, 25000],
  sponsorTranslationMinAmount: 1000,
  sponsorTranslationMaxAmount: 100000,
  showOneTimeOption: false,
  requirePhone: false,
  requireOrganization: false,
  hearFromUsOptions: ['Search Engine', 'Social Media', 'Friend/Family', 'Church', 'Advertisement', 'Email', 'Other'],
  checkoutTitle: 'Your generosity is transforming lives!',
  checkoutSubtitle: 'Support Loveworld Europe\'s mission to reach every European language with the Gospel',
  heroEnabled: true,
  heroTitle: "YOU'RE A\nWORLD\nCHANGER",
  heroSubtitle: "Your generosity is transforming lives across Europe",
  heroBackgroundColor: "from-[#1226AA] to-blue-800",
  heroTextColor: "text-white"
};

describe('CheckoutSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Initial Loading', () => {
    test('renders loading state initially', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<CheckoutSettingsPage />);
      
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    test('loads and displays existing settings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });

      // Check currency checkboxes are properly set
      expect(screen.getByRole('checkbox', { name: /British Pound/ })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /Euro/ })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /US Dollar/ })).toBeChecked();

      // Check form values are loaded
      expect(screen.getByDisplayValue('Your generosity is transforming lives!')).toBeInTheDocument();
      expect(screen.getByDisplayValue('from-[#1226AA] to-blue-800')).toBeInTheDocument();
    });

    test('handles API error during loading', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<CheckoutSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
      });
    });
  });

  describe('Currency Management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });
    });

    test('allows toggling currency options', async () => {
      const user = userEvent.setup();
      const eurCheckbox = screen.getByRole('checkbox', { name: /Euro/ });
      
      expect(eurCheckbox).toBeChecked();
      
      await user.click(eurCheckbox);
      
      expect(eurCheckbox).not.toBeChecked();
    });

    test('prevents removing all currencies', async () => {
      const user = userEvent.setup();
      
      // Try to uncheck all currencies
      await user.click(screen.getByRole('checkbox', { name: /Euro/ }));
      await user.click(screen.getByRole('checkbox', { name: /US Dollar/ }));
      
      // Should not be able to uncheck the last currency (GBP)
      const gbpCheckbox = screen.getByRole('checkbox', { name: /British Pound/ });
      await user.click(gbpCheckbox);
      
      // GBP should still be checked
      expect(gbpCheckbox).toBeChecked();
    });

    test('updates default currency when current default is removed', async () => {
      const user = userEvent.setup();
      
      // Remove GBP (the current default)
      await user.click(screen.getByRole('checkbox', { name: /British Pound/ }));
      
      // Default currency select should update to one of the remaining currencies
      const defaultCurrencySelect = screen.getByRole('combobox');
      expect(defaultCurrencySelect).not.toHaveValue('GBP');
    });
  });

  describe('Amount Configuration', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });
    });

    test('allows editing default amounts', async () => {
      const user = userEvent.setup();
      const defaultAmountInput = screen.getByLabelText(/Default Amount.*Adopt Language/);
      
      await user.clear(defaultAmountInput);
      await user.type(defaultAmountInput, '20000');
      
      expect(defaultAmountInput).toHaveValue(20000);
    });

    test('displays currency formatting for amounts', async () => {
      // The formatCurrency function should be called and display proper formatting
      expect(screen.getByText('£150.00')).toBeInTheDocument();
    });

    test('allows adding preset amounts', async () => {
      const user = userEvent.setup();
      const addAmountButton = screen.getAllByText('Add Amount')[0]; // First Add Amount button
      
      await user.click(addAmountButton);
      
      // Should have one more preset amount field
      const presetInputs = screen.getAllByRole('spinbutton').filter(
        input => input.getAttribute('name')?.includes('adoptLanguagePresetAmounts')
      );
      expect(presetInputs.length).toBeGreaterThan(4); // Should have more than the default 4
    });

    test('allows removing preset amounts', async () => {
      const user = userEvent.setup();
      const removeButtons = screen.getAllByLabelText(/Remove/);
      const initialCount = removeButtons.length;
      
      // Click the first remove button (should be for preset amounts)
      await user.click(removeButtons[0]);
      
      // Should have one fewer remove button
      await waitFor(() => {
        expect(screen.getAllByLabelText(/Remove/).length).toBe(initialCount - 1);
      });
    });

    test('prevents removing the last preset amount', async () => {
      const user = userEvent.setup();
      
      // Remove all but one preset amount
      const removeButtons = screen.getAllByLabelText(/Remove/);
      for (let i = 0; i < removeButtons.length - 1; i++) {
        await user.click(removeButtons[i]);
      }
      
      // Try to remove the last one
      const lastRemoveButton = screen.getByLabelText(/Remove/);
      expect(lastRemoveButton).toBeDisabled();
    });
  });

  describe('Hero Section Configuration', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });
    });

    test('shows hero section when enabled', async () => {
      expect(screen.getByText('Enable Hero Section')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /Hero Title/ })).toBeInTheDocument();
    });

    test('hides hero section configuration when disabled', async () => {
      const user = userEvent.setup();
      const heroToggle = screen.getByRole('checkbox', { name: /Enable Hero Section/ });
      
      await user.click(heroToggle);
      
      await waitFor(() => {
        expect(screen.queryByRole('textbox', { name: /Hero Title/ })).not.toBeInTheDocument();
      });
    });

    test('updates hero preview in real-time', async () => {
      const user = userEvent.setup();
      const heroTitleInput = screen.getByRole('textbox', { name: /Hero Title/ });
      
      await user.clear(heroTitleInput);
      await user.type(heroTitleInput, 'NEW HERO TITLE');
      
      // Preview should update
      expect(screen.getByText('NEW HERO TITLE')).toBeInTheDocument();
    });

    test('handles multiline hero titles correctly', async () => {
      const user = userEvent.setup();
      const heroTitleInput = screen.getByRole('textbox', { name: /Hero Title/ });
      
      await user.clear(heroTitleInput);
      await user.type(heroTitleInput, 'LINE ONE\\nLINE TWO');
      
      // Should display both lines in preview
      expect(screen.getByText(/LINE ONE/)).toBeInTheDocument();
      expect(screen.getByText(/LINE TWO/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });
    });

    test('shows validation errors for required fields', async () => {
      const user = userEvent.setup();
      const titleInput = screen.getByRole('textbox', { name: /Checkout Page Title/ });
      
      await user.clear(titleInput);
      await user.tab(); // Trigger blur to show validation
      
      await waitFor(() => {
        expect(screen.getByText(/Title is required/)).toBeInTheDocument();
      });
    });

    test('validates minimum amounts', async () => {
      const user = userEvent.setup();
      const minAmountInput = screen.getByLabelText(/Minimum Amount.*Adopt Language/);
      
      await user.clear(minAmountInput);
      await user.type(minAmountInput, '50'); // Below minimum
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/Minimum £1/)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });
    });

    test('saves settings successfully', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Settings saved successfully'
        })
      });

      const saveButton = screen.getByRole('button', { name: /Save.*Settings/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/checkout-settings',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"heroEnabled"')
        })
      );
    });

    test('handles save errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const saveButton = screen.getByRole('button', { name: /Save.*Settings/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
      });
    });

    test('shows loading state during save', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100);
      }));

      const saveButton = screen.getByRole('button', { name: /Save.*Settings/ });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    test('refreshes settings when refresh button is clicked', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: { ...mockValidSettings, checkoutTitle: 'Refreshed Title' },
          isDefault: false
        })
      });

      const refreshButton = screen.getByRole('button', { name: /Refresh/ });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Refreshed Title')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });
    });

    test('has proper form labels', () => {
      expect(screen.getByLabelText(/Default Currency/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Checkout Page Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hero Title/)).toBeInTheDocument();
    });

    test('has proper ARIA attributes', () => {
      const heroIcon = screen.getByLabelText('Hero section settings');
      expect(heroIcon).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      // Should be able to tab through form elements
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
      
      // Continue tabbing
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Dynamic Field Arrays', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: mockValidSettings,
          isDefault: false
        })
      });

      render(<CheckoutSettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Checkout Settings')).toBeInTheDocument();
      });
    });

    test('manages hear from us options correctly', async () => {
      const user = userEvent.setup();
      
      // Add a new option
      const addOptionButton = screen.getByRole('button', { name: /Add Option/ });
      await user.click(addOptionButton);
      
      // Should have a new input field
      const optionInputs = screen.getAllByRole('textbox').filter(
        input => input.getAttribute('name')?.includes('hearFromUsOptions')
      );
      expect(optionInputs.length).toBeGreaterThan(7); // More than default 7
      
      // Type in the new option
      const newInput = optionInputs[optionInputs.length - 1];
      await user.type(newInput, 'New Option');
      expect(newInput).toHaveValue('New Option');
    });
  });
});