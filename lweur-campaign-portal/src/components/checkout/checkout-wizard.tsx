// src/components/checkout/checkout-wizard.tsx
// Main checkout wizard component orchestrating the 4-step CBN Europe-style flow
// Manages step navigation, data collection, and payment processing with anti-bot protection
// RELEVANT FILES: amount-selection.tsx, checkout-form.tsx, checkout/page.tsx, src/lib/anti-bot.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AmountSelection } from './amount-selection';
import { PersonalDetailsForm } from './personal-details-form';
import { CheckoutForm } from './checkout-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  ArrowLeft,
  Check,
  Languages,
  Zap,
  Globe
} from 'lucide-react';
import { Language, CampaignType } from '@/types';
import { formatCurrency } from '@/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Anti-bot token state
interface SecurityToken {
  token: string;
  timestamp: number;
}

interface CheckoutWizardProps {
  campaignType: CampaignType;
  selectedLanguage?: Language | null;
}


interface CheckoutData {
  amount: number;
  currency: string;
  isRecurring: boolean;
  partnerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    organization?: string;
    country: string;
    preferredLanguage: string;
  };
  hearFromUs?: string;
}

type CheckoutStep = 'amount' | 'details' | 'payment' | 'confirmation';

const stepLabels = {
  amount: 'Choose Amount',
  details: 'Personal Details',
  payment: 'Donate',
  confirmation: 'Complete'
};

const stepNumbers = {
  amount: 1,
  details: 2,
  payment: 3,
  confirmation: 4
};

export function CheckoutWizard({ campaignType, selectedLanguage }: CheckoutWizardProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('amount');
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    amount: 0,
    currency: 'GBP',
    isRecurring: true
  });
  const [clientSecret, setClientSecret] = useState<string>('');
  const [campaignId, setCampaignId] = useState<string>('');
  const [securityToken, setSecurityToken] = useState<SecurityToken | null>(null);
  const [honeypot, setHoneypot] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch security token on component mount
  const fetchSecurityToken = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/token');
      if (response.ok) {
        const data = await response.json();
        setSecurityToken({ token: data.token, timestamp: data.timestamp });
      }
    } catch (err) {
      console.warn('Failed to fetch security token:', err);
    }
  }, []);

  useEffect(() => {
    fetchSecurityToken();
  }, [fetchSecurityToken]);


  const getCampaignIcon = () => {
    if (campaignType === 'ADOPT_LANGUAGE') {
      return <Languages className="h-5 w-5 text-[#1226AA]" />;
    } else if (campaignType === 'SPONSOR_TRANSLATION') {
      return <Zap className="h-5 w-5 text-[#FFBF06]" />;
    }
    return <Globe className="h-5 w-5 text-neutral-600" />;
  };

  const getCampaignTitle = () => {
    if (campaignType === 'ADOPT_LANGUAGE') {
      return 'Adopt a Language Channel';
    } else if (campaignType === 'SPONSOR_TRANSLATION') {
      return 'Sponsor Live Translation';
    }
    return 'Support Loveworld Europe';
  };

  const handleAmountSelect = (amount: number, currency: string, isRecurring: boolean) => {
    setCheckoutData(prev => ({
      ...prev,
      amount,
      currency,
      isRecurring
    }));
    setCurrentStep('details');
  };

  const handleDetailsComplete = async (partnerInfo: any) => {
    // Update checkout data with partner info
    const updatedData = {
      ...checkoutData,
      partnerInfo
    };
    setCheckoutData(updatedData);
    setError('');

    // Create payment intent
    if (!campaignType || !selectedLanguage) {
      console.error('Missing campaign type or language');
      return;
    }

    // Refresh security token if expired (older than 9 minutes)
    if (!securityToken || Date.now() - securityToken.timestamp > 9 * 60 * 1000) {
      await fetchSecurityToken();
    }

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignType,
          languageId: selectedLanguage.id,
          amount: updatedData.amount,
          currency: updatedData.currency,
          isRecurring: updatedData.isRecurring,
          partnerInfo,
          billingAddress: {
            line1: partnerInfo.street || 'Address to be collected',
            city: partnerInfo.city || 'City to be collected',
            postalCode: partnerInfo.postalCode || 'Postcode to be collected',
            country: partnerInfo.country,
          },
          // Anti-bot fields
          honeypot,
          token: securityToken?.token,
          timestamp: securityToken?.timestamp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          setError(result.error || 'Too many payment attempts. Please try again later.');
          return;
        }
        throw new Error(result.error || result.message || 'Failed to create payment');
      }

      handlePaymentReady(result.clientSecret, result.campaignId);
      setCurrentStep('payment');
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      setError(error.message);

      // Show a more user-friendly error if it's a configuration issue
      if (error.message && error.message.includes('Payment service not configured')) {
        setError('Payment service is not configured. Please check your Stripe configuration.');
        return;
      }
    }
  };

  const handlePaymentReady = (secret: string, id: string) => {
    setClientSecret(secret);
    setCampaignId(id);
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('confirmation');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'details':
        setCurrentStep('amount');
        break;
      case 'payment':
        setCurrentStep('details');
        break;
      default:
        break;
    }
  };

  const renderProgressIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-2 sm:space-x-8">
          {Object.entries(stepLabels).map(([step, label], index) => {
            const stepKey = step as CheckoutStep;
            const stepNum = stepNumbers[stepKey];
            const isCurrent = currentStep === stepKey;
            const isCompleted = stepNumbers[currentStep] > stepNum;
            const isActive = stepNumbers[currentStep] >= stepNum;

            return (
              <div key={step} className="flex items-center">
                {index > 0 && (
                  <div className={`hidden sm:block w-8 h-0.5 mr-2 sm:mr-4 ${
                    isCompleted ? 'bg-[#1226AA]' : 'bg-neutral-200'
                  }`} />
                )}
                <div className="flex flex-col items-center min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-[#1226AA] text-white'
                      : isCurrent
                      ? 'bg-[#1226AA] text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{stepNum}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs sm:text-sm font-medium text-center ${
                    isActive ? 'text-[#1226AA]' : 'text-neutral-500'
                  }`}>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{stepNum}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'amount':
        return (
          <AmountSelection
            campaignType={campaignType}
            onAmountSelect={handleAmountSelect}
          />
        );

      case 'details':
        return (
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>

            {/* Hidden honeypot field - bots will fill this */}
            <input
              type="text"
              name="website_url"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <PersonalDetailsForm onComplete={handleDetailsComplete} />
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
            
            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#1226AA',
                      colorBackground: '#ffffff',
                      colorText: '#333333',
                    },
                  },
                }}
              >
                <CheckoutForm
                  campaignType={campaignType}
                  selectedLanguage={selectedLanguage}
                  step="payment"
                  checkoutData={checkoutData}
                  clientSecret={clientSecret}
                  campaignId={campaignId}
                  onPaymentReady={handlePaymentReady}
                  onSuccess={handlePaymentSuccess}
                  onBack={handleBack}
                />
              </Elements>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1226AA] mx-auto mb-4"></div>
                <p className="text-neutral-600">Setting up secure payment...</p>
              </div>
            )}
          </div>
        );

      case 'confirmation':
        return (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: clientSecret || '',
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#1226AA',
                  colorBackground: '#ffffff',
                  colorText: '#333333',
                },
              },
            }}
          >
            <CheckoutForm
              campaignType={campaignType}
              selectedLanguage={selectedLanguage}
              step="confirmation"
              checkoutData={checkoutData}
            />
          </Elements>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {campaignType === 'GENERAL_DONATION' ? (
        // Full width layout for general donations
        <div className="max-w-2xl mx-auto">
          {renderStep()}
        </div>
      ) : (
        // Two-column layout with order summary for specific campaigns
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary - Left Column */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-8">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  {getCampaignIcon()}
                  <div>
                    <h3 className="font-semibold text-lg">{getCampaignTitle()}</h3>
                    <p className="text-sm text-neutral-600">Order Summary</p>
                  </div>
                </div>

                {selectedLanguage && (
                  <div className="border rounded-lg p-4 bg-neutral-50">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={selectedLanguage.flagUrl}
                        alt={`${selectedLanguage.name} flag`}
                        className="w-8 h-6 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <h4 className="font-semibold">{selectedLanguage.name}</h4>
                        <p className="text-sm text-neutral-500">{selectedLanguage.nativeName}</p>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-600 space-y-1">
                      <p>Region: {selectedLanguage.region}</p>
                      <p>Speakers: {selectedLanguage.speakerCount.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {checkoutData.amount > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {checkoutData.isRecurring ? 'Monthly' : 'One-time'} Contribution:
                      </span>
                      <span className="text-2xl font-bold text-[#1226AA]">
                        {formatCurrency(checkoutData.amount, checkoutData.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">
                      {checkoutData.isRecurring ? 'Recurring monthly subscription' : 'One-time donation'}
                    </p>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Secure & Trusted</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment is processed securely by Stripe with bank-level encryption.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Right Column */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {renderStep()}
          </div>
        </div>
      )}
    </div>
  );
}