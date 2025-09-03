// src/components/impact/testimony-modal.tsx
// Modal form for public testimony submissions with anti-bot protection
// Includes honeypot fields, rate limiting, and form validation
// RELEVANT FILES: src/app/api/testimonials/submit/route.ts, src/app/impact/page.tsx, src/components/ui/button.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, Heart, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestimonyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  authorName: string;
  email: string;
  location: string;
  content: string;
  honeypot: string; // Anti-bot field
}

interface SubmissionToken {
  token: string;
  timestamp: number;
}

const initialFormData: FormData = {
  authorName: '',
  email: '',
  location: '',
  content: '',
  honeypot: '' // This should remain empty for humans
};

export function TestimonyModal({ isOpen, onClose }: TestimonyModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<SubmissionToken | null>(null);
  const [formStartTime, setFormStartTime] = useState<number>(0);

  // Fetch submission token when modal opens
  useEffect(() => {
    if (isOpen && !token) {
      fetchSubmissionToken();
      setFormStartTime(Date.now());
    }
  }, [isOpen, token]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setSuccess(false);
      setError(null);
      setToken(null);
      setFormStartTime(0);
    }
  }, [isOpen]);

  const fetchSubmissionToken = async () => {
    try {
      const response = await fetch('/api/testimonials/submit');
      if (response.ok) {
        const tokenData = await response.json();
        setToken(tokenData);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Check if form was filled too quickly (anti-bot measure)
    const fillTime = Date.now() - formStartTime;
    if (fillTime < 5000) { // Less than 5 seconds
      setError('Please take your time filling out the form.');
      return;
    }

    // Check honeypot field
    if (formData.honeypot !== '') {
      setError('Invalid submission detected.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          token: token.token,
          timestamp: token.timestamp
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData(initialFormData);
      } else {
        setError(result.message || result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting testimony:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-neutral-600" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {success ? (
            /* Success State */
            <div className="p-8 text-center">
              <div className="rounded-full bg-green-100 p-4 mx-auto mb-6 w-fit">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                Thank You!
              </h3>
              <p className="text-neutral-600 mb-6">
                Your testimony has been submitted successfully. Our team will review it 
                and publish it once approved. We appreciate you sharing how God has 
                touched your life through Loveworld Europe!
              </p>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1226AA] to-blue-800 text-white p-6">
                <div className="flex items-center mb-4">
                  <Heart className="h-6 w-6 mr-3" />
                  <h2 className="text-xl font-bold">Share Your Testimony</h2>
                </div>
                <p className="text-blue-100 text-sm">
                  Tell us how Loveworld Europe has impacted your life. Your story could 
                  inspire others and will be reviewed before publication.
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-neutral-50 border-b px-6 py-3">
                <div className="flex items-center text-sm text-neutral-600">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>Protected by anti-spam measures</span>
                  <Clock className="h-4 w-4 ml-4 mr-1 text-blue-600" />
                  <span>Reviews within 24 hours</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                      value={formData.authorName}
                      onChange={(e) => handleInputChange('authorName', e.target.value)}
                      placeholder="John Smith"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="London, UK"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Your email won't be published publicly
                  </p>
                </div>

                {/* Honeypot field - hidden from users but visible to bots */}
                <div className="hidden" aria-hidden="true">
                  <label>
                    Please leave this field empty
                    <input
                      type="text"
                      name="honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => handleInputChange('honeypot', e.target.value)}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Your Testimony *
                  </label>
                  <textarea
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1226AA] focus:border-transparent resize-none"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Share how Loveworld Europe has impacted your life, blessed your family, or strengthened your faith..."
                    maxLength={2000}
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>Minimum 10 characters</span>
                    <span>{formData.content.length}/2000</span>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-neutral-900 mb-2">Before you submit:</h4>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    <li>• Your testimony will be reviewed before publication</li>
                    <li>• We may edit for length and clarity</li>
                    <li>• Please avoid including personal contact information</li>
                    <li>• Only share experiences related to Loveworld Europe</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    disabled={submitting || !token}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Testimony
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}