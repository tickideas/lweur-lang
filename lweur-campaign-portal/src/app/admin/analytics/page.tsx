'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, BarChart3, Activity } from 'lucide-react';

interface DashboardOverview {
  totalRevenue: number;
  activeCampaigns: number;
  adoptedLanguages: number;
  sponsoredTranslations: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/reports?type=dashboard');
        if (res.ok) {
          const json = await res.json();
          setOverview(json.data.overview);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">High-level insights for campaign performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2" /> Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : `£${(overview?.totalRevenue ?? 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">All-time successful payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" /> Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : overview?.activeCampaigns ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently active subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" /> Adopted Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : overview?.adoptedLanguages ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Languages marked as adopted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2" /> Translation Sponsors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : overview?.sponsoredTranslations ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Active translation sponsorships</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              More detailed charts and breakdowns will go here. For now, this page summarizes live metrics from your database.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

