'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CheckoutWizard } from '@/components/checkout/checkout-wizard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Language, CampaignType } from '@/types';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [loading, setLoading] = useState(true);

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


  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Campaign</h1>
            <p className="text-gray-600 mb-8">
              Please select how you&apos;d like to support Loveworld Europe&apos;s mission.
            </p>
            <div className="space-y-4">
              <Link href="/adopt-language">
                <Button className="w-full" size="lg">
                  <Languages className="mr-2 h-5 w-5" />
                  Adopt a Language
                </Button>
              </Link>
              <Link href="/sponsor-translation">
                <Button className="w-full" size="lg" variant="secondary">
                  <Zap className="mr-2 h-5 w-5" />
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
      
      <div className="min-h-screen bg-neutral-50 py-8">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Link
            href={campaignType === 'ADOPT_LANGUAGE' ? '/adopt-language' : '/sponsor-translation'}
            className="inline-flex items-center text-[#1226AA] hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {campaignType === 'ADOPT_LANGUAGE' ? 'Language Selection' : 'Translation Sponsorship'}
          </Link>
        </div>

        {/* CBN Europe Style Layout */}
        <div className="relative">
          {/* Left Side Background - CBN Europe Style */}
          <div className="hidden lg:block fixed left-0 top-0 w-1/2 h-full bg-gradient-to-br from-[#1226AA] to-blue-800">
            <div className="h-full flex items-center justify-center p-12">
              <div className="text-white text-center max-w-lg">
                <h1 className="text-6xl font-bold mb-6 leading-tight">
                  YOU'RE A<br />
                  WORLD<br />
                  CHANGER
                </h1>
                <p className="text-xl opacity-90">
                  Your generosity is transforming lives across Europe
                </p>
              </div>
            </div>
          </div>

          {/* Right Side Content */}
          <div className="lg:ml-[50%] lg:pl-8">
            <CheckoutWizard
              campaignType={campaignType}
              selectedLanguage={selectedLanguage}
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}