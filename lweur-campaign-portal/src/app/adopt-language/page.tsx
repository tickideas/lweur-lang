'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Filter,
  Users,
  Globe,
  Heart,
  CheckCircle,
  Clock,
  ArrowRight,
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
  currentSponsor: {
    firstName: string;
    lastName: string;
    organization?: string;
  } | null;
};

export default function AdoptLanguagePage() {
  const [languages, setLanguages] = useState<LanguageWithStats[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<LanguageWithStats[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLanguages();
    fetchRegions();
  }, []);

  useEffect(() => {
    filterLanguages();
  }, [languages, selectedRegion, selectedStatus, searchTerm]);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/languages?limit=100');
      const data = await response.json();
      setLanguages(data.data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/languages', { method: 'OPTIONS' });
      const data = await response.json();
      setRegions(data.regions || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const filterLanguages = () => {
    let filtered = languages;

    if (selectedRegion) {
      filtered = filtered.filter(lang => lang.region === selectedRegion);
    }

    if (selectedStatus) {
      filtered = filtered.filter(lang => lang.adoptionStatus === selectedStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lang =>
        lang.name.toLowerCase().includes(term) ||
        lang.nativeName.toLowerCase().includes(term) ||
        lang.countries.some(country => country.toLowerCase().includes(term))
      );
    }

    setFilteredLanguages(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="adoption-badge available flex items-center">
            <Heart className="h-3 w-3 mr-1" />
            Available
          </span>
        );
      case 'ADOPTED':
        return (
          <span className="adoption-badge adopted flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Adopted
          </span>
        );
      case 'PENDING':
        return (
          <span className="adoption-badge pending flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const availableCount = languages.filter(l => l.adoptionStatus === 'AVAILABLE').length;
  const adoptedCount = languages.filter(l => l.adoptionStatus === 'ADOPTED').length;

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading languages...</p>
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
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold mb-4">
              Adopt a Language Channel
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Become the exclusive sponsor of a European language channel for just £150 per month. 
              Your support enables us to broadcast life-transforming Christian programming to millions of souls.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{availableCount}</div>
                <div className="text-primary-200">Languages Available</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{adoptedCount}</div>
                <div className="text-primary-200">Already Adopted</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">750M</div>
                <div className="text-primary-200">Potential Reach</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search languages, countries, or regions..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                className="form-input"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              
              <select
                className="form-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ADOPTED">Adopted</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Languages Grid */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLanguages.map((language) => (
              <Card key={language.id} className="language-card relative">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={language.flagUrl}
                        alt={`${language.name} flag`}
                        className="language-flag"
                        onError={(e) => {
                          // Fallback to emoji flag if image fails
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
                    {getStatusBadge(language.adoptionStatus)}
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
                      <Globe className="h-4 w-4 mr-2" />
                      <span>{language.countries.length} countries</span>
                    </div>
                    
                    {language.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {language.description}
                      </p>
                    )}
                    
                    {language.currentSponsor && (
                      <div className="bg-primary-50 rounded-lg p-3 mt-4">
                        <p className="text-sm font-medium text-primary-800">
                          Sponsored by:
                        </p>
                        <p className="text-sm text-primary-700">
                          {language.currentSponsor.firstName} {language.currentSponsor.lastName}
                          {language.currentSponsor.organization && (
                            <span className="block text-xs">
                              {language.currentSponsor.organization}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    {language.adoptionStatus === 'AVAILABLE' ? (
                      <Link href={`/checkout?type=ADOPT_LANGUAGE&language=${language.id}`}>
                        <Button className="w-full">
                          Adopt for £150/month
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : language.adoptionStatus === 'ADOPTED' ? (
                      <Button className="w-full" variant="outline" disabled>
                        Already Adopted
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Processing
                        <Clock className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredLanguages.length === 0 && (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No languages found</h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Impact Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
            Your Impact as a Language Adopter
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            When you adopt a language, you become the exclusive sponsor enabling us to broadcast 
            life-transforming Christian programming to millions of speakers across Europe.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Exclusive Sponsorship</h3>
              <p className="text-gray-600">
                Be the sole supporter of your chosen language channel, with recognition and regular updates.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reach Millions</h3>
              <p className="text-gray-600">
                Your support directly enables broadcasts reaching millions of speakers in their native language.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transform Lives</h3>
              <p className="text-gray-600">
                Receive monthly impact reports showing how your support is changing lives across Europe.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}