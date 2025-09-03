// src/components/impact/impact-hero.tsx
// Hero section component for the impact page
// Displays impactful headline and description about testimonials
// RELEVANT FILES: src/app/impact/page.tsx, src/app/page.tsx, src/components/layout/header.tsx

import { Heart, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImpactHeroProps {
  className?: string;
  onShareTestimony?: () => void;
}

export function ImpactHero({ className, onShareTestimony }: ImpactHeroProps) {
  return (
    <section className={`relative bg-gradient-to-br from-[#1226AA] via-blue-800 to-[#1226AA] text-white ${className || ''}`}>
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-white/10 p-4">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Our{' '}
            <span className="text-[#FFBF06]">IMPACT</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl leading-8 text-blue-100 mb-8 font-medium">
            Real stories from real people whose lives have been transformed
          </p>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-lg leading-8 text-blue-200 mb-8">
            See how Loveworld Europe&apos;s mission is reaching hearts and changing lives across the continent. 
            These testimonials from our partners and supporters show the powerful impact of your generosity 
            in spreading the Gospel to every European language.
          </p>

          {/* Share Testimony Button */}
          {onShareTestimony && (
            <div className="mb-8">
              <Button 
                onClick={onShareTestimony}
                size="lg"
                className="bg-[#FFBF06] text-[#1226AA] hover:bg-[#FFBF06]/90 font-semibold"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Share Your Testimony
              </Button>
            </div>
          )}

          {/* Stats or Highlights */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#FFBF06] mb-2">60+</div>
              <div className="text-blue-200">Languages Supported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#FFBF06] mb-2">750M</div>
              <div className="text-blue-200">Lives Reached</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#FFBF06] mb-2">50+</div>
              <div className="text-blue-200">Countries Impacted</div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 left-8 opacity-20">
            <Star className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div className="absolute top-16 right-12 opacity-30">
            <Star className="h-4 w-4 text-[#FFBF06] animate-pulse" style={{animationDelay: '1s'}} />
          </div>
          <div className="absolute bottom-12 left-16 opacity-25">
            <Star className="h-5 w-5 text-white animate-pulse" style={{animationDelay: '2s'}} />
          </div>
        </div>
      </div>
    </section>
  );
}