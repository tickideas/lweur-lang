// src/app/admin/languages/page.tsx
// Modern admin interface for managing languages with card-based layout and visual indicators
// Provides comprehensive language management with better UX than traditional table layout
// RELEVANT FILES: admin-layout.tsx, api/admin/languages/route.ts, types/index.ts, ui/card.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Languages as LanguagesIcon,
  Plus,
  Search,
  Globe,
  Users,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  BarChart3,
  X
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatNumber } from '@/utils';

type AdoptionStatus = 'AVAILABLE' | 'ADOPTED' | 'PENDING' | 'WAITLIST';

interface LanguageRow {
  id: string;
  name: string;
  nativeName: string;
  iso639Code: string;
  region: string;
  countries: string[];
  speakerCount: number;
  flagUrl: string;
  isActive: boolean;
  adoptionStatus: AdoptionStatus;
  translationNeedsSponsorship: boolean;
  priority: number;
  description?: string;
  metrics?: { adoptionCount: number; sponsorshipCount: number };
}

interface LanguageStats {
  totalLanguages: number;
  activeLanguages: number;
  adoptedLanguages: number;
  needingSponsorship: number;
  totalSpeakers: number;
}

const getStatusConfig = (status: AdoptionStatus) => {
  const configs = {
    AVAILABLE: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Available' },
    ADOPTED: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Star, label: 'Adopted' },
    PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
    WAITLIST: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle, label: 'Waitlist' }
  };
  return configs[status];
};

const getPriorityConfig = (priority: number) => {
  if (priority <= 3) return { color: 'bg-red-100 text-red-800', label: 'High Priority' };
  if (priority <= 7) return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Priority' };
  return { color: 'bg-gray-100 text-gray-600', label: 'Low Priority' };
};

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(24); // Good number for card grid
  const [total, setTotal] = useState(0);
  const [editingLanguage, setEditingLanguage] = useState<LanguageRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<LanguageRow>>({});
  const [addForm, setAddForm] = useState<Partial<LanguageRow>>({});
  
  const debouncedSearch = useDebounce(search, 300);

  // Calculate statistics
  const stats: LanguageStats = useMemo(() => {
    return {
      totalLanguages: languages.length,
      activeLanguages: languages.filter(l => l.isActive).length,
      adoptedLanguages: languages.filter(l => l.adoptionStatus === 'ADOPTED').length,
      needingSponsorship: languages.filter(l => l.translationNeedsSponsorship).length,
      totalSpeakers: languages.reduce((sum, l) => sum + l.speakerCount, 0)
    };
  }, [languages]);

  // Get unique regions for filter
  const regions = useMemo(() => {
    const regionSet = new Set(languages.map(l => l.region));
    return Array.from(regionSet).sort();
  }, [languages]);

  // Filter languages
  const filteredLanguages = useMemo(() => {
    return languages.filter(lang => {
      const matchesSearch = !debouncedSearch || 
        lang.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        lang.iso639Code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        lang.countries.some(country => country.toLowerCase().includes(debouncedSearch.toLowerCase()));
      
      const matchesRegion = !regionFilter || lang.region === regionFilter;
      const matchesStatus = !statusFilter || lang.adoptionStatus === statusFilter;
      const matchesActive = showInactive || lang.isActive;
      
      return matchesSearch && matchesRegion && matchesStatus && matchesActive;
    });
  }, [languages, debouncedSearch, regionFilter, statusFilter, showInactive]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(100)); // Load more for filtering
        
        const res = await fetch(`/api/admin/languages?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch languages');
        
        const json = await res.json();
        setLanguages(json.data || []);
        setTotal(json.pagination?.total || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadLanguages();
  }, [page]);

  const handleQuickUpdate = async (id: string, updates: Partial<LanguageRow>) => {
    try {
      const res = await fetch(`/api/admin/languages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update');
      }
      
      setLanguages(prev => prev.map(l => 
        l.id === id ? { ...l, ...updates } as LanguageRow : l
      ));
    } catch (e: any) {
      alert(e.message || 'Failed to update language');
    }
  };

  const openEditModal = (language: LanguageRow) => {
    setEditingLanguage(language);
    setEditForm({
      ...language,
      countries: Array.isArray(language.countries) ? language.countries : []
    });
  };

  const closeEditModal = () => {
    setEditingLanguage(null);
    setEditForm({});
  };

  const closeAddModal = () => {
    setShowAddForm(false);
    setAddForm({});
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.nativeName || !addForm.iso639Code) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate speaker count doesn't exceed safe integer limit
    const speakerCount = addForm.speakerCount || 0;
    if (speakerCount > Number.MAX_SAFE_INTEGER) {
      alert('Speaker count is too large. Please enter a smaller number.');
      return;
    }
    
    try {
      const newLanguageData = {
        ...addForm,
        countries: Array.isArray(addForm.countries)
          ? addForm.countries
          : String(addForm.countries || '').split(',').map(c => c.trim()).filter(Boolean),
        speakerCount,
        priority: addForm.priority || 1,
        isActive: addForm.isActive ?? true,
        adoptionStatus: addForm.adoptionStatus || 'AVAILABLE',
        translationNeedsSponsorship: addForm.translationNeedsSponsorship ?? true
      };
      
      const res = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLanguageData),
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to create language');
      }
      
      const newLanguage = await res.json();
      setLanguages(prev => [...prev, newLanguage.data]);
      setTotal(t => t + 1);
      closeAddModal();
    } catch (e: any) {
      alert(e.message || 'Failed to create language');
    }
  };

  const handleEdit = async () => {
    if (!editingLanguage || !editForm) return;
    
    try {
      const updatedData = {
        ...editForm,
        countries: Array.isArray(editForm.countries)
          ? editForm.countries
          : String(editForm.countries || '').split(',').map(c => c.trim()).filter(Boolean)
      };
      
      const res = await fetch(`/api/admin/languages/${editingLanguage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update');
      }
      
      setLanguages(prev => prev.map(l => 
        l.id === editingLanguage.id ? { ...l, ...updatedData } as LanguageRow : l
      ));
      closeEditModal();
    } catch (e: any) {
      alert(e.message || 'Failed to update language');
    }
  };

  const handleDelete = async (language: LanguageRow) => {
    const confirmMessage = `Are you sure you want to delete "${language.name}" (${language.nativeName})? This action cannot be undone and will affect any existing campaigns.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      const res = await fetch(`/api/admin/languages/${language.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to delete');
      }
      
      setLanguages(prev => prev.filter(l => l.id !== language.id));
      setTotal(t => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e.message || 'Failed to delete language');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1226AA]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
              <LanguagesIcon className="mr-3 h-8 w-8 text-[#1226AA]" />
              Languages
            </h1>
            <p className="text-neutral-600 mt-2">
              Manage European languages for adoption and translation sponsorship
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-[#1226AA] hover:bg-blue-800">
            <Plus className="mr-2 h-4 w-4" />
            Add Language
          </Button>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Languages</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.totalLanguages}</p>
                </div>
                <Globe className="h-8 w-8 text-[#1226AA]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeLanguages}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Adopted</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.adoptedLanguages}</p>
                </div>
                <Star className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Need Sponsorship</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.needingSponsorship}</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Speakers</p>
                  <p className="text-2xl font-bold text-purple-600">{formatNumber(stats.totalSpeakers)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search languages by name, code, or country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ADOPTED">Adopted</option>
                  <option value="PENDING">Pending</option>
                  <option value="WAITLIST">Waitlist</option>
                </select>
                
                <Button
                  variant="outline"
                  onClick={() => setShowInactive(!showInactive)}
                  className={showInactive ? 'bg-neutral-100' : ''}
                >
                  {showInactive ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                  {showInactive ? 'Show All' : 'Active Only'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Cards Grid */}
        {filteredLanguages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <LanguagesIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500">No languages found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLanguages.map((language) => {
              const statusConfig = getStatusConfig(language.adoptionStatus);
              const priorityConfig = getPriorityConfig(language.priority);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={language.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-neutral-900">{language.name}</h3>
                          {!language.isActive && (
                            <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-600 text-sm mb-2">{language.nativeName}</p>
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                          
                          {language.priority <= 7 && (
                            <span className={`px-2 py-1 text-xs rounded-full ${priorityConfig.color}`}>
                              {priorityConfig.label}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditModal(language)}
                          className="opacity-60 hover:opacity-100"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(language)}
                          className="opacity-60 hover:opacity-100 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500">ISO Code</p>
                          <p className="font-medium">{language.iso639Code.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Region</p>
                          <p className="font-medium">{language.region}</p>
                        </div>
                      </div>
                      
                      {/* Countries */}
                      <div>
                        <p className="text-neutral-500 text-sm mb-1">Countries</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <MapPin className="h-3 w-3 text-neutral-400" />
                          <span className="text-sm">{language.countries.join(', ')}</span>
                        </div>
                      </div>
                      
                      {/* Speakers */}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm">
                          <span className="font-semibold">{formatNumber(Number(language.speakerCount))}</span> speakers
                        </span>
                      </div>
                      
                      {/* Metrics */}
                      {language.metrics && (
                        <div className="flex items-center gap-4 pt-2 border-t border-neutral-100">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-neutral-600">
                              {language.metrics.adoptionCount} adopted
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-neutral-600">
                              {language.metrics.sponsorshipCount} sponsored
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleQuickUpdate(language.id, { 
                            isActive: !language.isActive 
                          })}
                        >
                          {language.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        {language.translationNeedsSponsorship && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickUpdate(language.id, { 
                              translationNeedsSponsorship: false 
                            })}
                          >
                            <Zap className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Results Summary */}
        <div className="text-center text-sm text-neutral-500">
          Showing {filteredLanguages.length} of {languages.length} languages
        </div>
      </div>

      {/* Edit Language Modal */}
      {editingLanguage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Edit Language</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Update information for {editingLanguage.name}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeEditModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Language Name *
                  </label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="English"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Native Name *
                  </label>
                  <Input
                    value={editForm.nativeName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nativeName: e.target.value }))}
                    placeholder="English"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    ISO 639 Code *
                  </label>
                  <Input
                    value={editForm.iso639Code || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, iso639Code: e.target.value }))}
                    placeholder="en"
                  />
                </div>
              </div>

              {/* Geographic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Region *
                  </label>
                  <Input
                    value={editForm.region || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Western Europe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Countries (comma separated) *
                  </label>
                  <Input
                    value={Array.isArray(editForm.countries) ? editForm.countries.join(', ') : editForm.countries || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, countries: e.target.value.split(',').map(c => c.trim()) }))}
                    placeholder="GB, US, AU"
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Speaker Count *
                  </label>
                  <Input
                    type="number"
                    value={editForm.speakerCount || 0}
                    onChange={(e) => setEditForm(prev => ({ ...prev, speakerCount: Number(e.target.value) }))}
                    placeholder="1500000000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Priority (1-100) *
                  </label>
                  <Input
                    type="number"
                    value={editForm.priority || 1}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    placeholder="1"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Lower numbers = higher priority</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Flag URL
                  </label>
                  <Input
                    value={editForm.flagUrl || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, flagUrl: e.target.value }))}
                    placeholder="https://example.com/flag.svg"
                  />
                </div>
              </div>

              {/* Status Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Adoption Status
                  </label>
                  <select
                    value={editForm.adoptionStatus || 'AVAILABLE'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, adoptionStatus: e.target.value as AdoptionStatus }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ADOPTED">Adopted</option>
                    <option value="PENDING">Pending</option>
                    <option value="WAITLIST">Waitlist</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-6 pt-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.isActive ?? true}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-neutral-300 focus:ring-[#1226AA]"
                    />
                    <span className="text-sm font-medium text-neutral-700">Active</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.translationNeedsSponsorship ?? true}
                      onChange={(e) => setEditForm(prev => ({ ...prev, translationNeedsSponsorship: e.target.checked }))}
                      className="rounded border-neutral-300 focus:ring-[#1226AA]"
                    />
                    <span className="text-sm font-medium text-neutral-700">Needs Translation</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                  rows={3}
                  placeholder="Optional description about this language..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button onClick={handleEdit} className="bg-[#1226AA] hover:bg-blue-800">
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Language Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Add New Language</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Create a new language for adoption and translation sponsorship
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeAddModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Language Name *
                  </label>
                  <Input
                    value={addForm.name || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="English"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Native Name *
                  </label>
                  <Input
                    value={addForm.nativeName || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, nativeName: e.target.value }))}
                    placeholder="English"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    ISO 639 Code *
                  </label>
                  <Input
                    value={addForm.iso639Code || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, iso639Code: e.target.value }))}
                    placeholder="en"
                  />
                </div>
              </div>

              {/* Geographic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Region *
                  </label>
                  <Input
                    value={addForm.region || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Western Europe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Countries (comma separated) *
                  </label>
                  <Input
                    value={Array.isArray(addForm.countries) ? addForm.countries.join(', ') : addForm.countries || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, countries: e.target.value.split(',').map(c => c.trim()) }))}
                    placeholder="GB, US, AU"
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Speaker Count *
                  </label>
                  <Input
                    type="number"
                    value={addForm.speakerCount || 0}
                    onChange={(e) => setAddForm(prev => ({ ...prev, speakerCount: Number(e.target.value) }))}
                    placeholder="1500000000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Priority (1-100) *
                  </label>
                  <Input
                    type="number"
                    value={addForm.priority || 1}
                    onChange={(e) => setAddForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    placeholder="1"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Lower numbers = higher priority</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Flag URL
                  </label>
                  <Input
                    value={addForm.flagUrl || ''}
                    onChange={(e) => setAddForm(prev => ({ ...prev, flagUrl: e.target.value }))}
                    placeholder="https://example.com/flag.svg"
                  />
                </div>
              </div>

              {/* Status Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Adoption Status
                  </label>
                  <select
                    value={addForm.adoptionStatus || 'AVAILABLE'}
                    onChange={(e) => setAddForm(prev => ({ ...prev, adoptionStatus: e.target.value as AdoptionStatus }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ADOPTED">Adopted</option>
                    <option value="PENDING">Pending</option>
                    <option value="WAITLIST">Waitlist</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-6 pt-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addForm.isActive ?? true}
                      onChange={(e) => setAddForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-neutral-300 focus:ring-[#1226AA]"
                    />
                    <span className="text-sm font-medium text-neutral-700">Active</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addForm.translationNeedsSponsorship ?? true}
                      onChange={(e) => setAddForm(prev => ({ ...prev, translationNeedsSponsorship: e.target.checked }))}
                      className="rounded border-neutral-300 focus:ring-[#1226AA]"
                    />
                    <span className="text-sm font-medium text-neutral-700">Needs Translation</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={addForm.description || ''}
                  onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1226AA] focus:border-transparent"
                  rows={3}
                  placeholder="Optional description about this language..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
              <Button variant="outline" onClick={closeAddModal}>
                Cancel
              </Button>
              <Button onClick={handleAdd} className="bg-[#1226AA] hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" />
                Add Language
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}