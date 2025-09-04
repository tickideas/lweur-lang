// src/__tests__/components/checkout/amount-selection.test.tsx
// Tests for AmountSelection component functionality and user interactions
// Verifies preset amounts, custom amounts, currency selection, and validation
// RELEVANT FILES: amount-selection.tsx, checkout-wizard.tsx, utils/index.ts, jest.setup.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AmountSelection } from '@/components/checkout/amount-selection';
import { CampaignType } from '@/types';

// Mock utils functions
jest.mock('@/utils', () => ({
  formatCurrency: (amount: number, currency: string = 'GBP') => {
    const formatted = (amount / 100).toFixed(2);
    const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${formatted}`;
  },
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockSettings = {
  id: 'test-settings',
  availableCurrencies: ['GBP', 'EUR', 'USD'],
  defaultCurrency: 'GBP',
  adoptLanguageDefaultAmount: 15000,
  adoptLanguagePresetAmounts: [2000, 3500, 5000, 15000],
  adoptLanguageMinAmount: 1000,
  adoptLanguageMaxAmount: 100000,
  sponsorTranslationDefaultAmount: 15000,
  sponsorTranslationPresetAmounts: [2000, 3500, 5000, 15000],
  sponsorTranslationMinAmount: 1000,
  sponsorTranslationMaxAmount: 100000,
  showOneTimeOption: true,
  requirePhone: false,
  requireOrganization: false,
  hearFromUsOptions: ['Search Engine', 'Social Media'],
  checkoutTitle: 'Test Title',
  checkoutSubtitle: 'Test Subtitle',
};

const mockOnAmountSelect = jest.fn();

describe('AmountSelection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, settings: mockSettings })
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      expect(screen.getByText('Loading checkout options...')).toBeInTheDocument();
    });

    test('renders campaign info for Adopt Language', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Adopt a Language Channel')).toBeInTheDocument();
      });
    });

    test('renders campaign info for Sponsor Translation', async () => {
      render(
        <AmountSelection
          campaignType="SPONSOR_TRANSLATION"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sponsor Live Translation')).toBeInTheDocument();
      });
    });

    test('renders preset amount buttons', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('£20.00')).toBeInTheDocument();
        expect(screen.getByText('£35.00')).toBeInTheDocument();
        expect(screen.getByText('£50.00')).toBeInTheDocument();
        expect(screen.getByText('£150.00')).toBeInTheDocument();
      });
    });
  });

  describe('Amount Selection', () => {
    test('selects preset amount correctly', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        const presetButton = screen.getByText('£35.00');
        fireEvent.click(presetButton);
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockOnAmountSelect).toHaveBeenCalledWith(3500, 'GBP', true);
    });

    test('allows custom amount input', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        const customInput = screen.getByLabelText('Any Amount');
        fireEvent.change(customInput, { target: { value: '75' } });
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockOnAmountSelect).toHaveBeenCalledWith(7500, 'GBP', true);
    });

    test('validates minimum amount', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        const customInput = screen.getByLabelText('Any Amount');
        fireEvent.change(customInput, { target: { value: '5' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Please enter an amount between/)).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('validates maximum amount', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        const customInput = screen.getByLabelText('Any Amount');
        fireEvent.change(customInput, { target: { value: '2000' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Please enter an amount between/)).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Currency Selection', () => {
    test('shows currency selector when multiple currencies available', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Currency')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    test('changes currency selection', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        const currencySelect = screen.getByRole('combobox');
        fireEvent.change(currencySelect, { target: { value: 'EUR' } });
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockOnAmountSelect).toHaveBeenCalledWith(15000, 'EUR', true);
    });
  });

  describe('API Integration', () => {
    test('fetches settings from API on mount', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/checkout-settings');
      });
    });

    test('handles API error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        // Should still render with default settings
        expect(screen.getByText('Adopt a Language Channel')).toBeInTheDocument();
      });
    });

    test('uses provided settings prop instead of fetching', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
          settings={mockSettings}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Adopt a Language Channel')).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Campaign Type Differences', () => {
    test('uses correct amounts for Adopt Language campaign', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
          settings={mockSettings}
        />
      );

      await waitFor(() => {
        const presetButtons = screen.getAllByRole('button');
        const amountButtons = presetButtons.filter(btn => 
          btn.textContent?.includes('£') && btn.textContent !== 'Next'
        );
        expect(amountButtons).toHaveLength(4);
      });
    });

    test('uses correct amounts for Sponsor Translation campaign', async () => {
      render(
        <AmountSelection
          campaignType="SPONSOR_TRANSLATION"
          onAmountSelect={mockOnAmountSelect}
          settings={mockSettings}
        />
      );

      await waitFor(() => {
        const presetButtons = screen.getAllByRole('button');
        const amountButtons = presetButtons.filter(btn => 
          btn.textContent?.includes('£') && btn.textContent !== 'Next'
        );
        expect(amountButtons).toHaveLength(4);
      });
    });
  });

  describe('User Experience', () => {
    test('shows impact message', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Put your hope into action!')).toBeInTheDocument();
      });
    });

    test('displays correct monthly donation message', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Your monthly donation will directly support/)).toBeInTheDocument();
      });
    });

    test('shows currency symbol in custom amount input', async () => {
      render(
        <AmountSelection
          campaignType="ADOPT_LANGUAGE"
          onAmountSelect={mockOnAmountSelect}
          settings={mockSettings}
        />
      );

      await waitFor(() => {
        const inputContainer = screen.getByLabelText('Any Amount').parentElement;
        expect(inputContainer).toHaveTextContent('£');
      });
    });
  });
});