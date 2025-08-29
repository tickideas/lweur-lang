'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import {
  ArrowLeft,
  CheckCircle,
  Languages,
  Zap,
  Shield,
  CreditCard,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { Language, CampaignType } from '@/types';
import { formatCurrency, getCountryFlag } from '@/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [campaignId, setCampaignId] = useState<string>('');

  useEffect(() => {
    const type = searchParams.get('type') as CampaignType;
    const languageId = searchParams.get('language');
    
    if (type) {
      setCampaignType(type);
    }
    
    if (languageId) {
      fetchLanguage(languageId);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchLanguage = async (languageId: string) => {
    try {
      const response = await fetch(`/api/languages`);
      const data = await response.json();
      const language = data.data?.find((l: Language) => l.id === languageId);
      if (language) {
        setSelectedLanguage(language);
      }
    } catch (error) {
      console.error('Error fetching language:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCampaignTitle = () => {
    if (campaignType === 'ADOPT_LANGUAGE') {
      return 'Adopt a Language Channel';
    } else if (campaignType === 'SPONSOR_TRANSLATION') {
      return 'Sponsor Live Translation';
    }
    return 'Support Loveworld Europe';
  };

  const getCampaignDescription = () => {
    if (campaignType === 'ADOPT_LANGUAGE') {
      return 'Become the exclusive sponsor of a European language channel';
    } else if (campaignType === 'SPONSOR_TRANSLATION') {
      return 'Enable real-time translation of Passacris program';
    }
    return 'Support our mission to reach Europe with the Gospel';
  };

  const getCampaignIcon = () => {
    if (campaignType === 'ADOPT_LANGUAGE') {
      return <Languages className=\"h-8 w-8 text-primary-600\" />;
    } else if (campaignType === 'SPONSOR_TRANSLATION') {
      return <Zap className=\"h-8 w-8 text-accent-600\" />;
    }
    return <Globe className=\"h-8 w-8 text-gray-600\" />;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
          <div className=\"text-center\">
            <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto\"></div>
            <p className=\"mt-4 text-gray-600\">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!campaignType) {
    return (
      <>
        <Header />
        <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
          <div className=\"text-center max-w-md\">
            <h1 className=\"text-2xl font-bold text-gray-900 mb-4\">Choose Your Campaign</h1>
            <p className=\"text-gray-600 mb-8\">
              Please select how you'd like to support Loveworld Europe's mission.
            </p>
            <div className=\"space-y-4\">
              <Link href=\"/adopt-language\">
                <Button className=\"w-full\" size=\"lg\">
                  <Languages className=\"mr-2 h-5 w-5\" />
                  Adopt a Language
                </Button>
              </Link>
              <Link href=\"/sponsor-translation\">
                <Button className=\"w-full\" size=\"lg\" variant=\"secondary\">
                  <Zap className=\"mr-2 h-5 w-5\" />
                  Sponsor Translation
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div className=\"min-h-screen bg-gray-50 py-8\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
          {/* Breadcrumb */}
          <div className=\"mb-8\">
            <Link
              href={campaignType === 'ADOPT_LANGUAGE' ? '/adopt-language' : '/sponsor-translation'}
              className=\"inline-flex items-center text-primary-600 hover:text-primary-500 transition-colors\"
            >
              <ArrowLeft className=\"h-4 w-4 mr-2\" />
              Back to {campaignType === 'ADOPT_LANGUAGE' ? 'Language Selection' : 'Translation Sponsorship'}
            </Link>
          </div>

          {/* Progress Indicator */}
          <div className=\"mb-8\">
            <div className=\"flex items-center justify-center space-x-8\">
              <div className={`flex items-center ${
                step === 'details' ? 'text-primary-600' : 'text-gray-400'
              }`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                  step === 'details' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className=\"ml-2 font-medium\">Details</span>
              </div>
              
              <div className={`flex items-center ${
                step === 'payment' ? 'text-primary-600' : 'text-gray-400'
              }`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                  step === 'payment' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className=\"ml-2 font-medium\">Payment</span>
              </div>
              
              <div className={`flex items-center ${
                step === 'confirmation' ? 'text-primary-600' : 'text-gray-400'
              }`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                  step === 'confirmation' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <span className=\"ml-2 font-medium\">Confirmation</span>
              </div>
            </div>
          </div>

          <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">
            {/* Order Summary */}
            <div className=\"lg:col-span-1\">
              <Card className=\"sticky top-8\">
                <CardHeader>
                  <CardTitle className=\"flex items-center\">
                    {getCampaignIcon()}
                    <span className=\"ml-2\">Order Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className=\"space-y-6\">
                  <div>
                    <h3 className=\"font-semibold text-lg\">{getCampaignTitle()}</h3>
                    <p className=\"text-gray-600 text-sm\">{getCampaignDescription()}</p>
                  </div>

                  {selectedLanguage && (
                    <div className=\"border rounded-lg p-4\">
                      <div className=\"flex items-center space-x-3\">
                        <img
                          src={selectedLanguage.flagUrl}
                          alt={`${selectedLanguage.name} flag`}
                          className=\"w-8 h-6 rounded object-cover\"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'block';
                          }}
                        />
                        <div className=\"text-xl\" style={{ display: 'none' }}>
                          {selectedLanguage.countries[0] ? getCountryFlag(selectedLanguage.countries[0]) : '🌍'}
                        </div>
                        <div>
                          <h4 className=\"font-semibold\">{selectedLanguage.name}</h4>
                          <p className=\"text-sm text-gray-500\">{selectedLanguage.nativeName}</p>
                        </div>
                      </div>
                      <div className=\"mt-3 text-sm text-gray-600\">
                        <p>Region: {selectedLanguage.region}</p>
                        <p>Speakers: {selectedLanguage.speakerCount.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  <div className=\"border-t pt-4\">
                    <div className=\"flex justify-between items-center\">
                      <span className=\"font-medium\">Monthly Contribution:</span>
                      <span className=\"text-2xl font-bold text-primary-600\">
                        {formatCurrency(15000)}
                      </span>
                    </div>
                    <p className=\"text-sm text-gray-500 mt-1\">
                      Recurring monthly subscription
                    </p>
                  </div>

                  <div className=\"bg-green-50 border border-green-200 rounded-lg p-4\">
                    <div className=\"flex items-center\">
                      <CheckCircle className=\"h-5 w-5 text-green-600 mr-2\" />
                      <span className=\"font-medium text-green-800\">Secure Payment</span>
                    </div>
                    <p className=\"text-sm text-green-700 mt-1\">
                      Your payment is processed securely by Stripe with bank-level encryption.
                    </p>
                  </div>

                  <div className=\"space-y-2 text-sm text-gray-600\">
                    <div className=\"flex items-center\">
                      <Shield className=\"h-4 w-4 mr-2\" />
                      <span>SSL encrypted checkout</span>
                    </div>
                    <div className=\"flex items-center\">
                      <CreditCard className=\"h-4 w-4 mr-2\" />
                      <span>Cancel anytime</span>
                    </div>
                    <div className=\"flex items-center\">
                      <Globe className=\"h-4 w-4 mr-2\" />
                      <span>Instant impact</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkout Form */}
            <div className=\"lg:col-span-2\">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {step === 'details' && 'Your Information'}
                    {step === 'payment' && 'Payment Details'}
                    {step === 'confirmation' && 'Thank You!'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientSecret && step === 'payment' ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#1B365D',
                            colorBackground: '#ffffff',
                            colorText: '#333333',
                          },
                        },
                      }}
                    >
                      <CheckoutForm
                        campaignId={campaignId}
                        onSuccess={() => setStep('confirmation')}
                        onBack={() => setStep('details')}
                      />
                    </Elements>
                  ) : (
                    <CheckoutForm
                      campaignType={campaignType}
                      selectedLanguage={selectedLanguage}
                      step={step}
                      onStepChange={setStep}
                      onPaymentReady={(secret, id) => {
                        setClientSecret(secret);
                        setCampaignId(id);
                        setStep('payment');
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}"