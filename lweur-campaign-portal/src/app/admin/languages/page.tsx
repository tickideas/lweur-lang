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
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

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

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newLang, setNewLang] = useState<Partial<LanguageRow>>({
    name: '',
    nativeName: '',
    iso639Code: '',
    region: '',
    countries: [],
    speakerCount: 0,
    flagUrl: '',
    isActive: true,
    adoptionStatus: 'AVAILABLE',
    translationNeedsSponsorship: true,
    priority: 1,
    description: '',
  });
  const debouncedSearch = useDebounce(search, 300);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        params.set('page', String(page));
        params.set('limit', String(limit));
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
    load();
  }, [debouncedSearch, page, limit]);

  const resetNew = () => setNewLang({
    name: '', nativeName: '', iso639Code: '', region: '', countries: [], speakerCount: 0,
    flagUrl: '', isActive: true, adoptionStatus: 'AVAILABLE', translationNeedsSponsorship: true, priority: 1, description: '',
  });

  const handleCreate = async () => {
    try {
      setSavingId('new');
      const payload = {
        ...newLang,
        countries: Array.isArray(newLang.countries)
          ? newLang.countries
          : String(newLang.countries || '').split(',').map((c) => String(c).trim()).filter(Boolean),
      };
      const res = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to create');
      }
      setShowAdd(false);
      resetNew();
      // reload first page
      setPage(1);
      setSearch('');
    } catch (e: any) {
      alert(e.message || 'Failed to create language');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<LanguageRow>) => {
    try {
      setSavingId(id);
      const res = await fetch(`/api/admin/languages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update');
      }
      setLanguages((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } as LanguageRow : l)));
    } catch (e: any) {
      alert(e.message || 'Failed to update language');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this language? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/languages/${id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to delete');
      setLanguages((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e.message || 'Failed to delete language');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Languages</h1>
          <p className="text-gray-600">Manage languages for adoption and translation sponsorship</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAdd((s) => !s)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Language
          </Button>
        </div>
      </div>

      {/* Add new language form */}
      {showAdd && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Language</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input value={newLang.name || ''} onChange={(e) => setNewLang((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Native Name</label>
                <Input value={newLang.nativeName || ''} onChange={(e) => setNewLang((s) => ({ ...s, nativeName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISO 639 Code</label>
                <Input value={newLang.iso639Code || ''} onChange={(e) => setNewLang((s) => ({ ...s, iso639Code: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <Input value={newLang.region || ''} onChange={(e) => setNewLang((s) => ({ ...s, region: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Countries (comma separated)</label>
                <Input value={Array.isArray(newLang.countries) ? newLang.countries.join(', ') : (newLang.countries as any) || ''} onChange={(e) => setNewLang((s) => ({ ...s, countries: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Speaker Count</label>
                <Input type="number" value={newLang.speakerCount || 0} onChange={(e) => setNewLang((s) => ({ ...s, speakerCount: Number(e.target.value) }))} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Flag URL</label>
                <Input value={newLang.flagUrl || ''} onChange={(e) => setNewLang((s) => ({ ...s, flagUrl: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <Input type="number" value={newLang.priority || 1} onChange={(e) => setNewLang((s) => ({ ...s, priority: Number(e.target.value) }))} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="form-input w-full" rows={3} value={newLang.description || ''} onChange={(e) => setNewLang((s) => ({ ...s, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="form-checkbox" checked={!!newLang.isActive} onChange={(e) => setNewLang((s) => ({ ...s, isActive: e.target.checked }))} />
                <span>Active</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="form-checkbox" checked={!!newLang.translationNeedsSponsorship} onChange={(e) => setNewLang((s) => ({ ...s, translationNeedsSponsorship: e.target.checked }))} />
                <span>Needs Translation Sponsorship</span>
              </label>
              <div className="flex items-center gap-2">
                <span>Adoption Status:</span>
                <select className="form-input" value={newLang.adoptionStatus} onChange={(e) => setNewLang((s) => ({ ...s, adoptionStatus: e.target.value as AdoptionStatus }))}>
                  {['AVAILABLE','ADOPTED','PENDING','WAITLIST'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={savingId === 'new'}>
                <Check className="h-4 w-4 mr-2" />
                {savingId === 'new' ? 'Creating...' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); resetNew(); }}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search languages by name, code or region..."
                className="form-input pl-10 h-12"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm text-gray-600">Rows:</span>
              <select
                className="form-input h-12 w-24"
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><LanguagesIcon className="h-5 w-5 mr-2" /> Languages ({languages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading languages…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Countries</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speakers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adoption</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Needs Translation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metrics</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {languages.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-gray-500">{l.nativeName}</div>
                      </td>
                      <td className="px-4 py-3">{l.iso639Code}</td>
                      <td className="px-4 py-3">{l.region}</td>
                      <td className="px-4 py-3 max-w-[240px] truncate" title={l.countries.join(', ')}>
                        {l.countries.join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="form-input w-28"
                          defaultValue={l.speakerCount}
                          onBlur={(e) => {
                            const val = Number(e.currentTarget.value);
                            if (val !== l.speakerCount) handleUpdate(l.id, { speakerCount: val });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="form-input"
                          defaultValue={l.adoptionStatus}
                          onChange={(e) => handleUpdate(l.id, { adoptionStatus: e.target.value as AdoptionStatus })}
                        >
                          {['AVAILABLE','ADOPTED','PENDING','WAITLIST'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            defaultChecked={l.translationNeedsSponsorship}
                            onChange={(e) => handleUpdate(l.id, { translationNeedsSponsorship: e.target.checked })}
                          />
                          <span className="text-sm">{l.translationNeedsSponsorship ? 'Yes' : 'No'}</span>
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="form-input w-20"
                          defaultValue={l.priority}
                          onBlur={(e) => {
                            const val = Number(e.currentTarget.value);
                            if (val !== l.priority) handleUpdate(l.id, { priority: val });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            defaultChecked={l.isActive}
                            onChange={(e) => handleUpdate(l.id, { isActive: e.target.checked })}
                          />
                          <span className="text-sm">{l.isActive ? 'Active' : 'Inactive'}</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <span>Adopt: {l.metrics?.adoptionCount ?? 0}</span>
                          <span>Trans: {l.metrics?.sponsorshipCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => window.open(l.flagUrl, '_blank')}
                        >
                          Flag
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === l.id}
                          onClick={() => handleDelete(l.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(!loading && languages.length === 0) && (
            <div className="text-center py-16 text-gray-500">No languages found.</div>
          )}

          {languages.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
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

