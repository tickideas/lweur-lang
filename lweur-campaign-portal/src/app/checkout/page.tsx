'use client';

// This page relies on runtime search params; disable static prerendering.
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CheckoutWizard } from '@/components/checkout/checkout-wizard';
import { ArrowLeft, Languages, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Language, CampaignType } from '@/types';

function CheckoutPageInner() {
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
        <CheckoutWizard
          campaignType={campaignType}
          selectedLanguage={selectedLanguage}
        />
      </div>

      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}