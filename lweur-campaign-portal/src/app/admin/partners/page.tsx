'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Search,
  Download,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';

interface Partner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  country: string;
  createdAt: string;
  firstContributionAt?: string | null;
  lastContributionAt?: string | null;
  campaigns: {
    id: string;
    type: string;
    status: string;
    monthlyAmount: number;
    language: {
      name: string;
    };
  }[];
  totalContributions: number;
}

export default function PartnersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [countries, setCountries] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, countryFilter, page, limit]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch('/api/admin/partners/countries');
        if (res.ok) {
          const json = await res.json();
          setCountries(json.countries || []);
        }
      } catch (e) {
        console.error('Failed to load countries', e);
      }
    };
    loadCountries();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (countryFilter) params.set('country', countryFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await fetch(`/api/admin/partners?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load partners');
      const json = await res.json();
      setPartners(json.data as Partner[]);
      setTotal(json.pagination?.total ?? 0);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFinances = async (partner: Partner) => {
    const confirmMsg = `Reset all financial givings for ${partner.firstName} ${partner.lastName}?

This will:
- Delete all payment records (${formatCurrency(partner.totalContributions)} total)
- Cancel all active Stripe subscriptions
- Set all campaigns to CANCELLED status
- Keep partner account intact

⚠️ This action CANNOT be undone. Continue?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/partners/${partner.id}/reset-finances`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset finances');
      }

      const data = await res.json();
      alert(`✓ Success: ${data.message}${data.warnings ? '\n\nWarnings:\n' + data.warnings.join('\n') : ''}`);
      fetchPartners(); // Refresh list
    } catch (err: any) {
      alert(`✗ Error: ${err.message}`);
    }
  };

  const handleDeletePartner = async (partner: Partner) => {
    const activeCampaigns = partner.campaigns.filter(c => c.status === 'ACTIVE').length;

    const confirmMsg = `⚠️ DELETE partner ${partner.firstName} ${partner.lastName} completely?

This will PERMANENTLY delete:
- Partner account
- ${partner.campaigns.length} campaign(s) (${activeCampaigns} active)
- All payment records (${formatCurrency(partner.totalContributions)} total)
- All communication history
- Stripe customer data

⚠️ This action CANNOT be undone and CANNOT be recovered.

Are you absolutely sure?`;

    if (!confirm(confirmMsg)) return;

    // Double confirmation for extra safety
    const lastName = partner.lastName.toUpperCase();
    const doubleConfirm = prompt(`Type "${lastName}" to confirm deletion:`);
    if (doubleConfirm !== lastName) {
      alert('Deletion cancelled - confirmation did not match');
      return;
    }

    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete partner');
      }

      const data = await res.json();
      alert(`✓ Success: ${data.message}${data.warnings ? '\n\nWarnings:\n' + data.warnings.join('\n') : ''}`);
      fetchPartners(); // Refresh list
    } catch (err: any) {
      alert(`✗ Error: ${err.message}`);
    }
  };

  const filteredPartners = partners; // Already filtered server-side

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'ACTIVE':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'PAUSED':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'CANCELLED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCountryName = (code: string) => {
    const countries: Record<string, string> = {
      GB: 'United Kingdom',
      FR: 'France',
      DE: 'Germany',
      ES: 'Spain',
      IT: 'Italy',
    };
    return countries[code] || code;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading partners...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-600">Manage and communicate with campaign supporters</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (countryFilter) params.set('country', countryFilter);
            params.set('all', 'true');
            params.set('format', 'csv');
            const res = await fetch(`/api/admin/partners?${params.toString()}`);
            if (!res.ok) return alert('Failed to export');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `partners-export-${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners by name, email, or organization..."
                className="form-input pl-10 h-12"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className="flex gap-3 items-center w-full lg:w-auto">
              <select
                className="form-input h-12"
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{getCountryName(c)}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">Rows:</span>
                <select
                  className="form-input w-24 h-12"
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Partners</p>
                <p className="text-2xl font-semibold text-gray-900">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Contributions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(filteredPartners.reduce((sum, p) => sum + p.totalContributions, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredPartners.reduce((sum, p) => sum + p.campaigns.filter(c => c.status === 'ACTIVE').length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Countries</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(filteredPartners.map(p => p.country)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners List */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Partners ({filteredPartners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaigns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Contributions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Contribution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {partner.firstName[0]}{partner.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {partner.firstName} {partner.lastName}
                          </div>
                          {partner.organization && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {partner.organization}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="h-3 w-3 mr-2 text-gray-400" />
                          {partner.email}
                        </div>
                        {partner.phoneNumber && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                            {partner.phoneNumber}
                          </div>
                        )}
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                          {getCountryName(partner.country)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {partner.campaigns.map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-medium">
                                {campaign.language.name === 'General Ministry' ? 'General' : campaign.language.name}
                              </span>
                              <span className="text-gray-500 ml-2">
                                ({campaign.language.name === 'General Ministry' ? 'Donation' : 
                                  campaign.type === 'ADOPT_LANGUAGE' ? 'Adoption' : 'Translation'})
                              </span>
                            </div>
                            <span className={getStatusBadge(campaign.status)}>
                              {campaign.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(partner.totalContributions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {partner.lastContributionAt ? formatDate(partner.lastContributionAt) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/partners/${partner.id}`)}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => (window.location.href = `mailto:${partner.email}`)}>
                          <Mail className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(partner.email);
                              setCopiedId(partner.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            } catch {
                              alert('Failed to copy email');
                            }
                          }}
                        >
                          {copiedId === partner.id ? 'Copied' : 'Copy Email'}
                        </Button>
                        {session?.user?.role === 'SUPER_ADMIN' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetFinances(partner)}
                              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reset Finances
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePartner(partner)}
                              className="border-red-500 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPartners.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No partners found</h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}

          {filteredPartners.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
