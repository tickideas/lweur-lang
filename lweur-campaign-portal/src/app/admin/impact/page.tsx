// src/app/admin/impact/page.tsx
// Admin interface for managing impact stories and testimonials
// Provides CRUD operations and publishing controls for impact testimonials
// RELEVANT FILES: src/app/api/admin/impact/route.ts, src/components/admin/admin-layout.tsx, src/types/impact.ts

'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Quote,
  Check,
  X as XIcon,
  Clock,
  User,
  Globe
} from 'lucide-react';
import { ImpactStory, CreateImpactStoryRequest, UpdateImpactStoryRequest } from '@/types/impact';
import { useSession } from 'next-auth/react';

interface ImpactFormData {
  title?: string;
  content: string;
  authorName: string;
  location?: string;
  email?: string;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  imageUrl?: string;
}

const defaultFormData: ImpactFormData = {
  title: '',
  content: '',
  authorName: '',
  location: '',
  email: '',
  isPublished: false,
  isFeatured: false,
  displayOrder: 1,
  imageUrl: ''
};

export default function AdminImpactPage() {
  const { data: session } = useSession();
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ImpactFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  const canEdit = session?.user?.role !== 'VIEWER';
  const canDelete = ['SUPER_ADMIN', 'CAMPAIGN_MANAGER'].includes(session?.user?.role || '');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/admin/impact');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: CreateImpactStoryRequest | UpdateImpactStoryRequest = {
        title: formData.title || undefined,
        content: formData.content,
        authorName: formData.authorName,
        location: formData.location || undefined,
        email: formData.email || undefined,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        displayOrder: formData.displayOrder,
        imageUrl: formData.imageUrl || undefined
      };

      const url = editingId ? `/api/admin/impact/${editingId}` : '/api/admin/impact';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchStories();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Error saving story');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (story: ImpactStory) => {
    setEditingId(story.id);
    setFormData({
      title: story.title || '',
      content: story.content,
      authorName: story.authorName,
      location: story.location || '',
      email: story.email || '',
      isPublished: story.isPublished,
      isFeatured: story.isFeatured,
      displayOrder: story.displayOrder,
      imageUrl: story.imageUrl || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`/api/admin/impact/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchStories();
      } else {
        alert('Error deleting story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Error deleting story');
    }
  };

  const togglePublished = async (story: ImpactStory) => {
    try {
      const response = await fetch(`/api/admin/impact/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !story.isPublished })
      });

      if (response.ok) {
        await fetchStories();
      }
    } catch (error) {
      console.error('Error toggling published status:', error);
    }
  };

  const toggleFeatured = async (story: ImpactStory) => {
    try {
      const response = await fetch(`/api/admin/impact/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !story.isFeatured })
      });

      if (response.ok) {
        await fetchStories();
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const handleApprove = async (story: ImpactStory) => {
    try {
      const response = await fetch(`/api/admin/impact/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isApproved: true,
          approvedBy: session?.user?.id,
          approvedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        await fetchStories();
      }
    } catch (error) {
      console.error('Error approving story:', error);
    }
  };

  const handleReject = async (story: ImpactStory) => {
    if (!confirm('Are you sure you want to reject this testimony? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/impact/${story.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchStories();
      }
    } catch (error) {
      console.error('Error rejecting story:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Impact Stories</h1>
            <p className="text-neutral-600 mt-2">
              Manage testimonials and impact stories from your supporters
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Story
            </Button>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Edit Impact Story' : 'Create Impact Story'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Optional title for the story"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Author Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="London, UK"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Testimonial Content *
                  </label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter the testimonial or impact story content..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="published"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    <label htmlFor="published" className="text-sm font-medium text-neutral-700">
                      Published
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="featured"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-neutral-700">
                      Featured
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingId ? 'Update Story' : 'Create Story')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stories List */}
        <div className="space-y-4">
          {stories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Quote className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Impact Stories Yet</h3>
                <p className="text-neutral-600 mb-4">
                  Create your first impact story to showcase testimonials from supporters.
                </p>
                {canEdit && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Story
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            stories.map((story) => (
              <Card key={story.id} className={story.isFeatured ? 'ring-2 ring-primary-500' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">
                          {story.authorName}
                          {story.location && (
                            <span className="text-sm font-normal text-neutral-500 ml-2">
                              • {story.location}
                            </span>
                          )}
                        </CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant={story.isPublished ? 'default' : 'secondary'}>
                          {story.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        {story.isFeatured && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <Badge variant="outline" className={
                          story.submissionType === 'ADMIN' 
                            ? 'text-blue-600 border-blue-600' 
                            : 'text-purple-600 border-purple-600'
                        }>
                          {story.submissionType === 'ADMIN' ? (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              Admin Created
                            </>
                          ) : (
                            <>
                              <Globe className="h-3 w-3 mr-1" />
                              Public Submission
                            </>
                          )}
                        </Badge>
                        {story.submissionType === 'PUBLIC' && (
                          <Badge variant={story.isApproved ? 'default' : 'outline'} className={
                            story.isApproved 
                              ? 'text-green-600 bg-green-50 border-green-600' 
                              : 'text-orange-600 border-orange-600'
                          }>
                            {story.isApproved ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Approved
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Approval
                              </>
                            )}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          Order: {story.displayOrder}
                        </Badge>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex flex-wrap gap-2">
                        {/* Approval Actions for Public Submissions */}
                        {story.submissionType === 'PUBLIC' && !story.isApproved && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(story)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Approve testimony"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(story)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Reject testimony"
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {/* Standard Actions */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFeatured(story)}
                          title={story.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                        >
                          {story.isFeatured ? (
                            <StarOff className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublished(story)}
                          title={story.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {story.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(story)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(story.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-neutral-700 italic">
                      &ldquo;{story.content}&rdquo;
                    </p>
                  </div>
                  {story.title && (
                    <p className="text-sm text-neutral-500 mt-3">
                      Title: {story.title}
                    </p>
                  )}
                  {story.email && (
                    <p className="text-sm text-neutral-500 mt-1">
                      Email: {story.email}
                    </p>
                  )}
                  <div className="flex justify-between text-xs text-neutral-400 mt-2">
                    <span>Created: {new Date(story.createdAt).toLocaleDateString()}</span>
                    {story.submissionType === 'PUBLIC' && story.approvedAt && (
                      <span>Approved: {new Date(story.approvedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}