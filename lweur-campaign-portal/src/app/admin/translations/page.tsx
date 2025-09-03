'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Globe,
  Search,
  BookmarkPlus,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

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
  metrics?: { sponsorshipCount: number };
}

export default function TranslationsPage() {
  const [items, setItems] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
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
        // get all languages then filter client-side to keep API simple
        const res = await fetch(`/api/admin/languages?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch languages');
        const json = await res.json();
        const filtered = (json.data || []).filter((l: any) => l.translationNeedsSponsorship);
        setItems(filtered);
        // total = count of all needing sponsorship (approximate; here set to filtered length)
        setTotal(filtered.length);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedSearch, page, limit]);

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

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Translations</h1>
          <p className="text-gray-600">Manage languages that need live translation sponsorship</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search languages..."
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Globe className="h-5 w-5 mr-2" /> Translation Sponsorship ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Sponsors</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-gray-500">{l.nativeName}</div>
                      </td>
                      <td className="px-4 py-3">{l.iso639Code}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="form-input w-24"
                          defaultValue={l.priority}
                          onBlur={(e) => {
                            const val = Number(e.currentTarget.value);
                            if (val !== l.priority) handleUpdate(l.id, { priority: val });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {l.metrics?.sponsorshipCount ?? 0}
                      </td>
                      <td className="px-4 py-3 max-w-[380px]">
                        <textarea
                          className="form-input w-full"
                          defaultValue={l.description || ''}
                          rows={2}
                          onBlur={(e) => {
                            const val = e.currentTarget.value;
                            if (val !== (l.description || '')) handleUpdate(l.id, { description: val });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdate(l.id, { translationNeedsSponsorship: false })}
                        >
                          <BookmarkPlus className="h-3 w-3 mr-1" />
                          Mark as Fulfilled
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(!loading && items.length === 0) && (
            <div className="text-center py-16 text-gray-500">No languages currently needing translation sponsorship.</div>
          )}

          {items.length > 0 && (
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

