'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Languages, 
  TrendingUp, 
  DollarSign, 
  Globe, 
  BarChart3,
  UserPlus,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  overview: {
    totalRevenue: number;
    activeSubscriptions: number;
    languageAdoptions: number;
    totalLanguages: number;
    translationSponsors: number;
    monthlyRevenue: number;
    monthlyRevenueTarget: number;
  };
  recentActivities: Array<{
    id: string;
    partnerName: string;
    type: 'ADOPT_LANGUAGE' | 'SPONSOR_TRANSLATION';
    language: string;
    monthlyAmount: number;
    createdAt: string;
  }>;
  progress: {
    languages: { current: number; total: number; percent: number };
    sponsors: { current: number; total: number; percent: number };
    revenue: { current: number; target: number; percent: number };
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AdminLayout>
      {/* Welcome Message */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back, {session?.user.firstName}!</h2>
        <p className="mt-2 text-gray-600">
          Here&apos;s an overview of the Loveworld Europe campaign performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : `£${(data?.overview.totalRevenue ?? 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">All-time successful payments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : data?.overview.activeSubscriptions ?? 0}</div>
            <p className="text-xs text-muted-foreground">Currently active campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Language Adoptions</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? '—'
                : `${data?.overview.languageAdoptions ?? 0}/${data?.overview.totalLanguages ?? 0}`}
            </div>
            <p className="text-xs text-muted-foreground">Languages marked as adopted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Sponsors</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : data?.overview.translationSponsors ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active translation sponsorships</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Recent Partner Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <div className="text-sm text-gray-500">Loading…</div>}
              {!loading && (data?.recentActivities?.length ?? 0) === 0 && (
                <div className="text-sm text-gray-500">No recent activity.</div>
              )}
              {!loading && data?.recentActivities?.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {a.partnerName} {a.type === 'ADOPT_LANGUAGE' ? 'adopted' : 'sponsored translation for'} {a.language}
                    </p>
                    <p className="text-sm text-gray-500">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-green-600 font-medium">£{a.monthlyAmount.toLocaleString()}/month</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Campaign Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Language Adoptions</span>
                  <span>
                    {loading
                      ? '—'
                      : `${data?.progress.languages.current}/${data?.progress.languages.total} (${data?.progress.languages.percent}%)`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${data?.progress.languages.percent ?? 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Translation Sponsors</span>
                  <span>
                    {loading
                      ? '—'
                      : `${data?.progress.sponsors.current}/${data?.progress.sponsors.total} (${data?.progress.sponsors.percent}%)`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-accent-600 h-2 rounded-full" style={{ width: `${data?.progress.sponsors.percent ?? 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Revenue Target</span>
                  <span>
                    {loading
                      ? '—'
                      : `£${(data?.progress.revenue.current ?? 0).toLocaleString()}/£${(data?.progress.revenue.target ?? 0).toLocaleString()} (${data?.progress.revenue.percent ?? 0}%)`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-success-600 h-2 rounded-full" style={{ width: `${data?.progress.revenue.percent ?? 0}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Partner Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              View and manage partner relationships, communications, and subscription details.
            </p>
            <Link href="/admin/partners">
              <Button className="w-full">Manage Partners</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics & Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Generate detailed reports and analyze campaign performance metrics.
            </p>
            <Link href="/admin/reports">
              <Button className="w-full" variant="secondary">View Reports</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Campaign Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Configure language settings, pricing, and campaign parameters.
            </p>
            <Link href="/admin/settings">
              <Button className="w-full" variant="outline">Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
