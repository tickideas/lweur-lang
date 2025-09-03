// src/app/impact/page.tsx
// Public impact page displaying testimonials and impact stories
// Shows hero section and carousel of published impact stories
// RELEVANT FILES: src/components/impact/impact-hero.tsx, src/components/impact/impact-carousel.tsx, src/app/api/impact/route.ts

'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ImpactHero } from '@/components/impact/impact-hero';
import { ImpactCarousel } from '@/components/impact/impact-carousel';
import { TestimonyModal } from '@/components/impact/testimony-modal';
import { Button } from '@/components/ui/button';
import { PublicImpactStory } from '@/types/impact';
import { Heart, Quote, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ImpactPage() {
  const [stories, setStories] = useState<PublicImpactStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTestimonyModal, setShowTestimonyModal] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/impact');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      } else {
        throw new Error('Failed to fetch stories');
      }
    } catch (error) {
      console.error('Error fetching impact stories:', error);
      setError('Failed to load impact stories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <ImpactHero onShareTestimony={() => setShowTestimonyModal(true)} />

      {/* Main Content */}
      <main className="bg-neutral-50">
        {/* Testimonials Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1226AA] mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading impact stories...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <Quote className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-neutral-900 mb-2">Unable to Load Stories</h3>
                <p className="text-neutral-600 mb-6">{error}</p>
                <Button onClick={fetchStories}>
                  Try Again
                </Button>
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-16">
                <Quote className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-neutral-900 mb-2">Coming Soon</h3>
                <p className="text-neutral-600 mb-6">
                  Impact stories and testimonials will be shared here soon.
                </p>
              </div>
            ) : (
              <>
                {/* Section Header */}
                <div className="mx-auto max-w-2xl text-center mb-16">
                  <h2 className="font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl mb-4">
                    Transforming Lives Together
                  </h2>
                  <p className="text-lg leading-8 text-neutral-600 mb-6">
                    Hear directly from our partners and supporters about the incredible impact 
                    of your generosity in spreading the Gospel across Europe.
                  </p>
                  <Button 
                    onClick={() => setShowTestimonyModal(true)}
                    variant="outline"
                    className="border-[#1226AA] text-[#1226AA] hover:bg-[#1226AA] hover:text-white"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Share Your Story
                  </Button>
                </div>

                {/* Stories Carousel */}
                <ImpactCarousel 
                  stories={stories} 
                  showPagination={true}
                  itemsPerPage={3}
                  className="mb-16"
                />

                {/* Statistics Section */}
                <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-neutral-200">
                  <div className="text-center mb-8">
                    <Heart className="h-12 w-12 text-[#1226AA] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                      The Power of Partnership
                    </h3>
                    <p className="text-neutral-600 max-w-2xl mx-auto">
                      Every monthly contribution creates ripples of impact across Europe, 
                      bringing hope and transformation to communities in their native languages.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#1226AA] mb-2">£150</div>
                      <div className="text-sm text-neutral-600">Monthly Contribution</div>
                      <div className="text-xs text-neutral-500 mt-1">Per Language</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#1226AA] mb-2">24/7</div>
                      <div className="text-sm text-neutral-600">Broadcasting</div>
                      <div className="text-xs text-neutral-500 mt-1">Continuous Content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#1226AA] mb-2">60</div>
                      <div className="text-sm text-neutral-600">Languages</div>
                      <div className="text-xs text-neutral-500 mt-1">Across Europe</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#1226AA] mb-2">750M</div>
                      <div className="text-sm text-neutral-600">Potential Reach</div>
                      <div className="text-xs text-neutral-500 mt-1">Lives Impacted</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-[#1226AA] to-blue-800 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                Be Part of the Story
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Your partnership creates the testimonials you&apos;ve just read. 
                Join us in transforming lives across Europe.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/adopt-language">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="bg-[#FFBF06] text-[#1226AA] hover:bg-[#FFBF06]/90 font-semibold"
                  >
                    Adopt a Language
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sponsor-translation">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-[#1226AA]"
                  >
                    Sponsor Translation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Testimony Submission Modal */}
      <TestimonyModal 
        isOpen={showTestimonyModal} 
        onClose={() => setShowTestimonyModal(false)}
      />
    </>
  );
}