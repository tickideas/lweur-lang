// src/components/impact/impact-card.tsx
// Reusable impact testimonial card component for public display
// Displays testimonials with consistent styling and responsive design
// RELEVANT FILES: src/app/impact/page.tsx, src/app/page.tsx, src/types/impact.ts

import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import { PublicImpactStory } from '@/types/impact';
import { cn } from '@/lib/utils';

interface ImpactCardProps {
  story: PublicImpactStory;
  featured?: boolean;
  className?: string;
}

export function ImpactCard({ story, featured = false, className }: ImpactCardProps) {
  return (
    <Card 
      className={cn(
        'h-full transition-all duration-300 hover:shadow-lg',
        featured 
          ? 'bg-gradient-to-br from-[#1226AA] to-blue-800 text-white border-[#1226AA]'
          : 'bg-white border-neutral-200 hover:border-[#1226AA]/30',
        className
      )}
    >
      <CardContent className="p-6 sm:p-8 h-full flex flex-col">
        {/* Quote Icon */}
        <div className="flex justify-center mb-6">
          <Quote 
            className={cn(
              'h-8 w-8',
              featured ? 'text-white/80' : 'text-[#1226AA]'
            )} 
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <blockquote 
              className={cn(
                'text-base sm:text-lg leading-relaxed italic mb-6 text-center',
                featured ? 'text-white' : 'text-neutral-700'
              )}
            >
              &ldquo;{story.content}&rdquo;
            </blockquote>
          </div>

          {/* Author Attribution */}
          <div className="text-center">
            <div 
              className={cn(
                'font-semibold text-lg mb-1',
                featured ? 'text-white' : 'text-neutral-900'
              )}
            >
              {story.authorName}
            </div>
            
            {story.location && (
              <div 
                className={cn(
                  'text-sm',
                  featured ? 'text-white/80' : 'text-neutral-500'
                )}
              >
                {story.location}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}