// src/components/checkout/personal-details-form.tsx
// Personal details form component for step 2 of checkout flow
// Handles partner information collection and validation
// RELEVANT FILES: checkout-wizard.tsx, checkout-form.tsx, utils/index.ts, types/index.ts

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  Building,
  Globe,
} from 'lucide-react';
import { EUROPEAN_COUNTRIES } from '@/utils';

const partnerInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional(),
  organization: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  preferredLanguage: z.string().default('en'),
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  hearFromUs: z.string().optional(),
  marketingConsent: z.boolean().default(true),
  termsConsent: z.boolean().default(true),
});

type PartnerInfoForm = z.infer<typeof partnerInfoSchema>;

interface PersonalDetailsFormProps {
  onComplete: (data: PartnerInfoForm) => void;
}

export function PersonalDetailsForm({ onComplete }: PersonalDetailsFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerInfoForm>({
    resolver: zodResolver(partnerInfoSchema),
    defaultValues: {
      preferredLanguage: 'en',
      country: 'GB',
      marketingConsent: true,
      termsConsent: true,
    },
  });

  const onSubmit = async (data: PartnerInfoForm) => {
    setLoading(true);
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    onComplete(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Personal Details</h2>
        <p className="text-neutral-600">Please provide your information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-neutral-700">
              <User className="inline h-4 w-4 mr-1" />
              First Name *
            </Label>
            <Input
              {...register('firstName')}
              type="text"
              className="mt-1"
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-neutral-700">
              <User className="inline h-4 w-4 mr-1" />
              Last Name *
            </Label>
            <Input
              {...register('lastName')}
              type="text"
              className="mt-1"
              placeholder="Smith"
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
            <Mail className="inline h-4 w-4 mr-1" />
            Email Address *
          </Label>
          <Input
            {...register('email')}
            type="email"
            className="mt-1"
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-neutral-700">
              <Phone className="inline h-4 w-4 mr-1" />
              Phone Number
            </Label>
            <Input
              {...register('phoneNumber')}
              type="tel"
              className="mt-1"
              placeholder="+44 20 1234 5678"
            />
          </div>

          <div>
            <Label htmlFor="organization" className="text-sm font-medium text-neutral-700">
              <Building className="inline h-4 w-4 mr-1" />
              Organization (Optional)
            </Label>
            <Input
              {...register('organization')}
              type="text"
              className="mt-1"
              placeholder="Your Church or Organization"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="country" className="text-sm font-medium text-neutral-700">
            <Globe className="inline h-4 w-4 mr-1" />
            Country *
          </Label>
          <select {...register('country')} className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent mt-1">
            {Object.entries(EUROPEAN_COUNTRIES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
          )}
        </div>

        {/* Address Fields */}
        <div>
          <Label htmlFor="street" className="text-sm font-medium text-neutral-700">
            Street Address
          </Label>
          <Input
            {...register('street')}
            type="text"
            className="mt-1"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="city" className="text-sm font-medium text-neutral-700">
              City
            </Label>
            <Input
              {...register('city')}
              type="text"
              className="mt-1"
              placeholder="London"
            />
          </div>

          <div>
            <Label htmlFor="postalCode" className="text-sm font-medium text-neutral-700">
              Postal/Zip Code
            </Label>
            <Input
              {...register('postalCode')}
              type="text"
              className="mt-1"
              placeholder="SW1A 1AA"
            />
          </div>
        </div>

        {/* How did you hear from us */}
        <div>
          <Label htmlFor="hearFromUs" className="text-sm font-medium text-neutral-700">
            How did you last hear from us?
          </Label>
          <select {...register('hearFromUs')} className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent mt-1">
            <option value="">None</option>
            <option value="Search Engine">Search Engine</option>
            <option value="Social Media">Social Media</option>
            <option value="Friend/Family">Friend/Family</option>
            <option value="Church">Church</option>
            <option value="Advertisement">Advertisement</option>
            <option value="Email">Email</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="bg-neutral-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Privacy & Communication</h3>
          <div className="space-y-3 text-sm text-neutral-600">
            <label className="flex items-start">
              <input 
                type="checkbox" 
                {...register('marketingConsent')}
                className="mt-1 mr-3" 
                defaultChecked 
              />
              <span>
                I would like to receive monthly impact reports showing how my support is making a difference.
              </span>
            </label>
            
            <label className="flex items-start">
              <input 
                type="checkbox" 
                {...register('termsConsent')}
                className="mt-1 mr-3" 
                defaultChecked 
              />
              <span>
                I agree to receive important updates about my sponsorship and Loveworld Europe&apos;s mission.
              </span>
            </label>
            
            <p className="text-xs text-neutral-500">
              By proceeding, you agree to our Terms of Service and Privacy Policy. 
              You can unsubscribe from communications at any time.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1226AA] hover:bg-blue-800"
          size="lg"
        >
          {loading ? 'Processing...' : 'Continue to Payment'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}