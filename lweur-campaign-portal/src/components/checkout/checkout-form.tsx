'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Heart,
  Mail,
  User,
  Building,
  Phone,
  Globe,
  Check,
  CreditCard,
} from 'lucide-react';
import { Language, CampaignType } from '@/types';
import { EUROPEAN_COUNTRIES } from '@/utils';
import Link from 'next/link';

const partnerInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional(),
  organization: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  preferredLanguage: z.string().default('en'),
  marketingConsent: z.boolean().default(true),
  termsConsent: z.boolean().default(true),
});

type PartnerInfoForm = z.infer<typeof partnerInfoSchema>;

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

interface CheckoutFormProps {
  campaignType?: CampaignType;
  selectedLanguage?: Language | null;
  step?: 'details' | 'payment' | 'confirmation';
  campaignId?: string;
  checkoutData?: CheckoutData;
  clientSecret?: string;
  onDetailsComplete?: (partnerInfo: any) => void;
  onPaymentReady?: (clientSecret: string, campaignId: string) => void;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function CheckoutForm({
  campaignType,
  selectedLanguage,
  step = 'details',
  campaignId,
  checkoutData,
  clientSecret,
  onDetailsComplete,
  onPaymentReady,
  onSuccess,
  onBack,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerInfoForm>({
    resolver: zodResolver(partnerInfoSchema),
    defaultValues: {
      preferredLanguage: 'en',
      country: 'GB',
    },
  });

  const onSubmitDetails = async (data: PartnerInfoForm) => {
    if (step === 'details') {
      // For details step in wizard, just pass data back to wizard
      if (onDetailsComplete) {
        onDetailsComplete(data);
        return;
      }
    }

    if (!campaignType || !selectedLanguage || !checkoutData) {
      setError('Campaign type, language selection, and checkout data are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignType,
          languageId: selectedLanguage.id,
          amount: checkoutData.amount,
          currency: checkoutData.currency,
          isRecurring: checkoutData.isRecurring,
          partnerInfo: data,
          billingAddress: {
            country: data.country,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment');
      }

      onPaymentReady?.(result.clientSecret, result.campaignId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !campaignId) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?step=confirmation`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!paymentIntent || !paymentIntent.id) {
        throw new Error('Payment intent not found in confirmation result');
      }

      // Confirm payment on backend
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          paymentIntentId: paymentIntent.id,
        }),
      });

      if (confirmResponse.ok) {
        onSuccess?.();
      } else {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'Failed to confirm payment on backend');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirmation') {
    return (
      <div className="text-center py-12">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {campaignType === 'GENERAL_DONATION' ? 'Thank You for Your Giving!' : 'Thank You for Your Support!'}
        </h2>
        
        {campaignType === 'GENERAL_DONATION' ? (
          <p className="text-lg text-gray-600 mb-6">
            God bless you
          </p>
        ) : (
          <>
            <p className="text-lg text-gray-600 mb-6">
              Your {campaignType === 'ADOPT_LANGUAGE' ? 'language adoption' : 'translation sponsorship'} has been successfully set up.
              {selectedLanguage && (
                <span className="block mt-2 font-medium">
                  Supporting: {selectedLanguage.name} ({selectedLanguage.nativeName})
                </span>
              )}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start">
                  <Heart className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Immediate Impact</p>
                    <p className="text-sm text-gray-600">
                      Your sponsorship becomes active immediately, enabling broadcasts in your chosen language.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Welcome Email</p>
                    <p className="text-sm text-gray-600">
                      You&apos;ll receive a welcome email with details about your sponsorship and how to track impact.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Globe className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Monthly Updates</p>
                    <p className="text-sm text-gray-600">
                      Receive regular reports showing the impact of your support across Europe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div className="space-y-4">
          <div>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Donate</h2>
          <p className="text-neutral-600">Select a payment method</p>
        </div>

        <form onSubmit={onSubmitPayment} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="border border-[#1226AA] rounded-lg p-4 bg-blue-50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-5 h-5 rounded-full bg-[#1226AA] flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
              <CreditCard className="h-5 w-5 text-neutral-700" />
              <span className="font-medium text-neutral-900">CreditCard</span>
            </div>
          </div>

          {/* Billing Address */}
          {clientSecret && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                <AddressElement options={{ mode: 'billing' }} />
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <PaymentElement />
              </div>
            </>
          )}


          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Secure Payment:</strong> Your payment information is encrypted and processed 
              securely by Stripe. We never store your card details on our servers.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Button
              type="submit"
              disabled={!stripe || loading || !clientSecret}
              className="flex-1 bg-[#1226AA] hover:bg-blue-800"
              isLoading={loading}
            >
              Donate
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {step === 'details' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Personal Details</h2>
          <p className="text-neutral-600">Please provide your information</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="form-label">
            <User className="inline h-4 w-4 mr-1" />
            First Name *
          </label>
          <input
            {...register('firstName')}
            type="text"
            className="form-input"
            placeholder="John"
          />
          {errors.firstName && (
            <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="form-label">
            <User className="inline h-4 w-4 mr-1" />
            Last Name *
          </label>
          <input
            {...register('lastName')}
            type="text"
            className="form-input"
            placeholder="Smith"
          />
          {errors.lastName && (
            <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="form-label">
          <Mail className="inline h-4 w-4 mr-1" />
          Email Address *
        </label>
        <input
          {...register('email')}
          type="email"
          className="form-input"
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phoneNumber" className="form-label">
            <Phone className="inline h-4 w-4 mr-1" />
            Phone Number
          </label>
          <input
            {...register('phoneNumber')}
            type="tel"
            className="form-input"
            placeholder="+44 20 1234 5678"
          />
        </div>

        <div>
          <label htmlFor="organization" className="form-label">
            <Building className="inline h-4 w-4 mr-1" />
            Organization (Optional)
          </label>
          <input
            {...register('organization')}
            type="text"
            className="form-input"
            placeholder="Your Church or Organization"
          />
        </div>
      </div>

      <div>
        <label htmlFor="country" className="form-label">
          <Globe className="inline h-4 w-4 mr-1" />
          Country *
        </label>
        <select {...register('country')} className="form-input">
          {Object.entries(EUROPEAN_COUNTRIES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        {errors.country && (
          <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
        )}
      </div>



      <div className="bg-neutral-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Privacy & Communication</h3>
        <div className="space-y-3 text-sm text-neutral-600">
          <label className="flex items-start">
            <input 
              type="checkbox" 
              {...register('marketingConsent')}
              className="mt-1 mr-3" 
              defaultChecked 
            />
            <span>
              I would like to receive monthly impact reports showing how my support is making a difference.
            </span>
          </label>
          
          <label className="flex items-start">
            <input 
              type="checkbox" 
              {...register('termsConsent')}
              className="mt-1 mr-3" 
              defaultChecked 
            />
            <span>
              I agree to receive important updates about my sponsorship and Loveworld Europe&apos;s mission.
            </span>
          </label>
          
          <p className="text-xs text-neutral-500">
            By proceeding, you agree to our Terms of Service and Privacy Policy. 
            You can unsubscribe from communications at any time.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
        size="lg"
        isLoading={loading}
      >
        Continue to Payment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}