'use client';

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

export default function AdminDashboard() {
  const { data: session } = useSession();

  // Mock data for demonstration
  const stats = {
    totalRevenue: 45000,
    activeSubscriptions: 25,
    languageAdoptions: 15,
    translationSponsors: 10,
    newPartnersThisMonth: 8,
  };

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
            <div className="text-2xl font-bold">£{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +3 new this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Language Adoptions</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.languageAdoptions}/60</div>
            <p className="text-xs text-muted-foreground">
              25% of target reached
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Sponsors</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.translationSponsors}</div>
            <p className="text-xs text-muted-foreground">
              Supporting Passacris
            </p>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">John Smith adopted German</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <span className="text-green-600 font-medium">£150/month</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sarah Johnson sponsored French translation</p>
                  <p className="text-sm text-gray-500">5 hours ago</p>
                </div>
                <span className="text-green-600 font-medium">£150/month</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">David Brown adopted Spanish</p>
                  <p className="text-sm text-gray-500">1 day ago</p>
                </div>
                <span className="text-green-600 font-medium">£150/month</span>
              </div>
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
                  <span>15/60 (25%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Translation Sponsors</span>
                  <span>10/30 (33%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-accent-600 h-2 rounded-full" style={{ width: '33%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Revenue Target</span>
                  <span>£45K/£100K (45%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-success-600 h-2 rounded-full" style={{ width: '45%' }}></div>
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