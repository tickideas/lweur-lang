import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency amounts
export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount / 100); // Convert from pence to pounds
}

// Format dates
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Format numbers with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-GB').format(num);
}

// Generate initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (basic validation)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\\+]?[1-9][\\d\\s\\-\\(\\)]{7,15}$/;
  return phoneRegex.test(phone.replace(/\\s/g, ''));
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Slugify text for URLs
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\\w\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Truncate text
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

// Convert snake_case to Title Case
export function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\\w\\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Get country flag emoji from country code
export function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// European countries mapping
export const EUROPEAN_COUNTRIES = {
  'AD': 'Andorra',
  'AL': 'Albania',
  'AT': 'Austria',
  'BA': 'Bosnia and Herzegovina',
  'BE': 'Belgium',
  'BG': 'Bulgaria',
  'BY': 'Belarus',
  'CH': 'Switzerland',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DE': 'Germany',
  'DK': 'Denmark',
  'EE': 'Estonia',
  'ES': 'Spain',
  'FI': 'Finland',
  'FR': 'France',
  'GB': 'United Kingdom',
  'GE': 'Georgia',
  'GR': 'Greece',
  'HR': 'Croatia',
  'HU': 'Hungary',
  'IE': 'Ireland',
  'IS': 'Iceland',
  'IT': 'Italy',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'LV': 'Latvia',
  'MC': 'Monaco',
  'MD': 'Moldova',
  'ME': 'Montenegro',
  'MK': 'North Macedonia',
  'MT': 'Malta',
  'NL': 'Netherlands',
  'NO': 'Norway',
  'PL': 'Poland',
  'PT': 'Portugal',
  'RO': 'Romania',
  'RS': 'Serbia',
  'RU': 'Russia',
  'SE': 'Sweden',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'SM': 'San Marino',
  'TR': 'Turkey',
  'UA': 'Ukraine',
  'VA': 'Vatican City',
} as const;

// Get European regions
export const EUROPEAN_REGIONS = {
  'Northern Europe': ['DK', 'EE', 'FI', 'IS', 'IE', 'LV', 'LT', 'NO', 'SE', 'GB'],
  'Western Europe': ['AT', 'BE', 'FR', 'DE', 'LI', 'LU', 'MC', 'NL', 'CH'],
  'Southern Europe': ['AD', 'AL', 'BA', 'BG', 'HR', 'CY', 'GR', 'IT', 'MT', 'ME', 'MK', 'PT', 'RO', 'SM', 'RS', 'SI', 'ES', 'VA'],
  'Eastern Europe': ['BY', 'CZ', 'HU', 'MD', 'PL', 'RU', 'SK', 'UA'],
  'Transcontinental': ['GE', 'TR'],
} as const;

// Storage utilities
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle quota exceeded or other errors
    }
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// API error handling
export class APIError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: any): APIError {
  if (error instanceof APIError) {
    return error;
  }
  
  if (error.response) {
    return new APIError(
      error.response.data?.message || 'An error occurred',
      error.response.status,
      error.response.data?.code
    );
  }
  
  return new APIError('Network error occurred', 500);
}"