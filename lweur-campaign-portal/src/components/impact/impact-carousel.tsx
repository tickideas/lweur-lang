// src/components/impact/impact-carousel.tsx  
// Carousel component for displaying multiple impact testimonials
// Features responsive grid layout with featured story highlighting
// RELEVANT FILES: src/app/impact/page.tsx, src/components/impact/impact-card.tsx, src/types/impact.ts

'use client';

import { useState, useEffect } from 'react';
import { ImpactCard } from './impact-card';
import { PublicImpactStory } from '@/types/impact';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImpactCarouselProps {
  stories: PublicImpactStory[];
  showPagination?: boolean;
  itemsPerPage?: number;
  className?: string;
}

export function ImpactCarousel({ 
  stories, 
  showPagination = true, 
  itemsPerPage = 3,
  className 
}: ImpactCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(stories.length / itemsPerPage);

  // Auto-scroll functionality (optional)
  useEffect(() => {
    if (stories.length <= itemsPerPage) return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 8000); // Change slide every 8 seconds

    return () => clearInterval(interval);
  }, [stories.length, itemsPerPage, totalPages]);

  const getCurrentPageStories = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return stories.slice(start, end);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  if (stories.length === 0) {
    return null;
  }

  const currentStories = getCurrentPageStories();
  const featuredStory = currentStories.find(story => story.isFeatured);
  const regularStories = currentStories.filter(story => !story.isFeatured);

  return (
    <div className={cn('relative', className)}>
      {/* Navigation Arrows */}
      {totalPages > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full p-2 shadow-lg bg-white/90 hover:bg-white border-neutral-200"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full p-2 shadow-lg bg-white/90 hover:bg-white border-neutral-200"
            aria-label="Next testimonials"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Stories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Featured Story - Center position on large screens */}
        {featuredStory && (
          <div className="lg:order-2">
            <ImpactCard story={featuredStory} featured={true} />
          </div>
        )}
        
        {/* Regular Stories */}
        {regularStories.map((story, index) => (
          <div 
            key={story.id} 
            className={cn(
              featuredStory && index === 0 ? 'lg:order-1' : 
              featuredStory && index === 1 ? 'lg:order-3' : ''
            )}
          >
            <ImpactCard story={story} />
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-200',
                index === currentPage
                  ? 'bg-[#1226AA] w-8'
                  : 'bg-neutral-300 hover:bg-neutral-400'
              )}
              aria-label={`Go to testimonial page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}