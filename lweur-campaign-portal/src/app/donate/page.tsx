// src/app/donate/page.tsx
// General donation page for flexible giving to support Loveworld Europe's ministry
// Provides direct access to donation checkout with general ministry support
// RELEVANT FILES: checkout-wizard.tsx, amount-selection.tsx, checkout/page.tsx, prisma/schema.prisma

'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CheckoutWizard } from '@/components/checkout/checkout-wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Zap,
  Languages,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Language } from '@/types';

interface Statistics {
  languagesSupported: number;
  peopleReached: number;
  broadcasting: string;
  activeCampaigns: number;
  adoptedLanguages: number;
}

export default function DonatePage() {
  const [generalMinistryLanguage, setGeneralMinistryLanguage] = useState<Language | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both languages and statistics in parallel
      const [languagesResponse, statisticsResponse] = await Promise.all([
        fetch('/api/languages'),
        fetch('/api/statistics')
      ]);

      const languagesData = await languagesResponse.json();
      const statisticsData = await statisticsResponse.json();
      
      // Find the "General Ministry" language we created
      const generalLanguage = languagesData.data?.find((l: Language) => 
        l.iso639Code === 'general' || l.name === 'General Ministry'
      );
      
      if (generalLanguage) {
        setGeneralMinistryLanguage(generalLanguage);
      }

      // Set statistics data
      if (statisticsData.success && statisticsData.data) {
        setStatistics(statisticsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading donation options...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!generalMinistryLanguage) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Donation Currently Unavailable</h1>
            <p className="text-gray-600 mb-8">
              We&apos;re setting up our donation system. Please try again later or choose a specific campaign.
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
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-16">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/lw_eur_bg.png)',
          }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/97 to-primary-900/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold mb-4">
              Partner with Us
            </h1>
            <div className="text-xl text-primary-100 mb-8 max-w-4xl mx-auto space-y-4">
              <p className="font-bold text-lg">
                Your generous giving fuels our mission to reach every corner of the continent with the Gospel.
               
              </p>
              <p className="text-base">
               Every contribution helps us broadcast life-transforming messages from the Man of God, Pastor Chris, and other ministers, deliver uplifting Christian programming, and expand our network of language channels across Europe.
              </p>
              <p className="text-base font-medium">
                Give and make an impact today — whether one-time or monthly.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {statistics ? `${statistics.languagesSupported}+` : '60+'}
                </div>
                <div className="text-primary-200">Languages Supported</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {statistics ? formatNumber(statistics.peopleReached) : '1.8B'}
                </div>
                <div className="text-primary-200">Potential Reach</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {statistics ? statistics.broadcasting : '24/7'}
                </div>
                <div className="text-primary-200">Broadcasting</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Donation Form */}
      <section className="bg-neutral-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            
            <p className="text-lg text-gray-600">
              Choose your amount and donation frequency below
            </p>
          </div>
          
          <CheckoutWizard
            campaignType="GENERAL_DONATION"
            selectedLanguage={generalMinistryLanguage}
          />
        </div>
      </section>

      {/* Alternative Options */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Other Ways to Give
            </h2>
            <p className="text-lg text-gray-600">
              Consider these targeted giving opportunities for maximum impact
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Languages className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-xl font-semibold">Adopt a Language Channel</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Become the exclusive sponsor of a specific European language channel for £150/month and directly impact thousands of speakers.
                </p>
                <Link href="/adopt-language">
                  <Button className="w-full">
                    View Available Languages
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Zap className="h-8 w-8 text-secondary-600 mr-3" />
                  <h3 className="text-xl font-semibold">Sponsor Live Translation</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Support real-time translation services for Pastor Chris&apos;s programs, breaking language barriers for £150/month.
                </p>
                <Link href="/sponsor-translation">
                  <Button variant="secondary" className="w-full">
                    Sponsor Translation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}