// src/types/impact.ts
// TypeScript type definitions for impact story data structures
// Defines interfaces for impact testimonials and related API responses
// RELEVANT FILES: src/app/api/admin/impact/route.ts, src/app/admin/impact/page.tsx, src/components/impact/impact-card.tsx

export interface ImpactStory {
  id: string;
  title?: string | null;
  content: string;
  authorName: string;
  location?: string | null;
  email?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  imageUrl?: string | null;
  submissionType: 'ADMIN' | 'PUBLIC';
  isApproved: boolean;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImpactStoryRequest {
  title?: string;
  content: string;
  authorName: string;
  location?: string;
  email?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  imageUrl?: string;
}

export interface UpdateImpactStoryRequest extends Partial<CreateImpactStoryRequest> {
  id?: string;
}

export interface PublicImpactStory {
  id: string;
  title?: string | null;
  content: string;
  authorName: string;
  location?: string | null;
  isFeatured: boolean;
  imageUrl?: string | null;
  createdAt: Date;
}