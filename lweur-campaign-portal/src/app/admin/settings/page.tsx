'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, Image } from 'lucide-react';

export default function SettingsIndexPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Configure campaign and checkout options.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" /> Checkout Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Amounts, currencies, and hero section configuration for the donation pages.</p>
              <Link href="/admin/checkout-settings">
                <Button className="w-full">Open</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="h-5 w-5 mr-2" /> Impact & Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage impact stories and featured content.</p>
              <Link href="/admin/impact">
                <Button variant="outline" className="w-full">Manage</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" /> General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Additional configuration pages can be added here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

