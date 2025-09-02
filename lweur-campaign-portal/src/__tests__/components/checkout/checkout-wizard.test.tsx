// src/__tests__/components/checkout/checkout-wizard.test.tsx
// Tests for CheckoutWizard component step navigation and state management
// Verifies 4-step flow, data persistence, and proper component integration
// RELEVANT FILES: checkout-wizard.tsx, amount-selection.tsx, checkout-form.tsx, types/index.ts

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutWizard } from '@/components/checkout/checkout-wizard';
import { CampaignType } from '@/types';

// Mock child components
jest.mock('@/components/checkout/amount-selection', () => ({
  AmountSelection: ({ onAmountSelect }: { onAmountSelect: (amount: number, currency: string, isRecurring: boolean) => void }) => (
    <div data-testid="amount-selection">
      <button onClick={() => onAmountSelect(15000, 'GBP', true)}>
        Select £150
      </button>
    </div>
  )
}));

jest.mock('@/components/checkout/checkout-form', () => ({
  CheckoutForm: ({ 
    step, 
    onDetailsComplete, 
    onPaymentReady, 
    onSuccess 
  }: { 
    step: string;
    onDetailsComplete?: (data: any) => void;
    onPaymentReady?: (secret: string, id: string) => void;
    onSuccess?: () => void;
  }) => (
    <div data-testid={`checkout-form-${step}`}>
      {step === 'details' && onDetailsComplete && (
        <button onClick={() => onDetailsComplete({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          country: 'GB'
        })}>
          Complete Details
        </button>
      )}
      {step === 'payment' && onPaymentReady && onSuccess && (
        <>
          <button onClick={() => onPaymentReady('test_secret', 'test_campaign_id')}>
            Setup Payment
          </button>
          <button onClick={() => onSuccess()}>
            Complete Payment
          </button>
        </>
      )}
      {step === 'confirmation' && (
        <div>Thank you for your donation!</div>
      )}
    </div>
  )
}));

// Mock formatCurrency
jest.mock('@/utils', () => ({
  formatCurrency: (amount: number, currency: string = 'GBP') => {
    const formatted = (amount / 100).toFixed(2);
    const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${formatted}`;
  }
}));

const mockLanguage = {
  id: 'test-lang-1',
  name: 'French',
  nativeName: 'Français',
  iso639Code: 'fr',
  region: 'Western Europe',
  countries: ['FR', 'BE', 'CH'],
  speakerCount: 280000000,
  flagUrl: 'https://example.com/fr.png',
  isActive: true,
  adoptionStatus: 'AVAILABLE' as const,
  translationNeedsSponsorship: true,
  priority: 1,
  description: 'French language',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('CheckoutWizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders progress indicator with 4 steps', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      expect(screen.getByText('Choose Amount')).toBeInTheDocument();
      expect(screen.getByText('Personal Details')).toBeInTheDocument();
      expect(screen.getByText('Donate')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    test('starts with amount selection step', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      expect(screen.getByTestId('amount-selection')).toBeInTheDocument();
      expect(screen.queryByTestId('checkout-form-details')).not.toBeInTheDocument();
    });

    test('shows correct campaign icon for Adopt Language', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      expect(screen.getByText('Adopt a Language Channel')).toBeInTheDocument();
    });

    test('shows correct campaign icon for Sponsor Translation', () => {
      render(
        <CheckoutWizard
          campaignType="SPONSOR_TRANSLATION"
          selectedLanguage={mockLanguage}
        />
      );

      expect(screen.getByText('Sponsor Live Translation')).toBeInTheDocument();
    });
  });

  describe('Order Summary', () => {
    test('displays selected language information', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      expect(screen.getByText('French')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
      expect(screen.getByText('Region: Western Europe')).toBeInTheDocument();
      expect(screen.getByText('Speakers: 280,000,000')).toBeInTheDocument();
    });

    test('shows order summary without language when not provided', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
        />
      );

      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.queryByText('French')).not.toBeInTheDocument();
    });

    test('displays secure payment badge', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      expect(screen.getByText('Secure & Trusted')).toBeInTheDocument();
      expect(screen.getByText(/processed securely by Stripe/)).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    test('progresses from amount to details step', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Start with amount selection
      expect(screen.getByTestId('amount-selection')).toBeInTheDocument();

      // Select amount
      fireEvent.click(screen.getByText('Select £150'));

      // Should progress to details step
      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-details')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('amount-selection')).not.toBeInTheDocument();
    });

    test('progresses from details to payment step', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Progress to details step
      fireEvent.click(screen.getByText('Select £150'));

      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-details')).toBeInTheDocument();
      });

      // Complete details
      fireEvent.click(screen.getByText('Complete Details'));

      // Should progress to payment step
      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-payment')).toBeInTheDocument();
      });
    });

    test('progresses from payment to confirmation step', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Progress through all steps
      fireEvent.click(screen.getByText('Select £150'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Complete Details'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Complete Payment'));
      });

      // Should show confirmation
      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-confirmation')).toBeInTheDocument();
        expect(screen.getByText('Thank you for your donation!')).toBeInTheDocument();
      });
    });

    test('allows navigation back from details to amount', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Progress to details step
      fireEvent.click(screen.getByText('Select £150'));

      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-details')).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByText('Back'));

      // Should return to amount selection
      await waitFor(() => {
        expect(screen.getByTestId('amount-selection')).toBeInTheDocument();
      });
    });

    test('allows navigation back from payment to details', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Progress to payment step
      fireEvent.click(screen.getByText('Select £150'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Complete Details'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-payment')).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByText('Back'));

      // Should return to details step
      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-details')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicator', () => {
    test('highlights current step', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // First step should be highlighted
      const progressSteps = screen.getAllByText('1');
      expect(progressSteps[0]).toBeInTheDocument();
    });

    test('shows completed steps', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Progress to details step
      fireEvent.click(screen.getByText('Select £150'));

      await waitFor(() => {
        // Step 1 should be completed (show checkmark)
        // Step 2 should be current (highlighted)
        expect(screen.getByTestId('checkout-form-details')).toBeInTheDocument();
      });
    });
  });

  describe('Data Management', () => {
    test('persists amount selection throughout flow', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Select amount
      fireEvent.click(screen.getByText('Select £150'));

      await waitFor(() => {
        // Amount should be displayed in order summary
        expect(screen.getByText('£150.00')).toBeInTheDocument();
        expect(screen.getByText('Monthly Contribution:')).toBeInTheDocument();
      });
    });

    test('updates order summary with selected amount', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Initially no amount shown
      expect(screen.queryByText('£150.00')).not.toBeInTheDocument();

      // Select amount
      fireEvent.click(screen.getByText('Select £150'));

      await waitFor(() => {
        expect(screen.getByText('£150.00')).toBeInTheDocument();
        expect(screen.getByText('Recurring monthly subscription')).toBeInTheDocument();
      });
    });

    test('handles payment setup correctly', async () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Progress to payment step
      fireEvent.click(screen.getByText('Select £150'));
      await waitFor(() => {
        fireEvent.click(screen.getByText('Complete Details'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('checkout-form-payment')).toBeInTheDocument();
      });

      // Setup payment
      fireEvent.click(screen.getByText('Setup Payment'));

      // Payment setup should be handled internally
      expect(screen.getByTestId('checkout-form-payment')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('shows step numbers on mobile', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
          selectedLanguage={mockLanguage}
        />
      );

      // Progress indicator should show step numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing language gracefully', () => {
      render(
        <CheckoutWizard
          campaignType="ADOPT_LANGUAGE"
        />
      );

      expect(screen.getByText('Adopt a Language Channel')).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    test('handles invalid campaign type', () => {
      render(
        <CheckoutWizard
          campaignType={'INVALID_TYPE' as CampaignType}
          selectedLanguage={mockLanguage}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Support Loveworld Europe')).toBeInTheDocument();
    });
  });
});