// src/hooks/useTypedFieldArray.ts
// Custom hook for properly typed useFieldArray calls
// Provides better type safety and IntelliSense for form field arrays
// RELEVANT FILES: checkout-settings/page.tsx, react-hook-form types

import { useFieldArray, Control, ArrayPath, FieldValues, FieldArray } from 'react-hook-form';

/**
 * Typed wrapper around useFieldArray that provides better type inference
 * @param control - Form control object
 * @param name - Field name (must be a valid array path)
 * @returns Properly typed field array functions
 */
export function useTypedFieldArray<
  TFieldValues extends FieldValues,
  TFieldArrayName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
>({
  control,
  name,
  keyName
}: {
  control: Control<TFieldValues>;
  name: TFieldArrayName;
  keyName?: TKeyName;
}) {
  return useFieldArray<TFieldValues, TFieldArrayName, TKeyName>({
    control,
    name,
    keyName
  } as Parameters<typeof useFieldArray<TFieldValues, TFieldArrayName, TKeyName>>[0]);
}

/**
 * Specialized hook for checkout settings form field arrays
 */
export type CheckoutSettingsFormType = {
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
  generalDonationDefaultAmount: number;
  generalDonationPresetAmounts: number[];
  generalDonationMinAmount: number;
  generalDonationMaxAmount: number;
  showOneTimeOption: boolean;
  requirePhone: boolean;
  requireOrganization: boolean;
  hearFromUsOptions: string[];
  checkoutTitle: string;
  checkoutSubtitle: string;
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundColor: string;
  heroTextColor: string;
};

export function useCheckoutSettingsFieldArray<
  TFieldArrayName extends keyof Pick<
    CheckoutSettingsFormType, 
    'adoptLanguagePresetAmounts' | 'sponsorTranslationPresetAmounts' | 'generalDonationPresetAmounts' | 'hearFromUsOptions'
  >
>(
  control: Control<CheckoutSettingsFormType>,
  name: TFieldArrayName
) {
  return useFieldArray({
    control,
    name: name as never
  });
}