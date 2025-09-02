'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';

interface Partner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  country: string;
  createdAt: string;
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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockPartners: Partner[] = [
        {
          id: '1',
          email: 'john.smith@example.com',
          firstName: 'John',
          lastName: 'Smith',
          phoneNumber: '+44 20 1234 5678',
          organization: 'London Christian Center',
          country: 'GB',
          createdAt: '2024-01-15T10:00:00Z',
          campaigns: [
            {
              id: 'c1',
              type: 'ADOPT_LANGUAGE',
              status: 'ACTIVE',
              monthlyAmount: 15000,
              language: { name: 'German' },
            },
          ],
          totalContributions: 45000,
        },
        {
          id: '2',
          email: 'sarah.johnson@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          country: 'FR',
          createdAt: '2024-02-20T14:30:00Z',
          campaigns: [
            {
              id: 'c2',
              type: 'SPONSOR_TRANSLATION',
              status: 'ACTIVE',
              monthlyAmount: 15000,
              language: { name: 'French' },
            },
          ],
          totalContributions: 30000,
        },
        {
          id: '3',
          email: 'david.brown@example.com',
          firstName: 'David',
          lastName: 'Brown',
          organization: 'Grace Church',
          country: 'DE',
          createdAt: '2024-03-10T09:15:00Z',
          campaigns: [
            {
              id: 'c3',
              type: 'ADOPT_LANGUAGE',
              status: 'ACTIVE',
              monthlyAmount: 15000,
              language: { name: 'Spanish' },
            },
          ],
          totalContributions: 15000,
        },
      ];
      setPartners(mockPartners);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = searchTerm === '' || 
      partner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (partner.organization && partner.organization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCountry = countryFilter === '' || partner.country === countryFilter;
    
    return matchesSearch && matchesCountry;
  });

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
              <p className="text-gray-600">Manage and communicate with campaign supporters</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/admin">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search partners by name, email, or organization..."
                  className="form-input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  className="form-input"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                >
                  <option value="">All Countries</option>
                  <option value="GB">United Kingdom</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                </select>
                
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Partners</p>
                  <p className="text-2xl font-semibold text-gray-900">{filteredPartners.length}</p>
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
      </div>

      {/* Partners List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card>
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
                      Joined
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
                                <span className="font-medium">{campaign.language.name}</span>
                                <span className="text-gray-500 ml-2">
                                  ({campaign.type === 'ADOPT_LANGUAGE' ? 'Adoption' : 'Translation'})
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
                        {formatDate(partner.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}