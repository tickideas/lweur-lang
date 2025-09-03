// src/app/admin/checkout-settings/page.tsx
// Admin page for managing checkout settings and configuration
// Allows admins to configure currencies, amounts, and checkout flow options
// RELEVANT FILES: checkout-wizard.tsx, amount-selection.tsx, prisma/schema.prisma, admin-layout.tsx

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray, Control, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  Save,
  Plus,
  Minus,
  CreditCard,
  Globe,
  MessageCircle,
  RefreshCw,
  Image,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency } from '@/utils';
import { sanitizeCheckoutSettings } from '@/lib/sanitization';
import { useDebounceObject } from '@/hooks/useDebounce';
import { useCheckoutSettingsFieldArray, CheckoutSettingsFormType } from '@/hooks/useTypedFieldArray';

const checkoutSettingsSchema = z.object({
  availableCurrencies: z.array(z.string()).min(1, 'At least one currency is required'),
  defaultCurrency: z.string().min(1, 'Default currency is required'),
  adoptLanguageDefaultAmount: z.number().min(100, 'Minimum £1'),
  adoptLanguagePresetAmounts: z.array(z.number()).min(1, 'At least one preset amount required'),
  adoptLanguageMinAmount: z.number().min(100, 'Minimum £1'),
  adoptLanguageMaxAmount: z.number().min(1000, 'Maximum must be at least £10'),
  sponsorTranslationDefaultAmount: z.number().min(100, 'Minimum £1'),
  sponsorTranslationPresetAmounts: z.array(z.number()).min(1, 'At least one preset amount required'),
  sponsorTranslationMinAmount: z.number().min(100, 'Minimum £1'),
  sponsorTranslationMaxAmount: z.number().min(1000, 'Maximum must be at least £10'),
  showOneTimeOption: z.boolean(),
  requirePhone: z.boolean(),
  requireOrganization: z.boolean(),
  hearFromUsOptions: z.array(z.string()),
  checkoutTitle: z.string().min(1, 'Title is required'),
  checkoutSubtitle: z.string().min(1, 'Subtitle is required'),
  // Hero section settings
  heroEnabled: z.boolean(),
  heroTitle: z.string().min(1, 'Hero title is required'),
  heroSubtitle: z.string().min(1, 'Hero subtitle is required'),
  heroBackgroundColor: z.string().min(1, 'Background color is required'),
  heroTextColor: z.string().min(1, 'Text color is required'),
});

type CheckoutSettingsForm = CheckoutSettingsFormType;

const CURRENCY_OPTIONS = [
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'CHF', label: 'Swiss Franc (Fr)' },
  { value: 'NOK', label: 'Norwegian Krone (kr)' },
  { value: 'SEK', label: 'Swedish Krona (kr)' },
  { value: 'DKK', label: 'Danish Krone (kr)' },
];

export default function CheckoutSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
    reset
  } = useForm<CheckoutSettingsForm>({
    resolver: zodResolver(checkoutSettingsSchema),
    defaultValues: {
      availableCurrencies: ['GBP', 'EUR', 'USD'],
      defaultCurrency: 'GBP',
      adoptLanguageDefaultAmount: 15000,
      adoptLanguagePresetAmounts: [2000, 3500, 5000, 15000],
      adoptLanguageMinAmount: 1000,
      adoptLanguageMaxAmount: 100000,
      sponsorTranslationDefaultAmount: 15000,
      sponsorTranslationPresetAmounts: [2000, 3500, 5000, 15000],
      sponsorTranslationMinAmount: 1000,
      sponsorTranslationMaxAmount: 100000,
      showOneTimeOption: false,
      requirePhone: false,
      requireOrganization: false,
      hearFromUsOptions: ['Search Engine', 'Social Media', 'Friend/Family', 'Church', 'Advertisement', 'Email', 'Other'],
      checkoutTitle: 'Your generosity is transforming lives!',
      checkoutSubtitle: 'Support Loveworld Europe\'s mission to reach every European language with the Gospel',
      // Hero section defaults
      heroEnabled: true,
      heroTitle: "YOU'RE A\nWORLD\nCHANGER",
      heroSubtitle: "Your generosity is transforming lives across Europe",
      heroBackgroundColor: "from-[#1226AA] to-blue-800",
      heroTextColor: "text-white"
    },
  });

  const {
    fields: adoptPresetFields,
    append: appendAdoptPreset,
    remove: removeAdoptPreset
  } = useCheckoutSettingsFieldArray(control, 'adoptLanguagePresetAmounts');

  const {
    fields: sponsorPresetFields,
    append: appendSponsorPreset,
    remove: removeSponsorPreset
  } = useCheckoutSettingsFieldArray(control, 'sponsorTranslationPresetAmounts');

  const {
    fields: hearFromUsFields,
    append: appendHearFromUs,
    remove: removeHearFromUs
  } = useCheckoutSettingsFieldArray(control, 'hearFromUsOptions');

  const selectedCurrencies = watch('availableCurrencies');
  const defaultCurrency = watch('defaultCurrency');

  // Watch hero section fields for preview
  const heroPreviewFields = watch(['heroTitle', 'heroSubtitle', 'heroBackgroundColor', 'heroTextColor', 'heroEnabled']);
  
  // Debounce hero preview updates to improve performance
  const debouncedHeroFields = useDebounceObject(
    {
      heroTitle: heroPreviewFields[0],
      heroSubtitle: heroPreviewFields[1],
      heroBackgroundColor: heroPreviewFields[2],
      heroTextColor: heroPreviewFields[3],
      heroEnabled: heroPreviewFields[4]
    },
    300 // 300ms debounce
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/checkout-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          reset(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CheckoutSettingsForm) => {
    setSaving(true);
    setMessage(null);

    try {
      console.log('Submitting checkout settings:', data);
      
      // Sanitize data before sending to API
      const sanitizedData = sanitizeCheckoutSettings(data);
      console.log('Sanitized data:', sanitizedData);

      const response = await fetch('/api/admin/checkout-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result = await response.json();
      console.log('Save successful:', result);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error: unknown) {
      console.error('Save error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An error occurred' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyToggle = (currency: string) => {
    const current = selectedCurrencies;
    if (current.includes(currency)) {
      if (current.length > 1) { // Keep at least one currency
        setValue('availableCurrencies', current.filter(c => c !== currency));
        if (defaultCurrency === currency) {
          setValue('defaultCurrency', current.find(c => c !== currency) || 'GBP');
        }
      }
    } else {
      setValue('availableCurrencies', [...current, currency]);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1226AA]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
              <Settings className="mr-3 h-8 w-8 text-[#1226AA]" />
              Checkout Settings
            </h1>
            <p className="text-neutral-600 mt-2">
              Configure checkout flow, amounts, currencies, and donation options
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={loadSettings}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
              className="bg-[#1226AA] hover:bg-blue-800"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Currency Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Currency Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Available Currencies</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {CURRENCY_OPTIONS.map((currency) => (
                    <label key={currency.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCurrencies.includes(currency.value)}
                        onChange={() => handleCurrencyToggle(currency.value)}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-sm">{currency.label}</span>
                    </label>
                  ))}
                </div>
                {errors.availableCurrencies && (
                  <p className="text-red-600 text-sm mt-1">{errors.availableCurrencies.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <select
                  {...register('defaultCurrency')}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent mt-1"
                >
                  {selectedCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {CURRENCY_OPTIONS.find(c => c.value === currency)?.label || currency}
                    </option>
                  ))}
                </select>
                {errors.defaultCurrency && (
                  <p className="text-red-600 text-sm mt-1">{errors.defaultCurrency.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adopt Language Amount Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Adopt Language - Amount Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="adoptLanguageDefaultAmount">Default Amount (pence)</Label>
                  <Input
                    {...register('adoptLanguageDefaultAmount', { valueAsNumber: true })}
                    type="number"
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatCurrency(watch('adoptLanguageDefaultAmount') || 0, defaultCurrency)}
                  </p>
                  {errors.adoptLanguageDefaultAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.adoptLanguageDefaultAmount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adoptLanguageMinAmount">Minimum Amount (pence)</Label>
                  <Input
                    {...register('adoptLanguageMinAmount', { valueAsNumber: true })}
                    type="number"
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatCurrency(watch('adoptLanguageMinAmount') || 0, defaultCurrency)}
                  </p>
                  {errors.adoptLanguageMinAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.adoptLanguageMinAmount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adoptLanguageMaxAmount">Maximum Amount (pence)</Label>
                  <Input
                    {...register('adoptLanguageMaxAmount', { valueAsNumber: true })}
                    type="number"
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatCurrency(watch('adoptLanguageMaxAmount') || 0, defaultCurrency)}
                  </p>
                  {errors.adoptLanguageMaxAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.adoptLanguageMaxAmount.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Preset Amounts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendAdoptPreset(5000 as number)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Amount
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {adoptPresetFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Input
                        {...register(`adoptLanguagePresetAmounts.${index}`, { valueAsNumber: true })}
                        type="number"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdoptPreset(index)}
                        disabled={adoptPresetFields.length <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsor Translation Amount Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Sponsor Translation - Amount Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="sponsorTranslationDefaultAmount">Default Amount (pence)</Label>
                  <Input
                    {...register('sponsorTranslationDefaultAmount', { valueAsNumber: true })}
                    type="number"
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatCurrency(watch('sponsorTranslationDefaultAmount') || 0, defaultCurrency)}
                  </p>
                  {errors.sponsorTranslationDefaultAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.sponsorTranslationDefaultAmount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sponsorTranslationMinAmount">Minimum Amount (pence)</Label>
                  <Input
                    {...register('sponsorTranslationMinAmount', { valueAsNumber: true })}
                    type="number"
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatCurrency(watch('sponsorTranslationMinAmount') || 0, defaultCurrency)}
                  </p>
                  {errors.sponsorTranslationMinAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.sponsorTranslationMinAmount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sponsorTranslationMaxAmount">Maximum Amount (pence)</Label>
                  <Input
                    {...register('sponsorTranslationMaxAmount', { valueAsNumber: true })}
                    type="number"
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatCurrency(watch('sponsorTranslationMaxAmount') || 0, defaultCurrency)}
                  </p>
                  {errors.sponsorTranslationMaxAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.sponsorTranslationMaxAmount.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Preset Amounts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendSponsorPreset(5000 as number)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Amount
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sponsorPresetFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Input
                        {...register(`sponsorTranslationPresetAmounts.${index}`, { valueAsNumber: true })}
                        type="number"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSponsorPreset(index)}
                        disabled={sponsorPresetFields.length <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flow Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Checkout Flow Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('showOneTimeOption')}
                    className="rounded border-neutral-300"
                  />
                  <span>Show one-time donation option (currently monthly only)</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('requirePhone')}
                    className="rounded border-neutral-300"
                  />
                  <span>Require phone number</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('requireOrganization')}
                    className="rounded border-neutral-300"
                  />
                  <span>Require organization field</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Messaging and Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                Messaging & Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="checkoutTitle">Checkout Page Title</Label>
                <Input
                  {...register('checkoutTitle')}
                  className="mt-1"
                />
                {errors.checkoutTitle && (
                  <p className="text-red-600 text-sm mt-1">{errors.checkoutTitle.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="checkoutSubtitle">Checkout Page Subtitle</Label>
                <Input
                  {...register('checkoutSubtitle')}
                  className="mt-1"
                />
                {errors.checkoutSubtitle && (
                  <p className="text-red-600 text-sm mt-1">{errors.checkoutSubtitle.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>How did you hear from us? Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendHearFromUs('New Option' as string)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {hearFromUsFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Input
                        {...register(`hearFromUsOptions.${index}`)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHearFromUs(index)}
                        disabled={hearFromUsFields.length <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero Section Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="mr-2 h-5 w-5" aria-label="Hero section settings" />
                Checkout Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('heroEnabled')}
                    className="rounded border-neutral-300"
                  />
                  <span className="flex items-center">
                    {watch('heroEnabled') ? (
                      <>
                        <Eye className="mr-1 h-4 w-4 text-green-600" />
                        Enable Hero Section
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-4 w-4 text-neutral-400" />
                        Hero Section Disabled
                      </>
                    )}
                  </span>
                </label>
              </div>

              {watch('heroEnabled') && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <textarea
                      {...register('heroTitle')}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent mt-1"
                      rows={3}
                      placeholder="YOU'RE A\nWORLD\nCHANGER"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Use line breaks (\n) to create multi-line text
                    </p>
                    {errors.heroTitle && (
                      <p className="text-red-600 text-sm mt-1">{errors.heroTitle.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                    <Input
                      {...register('heroSubtitle')}
                      className="mt-1"
                      placeholder="Your generosity is transforming lives across Europe"
                    />
                    {errors.heroSubtitle && (
                      <p className="text-red-600 text-sm mt-1">{errors.heroSubtitle.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="heroBackgroundColor">Background Color (Tailwind CSS)</Label>
                      <Input
                        {...register('heroBackgroundColor')}
                        className="mt-1"
                        placeholder="from-[#1226AA] to-blue-800"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Use Tailwind gradient classes (e.g., &quot;from-blue-600 to-purple-700&quot;)
                      </p>
                      {errors.heroBackgroundColor && (
                        <p className="text-red-600 text-sm mt-1">{errors.heroBackgroundColor.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="heroTextColor">Text Color (Tailwind CSS)</Label>
                      <Input
                        {...register('heroTextColor')}
                        className="mt-1"
                        placeholder="text-white"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Use Tailwind text color classes (e.g., &quot;text-white&quot;, &quot;text-neutral-900&quot;)
                      </p>
                      {errors.heroTextColor && (
                        <p className="text-red-600 text-sm mt-1">{errors.heroTextColor.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Hero Preview */}
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium mb-2 block">Preview</Label>
                    <div className={`bg-gradient-to-br ${debouncedHeroFields.heroBackgroundColor || 'from-[#1226AA] to-blue-800'} rounded-2xl p-8 ${debouncedHeroFields.heroTextColor || 'text-white'} text-center`}>
                      <h1 className="text-4xl font-bold mb-4 leading-tight whitespace-pre-line">
                        {debouncedHeroFields.heroTitle || "YOU'RE A\nWORLD\nCHANGER"}
                      </h1>
                      <p className="text-lg opacity-90">
                        {debouncedHeroFields.heroSubtitle || "Your generosity is transforming lives across Europe"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#1226AA] hover:bg-blue-800 px-8"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}