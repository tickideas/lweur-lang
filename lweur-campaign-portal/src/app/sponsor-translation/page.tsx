'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap,
  Globe,
  Users,
  Tv,
  Languages,
  ArrowRight,
  Star,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { Language } from '@/types';
import { formatNumber, getCountryFlag } from '@/utils';

type LanguageWithStats = Language & {
  campaignStats: {
    adoptionCampaigns: number;
    translationCampaigns: number;
    totalCampaigns: number;
  };
};

export default function SponsorTranslationPage() {
  const [languages, setLanguages] = useState<LanguageWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/languages?limit=100');
      const data = await response.json();
      // Filter languages that need translation sponsorship
      const translationLanguages = data.data?.filter((lang: LanguageWithStats) => 
        lang.translationNeedsSponsorship
      ) || [];
      setLanguages(translationLanguages);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const priorityLanguages = languages.filter(lang => lang.priority <= 10);
  const otherLanguages = languages.filter(lang => lang.priority > 10);
  const totalSponsors = languages.reduce((sum, lang) => sum + lang.campaignStats.translationCampaigns, 0);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading translation opportunities...</p>
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
      <section className="relative bg-gradient-to-br from-[#FFBF06] via-[#f59e0b] to-[#FFBF06] text-neutral-900 py-20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/lw_eur_bg.png)',
          }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFBF06]/95 via-[#f59e0b]/97 to-[#FFBF06]/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">
              Sponsor Live Translation
            </h1>
             <div className="text-xl text-neutral-800 mb-8 max-w-4xl mx-auto space-y-4">
              <p className="font-bold text-xg">
                Make the Gospel heard — and understood — in every language. 
              </p>
              <p className="text-base">
                Your <strong>£150 monthly sponsorship</strong> enables real-time translation of our flagship programs — including: <br/>
<strong>Your Loveworld Specials with Pastor Chris, Healing Streams Live Services, Global Day of Prayer,</strong> and more — into European languages.
              
                Together, we’re bringing life-transforming messages directly to communities across the continent in the languages they understand best.
            </p>
              
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/30 rounded-lg p-4 text-center">
              <Tv className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">Live</div>
              <div className="text-neutral-700 text-sm">Broadcasting</div>
            </div>
            <div className="bg-white/30 rounded-lg p-4 text-center">
              <Languages className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{languages.length}</div>
              <div className="text-neutral-700 text-sm">Languages Available</div>
            </div>
            <div className="bg-white/30 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalSponsors}</div>
              <div className="text-neutral-700 text-sm">Active Sponsors</div>
            </div>
            <div className="bg-white/30 rounded-lg p-4 text-center">
              <Globe className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">Real-time</div>
              <div className="text-neutral-700 text-sm">Impact</div>
            </div>
          </div>
        </div>
      </section>


      {/* Priority Languages */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
              Priority Languages
            </h2>
            <p className="text-lg text-gray-600">
              These languages have been identified as high-priority for translation sponsorship based on 
              speaker population and strategic importance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {priorityLanguages.map((language) => (
              <Card key={language.id} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="bg-accent-100 text-accent-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Priority
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={language.flagUrl}
                      alt={`${language.name} flag`}
                      className="language-flag"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'block';
                      }}
                    />
                    <div className="text-2xl" style={{ display: 'none' }}>
                      {language.countries[0] ? getCountryFlag(language.countries[0]) : '🌍'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{language.name}</CardTitle>
                      <p className="text-sm text-gray-500">{language.nativeName}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{language.region}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{formatNumber(language.speakerCount)} speakers</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Zap className="h-4 w-4 mr-2" />
                      <span>{language.campaignStats.translationCampaigns} active sponsors</span>
                    </div>
                    
                    {language.description && (
                      <p className="text-sm text-gray-600">
                        {language.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <Link href={`/checkout?type=SPONSOR_TRANSLATION&language=${language.id}`}>
                      <Button className="w-full" variant="primary">
                        Sponsor for £150/month
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Other Languages */}
      {otherLanguages.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
                Additional Languages
              </h2>
              <p className="text-lg text-gray-600">
                Support translation for these additional European languages and help us reach every community.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherLanguages.map((language) => (
                <Card key={language.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={language.flagUrl}
                        alt={`${language.name} flag`}
                        className="w-8 h-6 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'block';
                        }}
                      />
                      <div className="text-xl" style={{ display: 'none' }}>
                        {language.countries[0] ? getCountryFlag(language.countries[0]) : '🌍'}
                      </div>
                      <div>
                        <h3 className="font-semibold">{language.name}</h3>
                        <p className="text-xs text-gray-500">
                          {formatNumber(language.speakerCount)} speakers
                        </p>
                      </div>
                    </div>
                    
                    <Link href={`/checkout?type=SPONSOR_TRANSLATION&language=${language.id}`}>
                      <Button size="sm" className="w-full">
                        Sponsor
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}


      <Footer />
    </>
  );
}