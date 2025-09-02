'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap,
  Globe,
  Clock,
  Users,
  Play,
  Tv,
  Languages,
  ArrowRight,
  CheckCircle,
  Star,
  MapPin,
  Calendar,
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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

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

  const toggleLanguageSelection = (languageId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageId)
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
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
      <section className="bg-gradient-to-br from-accent-900 via-accent-800 to-accent-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold mb-4">
              Sponsor Live Translation
            </h1>
            <p className="text-xl text-accent-100 mb-8 max-w-3xl mx-auto">
              Enable real-time translation of our flagship program "Passacris" into European languages. 
              Your £150 monthly sponsorship brings live Gospel content to diverse communities across the continent.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Tv className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">Live</div>
              <div className="text-accent-200 text-sm">Broadcasting</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Languages className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{languages.length}</div>
              <div className="text-accent-200 text-sm">Languages Available</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalSponsors}</div>
              <div className="text-accent-200 text-sm">Active Sponsors</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Globe className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">Real-time</div>
              <div className="text-accent-200 text-sm">Impact</div>
            </div>
          </div>
        </div>
      </section>

      {/* Passacris Program Overview */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900 mb-6">
                About Passacris Program
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Passacris is Loveworld Europe's flagship program, featuring powerful teachings, 
                worship, and testimonies that transform lives. By sponsoring translation, you enable 
                real-time access to this life-changing content for non-English speaking communities.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-accent-100 rounded-full p-2 mr-4">
                    <Play className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Live Broadcasting</h3>
                    <p className="text-gray-600 text-sm">Real-time translation during live broadcasts</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-accent-100 rounded-full p-2 mr-4">
                    <Clock className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Regular Schedule</h3>
                    <p className="text-gray-600 text-sm">Weekly programs with consistent translation support</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-accent-100 rounded-full p-2 mr-4">
                    <Globe className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Multi-Language Reach</h3>
                    <p className="text-gray-600 text-sm">Simultaneous translation into multiple European languages</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-display text-xl font-semibold mb-4">Program Schedule</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">Sundays</span>
                    <span className="text-gray-600">10:00 AM - 12:00 PM CET</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">Wednesdays</span>
                    <span className="text-gray-600">7:00 PM - 9:00 PM CET</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Special Events</span>
                    <span className="text-gray-600">As announced</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-accent-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="h-5 w-5 text-accent-600 mr-2" />
                    <span className="font-semibold text-accent-800">Your Impact</span>
                  </div>
                  <p className="text-sm text-accent-700">
                    Each sponsorship enables professional translation services for an entire language community.
                  </p>
                </div>
              </div>
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

      {/* How It Works */}
      <section className="bg-accent-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
              How Translation Sponsorship Works
            </h2>
            <p className="text-lg text-gray-600">
              Your sponsorship directly funds professional translation services for live broadcasts.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-accent-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Language</h3>
              <p className="text-gray-600">
                Select one or more European languages you'd like to sponsor for translation services.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Monthly Support</h3>
              <p className="text-gray-600">
                Your £150 monthly contribution funds professional translators and technical infrastructure.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Impact</h3>
              <p className="text-gray-600">
                Watch your sponsored language community receive real-time translated content during live broadcasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Start Sponsoring Translation Today
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join our mission to make the Gospel accessible in every European language. 
            Your support enables real-time translation that changes lives.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/checkout?type=SPONSOR_TRANSLATION">
              <Button size="lg" variant="secondary">
                <Zap className="mr-2 h-5 w-5" />
                Choose Language to Sponsor
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                Learn More About Our Mission
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}