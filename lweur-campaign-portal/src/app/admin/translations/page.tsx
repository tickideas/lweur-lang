// src/app/admin/translations/page.tsx
// Modern admin page for managing live translation sponsorship needs
// Provides card-based interface for languages requiring translation sponsorship
// RELEVANT FILES: languages/page.tsx, api/admin/languages/route.ts, checkout/page.tsx, sponsor-translation/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Globe,
  Search,
  BookmarkPlus,
  Languages,
  Users,
  Star,
  MapPin,
  Zap,
  Edit3,
  Check,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatNumber, getCountryFlag } from '@/utils';

interface LanguageRow {
  id: string;
  name: string;
  nativeName: string;
  iso639Code: string;
  region: string;
  countries: string[];
  translationNeedsSponsorship: boolean;
  priority: number;
  description?: string;
  speakerCount: number;
  flagUrl?: string;
  metrics?: { sponsorshipCount: number };
  campaignStats: {
    adoptionCampaigns: number;
    translationCampaigns: number;
    totalCampaigns: number;
  };
}

export default function TranslationsPage() {
  const [items, setItems] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'speakers' | 'sponsors'>('priority');
  const [editingItem, setEditingItem] = useState<LanguageRow | null>(null);
  const [editForm, setEditForm] = useState<Partial<LanguageRow> | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Filter and sort items based on user selections
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesSearch = !debouncedSearch || 
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.nativeName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.iso639Code.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesRegion = selectedRegion === 'all' || item.region === selectedRegion;
      
      return matchesSearch && matchesRegion;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'speakers':
          return b.speakerCount - a.speakerCount;
        case 'sponsors':
          return (b.campaignStats?.translationCampaigns || 0) - (a.campaignStats?.translationCampaigns || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, debouncedSearch, selectedRegion, sortBy]);

  // Get unique regions for filter
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(items.map(item => item.region))].sort();
    return uniqueRegions;
  }, [items]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const totalSponsors = items.reduce((sum, item) => sum + (item.campaignStats?.translationCampaigns || 0), 0);
    const totalSpeakers = items.reduce((sum, item) => sum + item.speakerCount, 0);
    const highPriority = items.filter(item => item.priority <= 10).length;
    
    return { total, totalSponsors, totalSpeakers, highPriority };
  }, [items]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/languages?limit=100');
        if (!res.ok) throw new Error('Failed to fetch languages');
        const json = await res.json();
        const filtered = (json.data || []).filter((l: any) => l.translationNeedsSponsorship);
        setItems(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdate = async (id: string, updates: Partial<LanguageRow>) => {
    try {
      const res = await fetch(`/api/admin/languages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to update');
      setItems((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } as LanguageRow : l)));
    } catch (e: any) {
      alert(e.message || 'Failed to update language');
    }
  };

  const openEditModal = (item: LanguageRow) => {
    setEditingItem(item);
    setEditForm({
      priority: item.priority,
      description: item.description || ''
    });
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditForm(null);
  };

  const handleEdit = async () => {
    if (!editingItem || !editForm) return;
    
    try {
      await handleUpdate(editingItem.id, editForm);
      closeEditModal();
    } catch (e: any) {
      // Error already handled in handleUpdate
    }
  };

  const handleFulfillSponsorship = async (item: LanguageRow) => {
    if (confirm(`Mark translation sponsorship for ${item.name} as fulfilled? This will remove it from the sponsorship needs list.`)) {
      await handleUpdate(item.id, { translationNeedsSponsorship: false });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Translation Sponsorships</h1>
            <p className="text-neutral-600 mt-2">
              Manage languages needing live translation support for Passacris broadcasting
            </p>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Languages className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Languages Needing Sponsorship</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Active Sponsors</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalSponsors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Total Speakers</p>
                  <p className="text-2xl font-bold text-purple-900">{formatNumber(stats.totalSpeakers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-amber-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-amber-600">High Priority</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.highPriority}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search languages by name, native name, or ISO code..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              {/* Region Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-neutral-500" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-neutral-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                >
                  <option value="priority">Sort by Priority</option>
                  <option value="speakers">Sort by Speakers</option>
                  <option value="sponsors">Sort by Sponsors</option>
                </select>
              </div>
            </div>
            
            {filteredItems.length !== items.length && (
              <div className="mt-4 text-sm text-neutral-600">
                Showing {filteredItems.length} of {items.length} languages
              </div>
            )}
          </CardContent>
        </Card>

        {/* Languages Grid */}
        {loading ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1226AA] mx-auto"></div>
                <p className="mt-4 text-neutral-600">Loading translation opportunities...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Languages className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {items.length === 0 ? 'No Translation Needs' : 'No Results Found'}
                </h3>
                <p className="text-neutral-600">
                  {items.length === 0 
                    ? 'All languages currently have adequate translation sponsorship.'
                    : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow duration-200 relative">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {item.flagUrl ? (
                        <img
                          src={item.flagUrl}
                          alt={`${item.name} flag`}
                          className="w-10 h-7 rounded object-cover border border-neutral-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div className="text-2xl" style={{ display: item.flagUrl ? 'none' : 'block' }}>
                        {item.countries[0] ? getCountryFlag(item.countries[0]) : '🌍'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg leading-6">{item.name}</CardTitle>
                        <p className="text-sm text-neutral-500">{item.nativeName}</p>
                      </div>
                    </div>
                    
                    {item.priority <= 10 && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        <Star className="h-3 w-3 mr-1" />
                        Priority
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-neutral-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{item.region}</span>
                    </div>
                    <div className="flex items-center text-neutral-600">
                      <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{item.iso639Code}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-neutral-600">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{formatNumber(item.speakerCount)} speakers</span>
                    </div>
                    <div className="flex items-center text-neutral-600">
                      <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{item.campaignStats?.translationCampaigns || 0} sponsors</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Priority Level:</span>
                    <Badge variant={item.priority <= 10 ? 'default' : 'secondary'}>
                      {item.priority}
                    </Badge>
                  </div>
                  
                  {item.description && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-sm text-neutral-700 line-clamp-3">{item.description}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-700 hover:text-green-800 hover:bg-green-50"
                      onClick={() => handleFulfillSponsorship(item)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Fulfill
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && editForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Edit Translation Sponsorship
                </h3>
                <button 
                  onClick={closeEditModal}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="font-medium text-neutral-900 mb-2">{editingItem.name}</p>
                  <p className="text-sm text-neutral-500">{editingItem.nativeName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Priority Level
                  </label>
                  <Input
                    type="number"
                    value={editForm.priority || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter priority (1-100)"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Lower numbers indicate higher priority (1-10 are high priority)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                    rows={4}
                    placeholder="Add description about translation needs..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 p-6 border-t bg-neutral-50">
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEdit}
                  className="flex-1 bg-[#1226AA] hover:bg-blue-800 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

