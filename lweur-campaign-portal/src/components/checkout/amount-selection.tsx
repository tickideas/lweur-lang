// src/components/checkout/amount-selection.tsx
// Amount selection component matching CBN Europe design flow
// Provides preset amounts, custom amount input, currency selection, and one-time vs monthly toggle
// RELEVANT FILES: checkout-form.tsx, checkout-wizard.tsx, checkout/page.tsx, prisma/schema.prisma

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  Heart, 
  Zap, 
  Languages,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/utils';
import { CampaignType } from '@/types';

interface CheckoutSettings {
  id: string;
  availableCurrencies: string[];
  defaultCurrency: string;
  adoptLanguageDefaultAmount: number;
  adoptLanguagePresetAmounts: number[];
  adoptLanguageMinAmount: number;
  adoptLanguageMaxAmount: number;
  sponsorTranslationDefaultAmount: number;
  sponsorTranslationPresetAmounts: number[];
  sponsorTranslationMinAmount: number;
  sponsorTranslationMaxAmount: number;
  enableGiftAid: boolean;
  showOneTimeOption: boolean;
}

interface AmountSelectionProps {
  campaignType: CampaignType;
  onAmountSelect: (amount: number, currency: string, isRecurring: boolean) => void;
  settings?: CheckoutSettings;
}

export function AmountSelection({ 
  campaignType, 
  onAmountSelect, 
  settings 
}: AmountSelectionProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('GBP');
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const defaultSettings: CheckoutSettings = {
    id: 'default',
    availableCurrencies: ['GBP', 'EUR', 'USD'],
    defaultCurrency: 'GBP',
    adoptLanguageDefaultAmount: 15000,
    adoptLanguagePresetAmounts: [15000, 25000],
    adoptLanguageMinAmount: 15000,
    adoptLanguageMaxAmount: 100000,
    sponsorTranslationDefaultAmount: 15000,
    sponsorTranslationPresetAmounts: [15000, 25000],
    sponsorTranslationMinAmount: 15000,
    sponsorTranslationMaxAmount: 100000,
    enableGiftAid: true,
    showOneTimeOption: false
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/checkout-settings');
        if (response.ok) {
          const data = await response.json();
          setCheckoutSettings(data.settings);
        } else {
          setCheckoutSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error fetching checkout settings:', error);
        setCheckoutSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    if (!settings) {
      fetchSettings();
    } else {
      setCheckoutSettings(settings);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeSettings = settings || checkoutSettings;
    if (activeSettings) {
      setSelectedCurrency(activeSettings.defaultCurrency);
      const defaultAmount = campaignType === 'ADOPT_LANGUAGE' 
        ? activeSettings.adoptLanguageDefaultAmount
        : activeSettings.sponsorTranslationDefaultAmount;
      setSelectedAmount(defaultAmount);
    }
  }, [campaignType, checkoutSettings, settings]);

  const getPresetAmounts = () => {
    const activeSettings = settings || checkoutSettings;
    if (!activeSettings) return [];
    return campaignType === 'ADOPT_LANGUAGE' 
      ? activeSettings.adoptLanguagePresetAmounts
      : activeSettings.sponsorTranslationPresetAmounts;
  };

  const getMinAmount = () => {
    const activeSettings = settings || checkoutSettings;
    if (!activeSettings) return 1000;
    return campaignType === 'ADOPT_LANGUAGE' 
      ? activeSettings.adoptLanguageMinAmount
      : activeSettings.sponsorTranslationMinAmount;
  };

  const getMaxAmount = () => {
    const activeSettings = settings || checkoutSettings;
    if (!activeSettings) return 100000;
    return campaignType === 'ADOPT_LANGUAGE' 
      ? activeSettings.adoptLanguageMaxAmount
      : activeSettings.sponsorTranslationMaxAmount;
  };

  const handlePresetAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setIsCustomSelected(false);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setIsCustomSelected(true);
    const numericValue = parseFloat(value) * 100; // Convert to pence
    if (!isNaN(numericValue)) {
      setSelectedAmount(numericValue);
    }
  };

  const handleContinue = () => {
    const finalAmount = isCustomSelected && customAmount 
      ? parseFloat(customAmount) * 100 
      : selectedAmount;

    if (finalAmount >= getMinAmount() && finalAmount <= getMaxAmount()) {
      onAmountSelect(finalAmount, selectedCurrency, isRecurring);
    }
  };

  const getCampaignIcon = () => {
    return campaignType === 'ADOPT_LANGUAGE' 
      ? <Languages className="h-5 w-5" />
      : <Zap className="h-5 w-5" />;
  };

  const getCampaignTitle = () => {
    return campaignType === 'ADOPT_LANGUAGE' 
      ? 'Adopt a Language Channel'
      : 'Sponsor Live Translation';
  };

  const isValidAmount = () => {
    const amount = isCustomSelected && customAmount 
      ? parseFloat(customAmount) * 100 
      : selectedAmount;
    return amount >= getMinAmount() && amount <= getMaxAmount();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1226AA] mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading checkout options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Campaign Info */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          {getCampaignIcon()}
          <h2 className="text-2xl font-bold text-neutral-900">
            {getCampaignTitle()}
          </h2>
        </div>
        <p className="text-neutral-600 max-w-md mx-auto">
          Your contribution of £150 or more can bring the gospel to thousands of people every day
        </p>
      </div>

      {/* Amount Selection */}
      <Card>
        <CardContent className="p-8 space-y-6">
          {/* Recurring Toggle - For Future Use */}
          {(settings || checkoutSettings)?.showOneTimeOption && (
            <div className="flex items-center justify-center space-x-8">
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                  !isRecurring 
                    ? 'bg-[#1226AA] text-white' 
                    : 'text-neutral-600 hover:text-[#1226AA]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  !isRecurring ? 'bg-white border-white' : 'border-neutral-400'
                }`} />
                <span>One-time</span>
              </button>
              
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                  isRecurring 
                    ? 'bg-[#1226AA] text-white' 
                    : 'text-neutral-600 hover:text-[#1226AA]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  isRecurring ? 'bg-white border-white' : 'border-neutral-400'
                }`} />
                <span>Monthly</span>
              </button>
            </div>
          )}

          {/* Preset Amounts */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {getPresetAmounts().map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handlePresetAmountSelect(amount)}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-[#1226AA] ${
                    selectedAmount === amount && !isCustomSelected
                      ? 'border-[#1226AA] bg-blue-50'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(amount, selectedCurrency)}
                  </div>
                  {selectedAmount === amount && !isCustomSelected && (
                    <Check className="h-5 w-5 text-[#1226AA] mx-auto mt-2" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="customAmount" className="text-sm font-medium text-neutral-700">
                Any Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
                  {selectedCurrency === 'GBP' ? '£' : selectedCurrency === 'EUR' ? '€' : '$'}
                </span>
                <Input
                  id="customAmount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className={`pl-8 ${isCustomSelected ? 'border-[#1226AA]' : ''}`}
                  placeholder="0"
                  min={getMinAmount() / 100}
                  max={getMaxAmount() / 100}
                />
              </div>
              {customAmount && (
                <div className="text-sm text-neutral-500">
                  Minimum: {formatCurrency(getMinAmount(), selectedCurrency)} • 
                  Maximum: {formatCurrency(getMaxAmount(), selectedCurrency)}
                </div>
              )}
            </div>
          </div>

          {/* Currency Selector */}
          {(settings || checkoutSettings)?.availableCurrencies.length > 1 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">
                Currency
              </Label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
              >
                {((settings || checkoutSettings)?.availableCurrencies || []).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Impact Message */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Heart className="h-5 w-5 text-[#1226AA] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-[#1226AA] mb-1">
                  Put your hope into action!
                </p>
                <p className="text-sm text-neutral-600">
                  Your {isRecurring ? 'monthly' : 'one-time'} donation will directly support 
                  {campaignType === 'ADOPT_LANGUAGE' 
                    ? ' your chosen language channel, reaching thousands daily'
                    : ' live translation services, breaking language barriers'
                  }.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="text-center">
        <Button
          onClick={handleContinue}
          disabled={!isValidAmount()}
          size="lg"
          className="w-full sm:w-auto px-12 bg-[#1226AA] hover:bg-blue-800 text-white"
        >
          Next
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        {!isValidAmount() && (customAmount || selectedAmount) && (
          <p className="mt-2 text-sm text-red-600">
            Please enter an amount between {formatCurrency(getMinAmount(), selectedCurrency)} and {formatCurrency(getMaxAmount(), selectedCurrency)}
          </p>
        )}
      </div>
    </div>
  );
}