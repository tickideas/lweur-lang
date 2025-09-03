// src/components/impact/impact-preview.tsx
// Preview component for displaying featured impact stories on homepage
// Shows limited number of testimonials with clean layout
// RELEVANT FILES: src/app/page.tsx, src/components/impact/impact-card.tsx, src/app/api/impact/route.ts

'use client';

import { useState, useEffect } from 'react';
import { ImpactCard } from './impact-card';
import { PublicImpactStory } from '@/types/impact';
import { Quote } from 'lucide-react';

export function ImpactPreview() {
  const [stories, setStories] = useState<PublicImpactStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/impact');
      if (response.ok) {
        const data = await response.json();
        // Show only first 3 stories for preview
        setStories(data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching impact stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <Quote className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-600">Impact stories coming soon...</p>
      </div>
    );
  }

  const featuredStory = stories.find(story => story.isFeatured);
  const regularStories = stories.filter(story => !story.isFeatured);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Featured Story - Center position on large screens */}
      {featuredStory && (
        <div className="lg:order-2">
          <ImpactCard story={featuredStory} featured={true} />
        </div>
      )}
      
      {/* Regular Stories */}
      {regularStories.slice(0, 2).map((story, index) => (
        <div 
          key={story.id} 
          className={
            featuredStory && index === 0 ? 'lg:order-1' : 
            featuredStory && index === 1 ? 'lg:order-3' : ''
          }
        >
          <ImpactCard story={story} />
        </div>
      ))}
    </div>
  );
}