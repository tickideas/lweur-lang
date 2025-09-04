// src/app/admin/campaign-expiry/page.tsx
// Admin page for managing campaign expirations and language releases
// Allows admins to view upcoming expirations and manually trigger expiry processing
// RELEVANT FILES: expire-adoptions/route.ts, admin-layout.tsx, languages/page.tsx, campaigns/route.ts

'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  Play,
  CheckCircle,
  Calendar,
  User,
  Globe
} from 'lucide-react';

interface ExpiringCampaign {
  campaignId: string;
  languageName: string;
  partnerName: string;
  partnerEmail: string;
  expiryDate: string;
  hoursUntilExpiry?: number;
  daysUntilExpiry?: number;
}

interface ExpiryResult {
  campaignId: string;
  languageId: string;
  languageName: string;
  partnerName: string;
  action: string;
  expiredDate?: string;
  error?: string;
}

interface ExpiryData {
  success: boolean;
  checkedAt: string;
  expiringSoon: ExpiringCampaign[];
  expiringThisWeek: ExpiringCampaign[];
}

interface ProcessResult {
  success: boolean;
  processedAt: string;
  expiredCampaigns: number;
  results: ExpiryResult[];
}

export default function CampaignExpiryPage() {
  const [expiryData, setExpiryData] = useState<ExpiryData | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadExpiryData();
  }, []);

  const loadExpiryData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/campaigns/expire-adoptions');
      if (response.ok) {
        const data = await response.json();
        setExpiryData(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load expiry data' });
      }
    } catch (error) {
      console.error('Error loading expiry data:', error);
      setMessage({ type: 'error', text: 'Error loading expiry data' });
    } finally {
      setLoading(false);
    }
  };

  const processExpirations = async () => {
    setProcessing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/campaigns/expire-adoptions', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setProcessResult(result);
        setMessage({ 
          type: 'success', 
          text: `Successfully processed ${result.expiredCampaigns} expired campaigns` 
        });
        // Reload data to show updated status
        await loadExpiryData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to process expirations' });
      }
    } catch (error) {
      console.error('Error processing expirations:', error);
      setMessage({ type: 'error', text: 'Error processing expirations' });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUrgencyColor = (hours?: number, days?: number) => {
    if (hours !== undefined && hours <= 24) return 'text-red-600';
    if (days !== undefined && days <= 3) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'RELEASED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1226AA]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
              <Clock className="mr-3 h-8 w-8 text-[#1226AA]" />
              Campaign Expiry Management
            </h1>
            <p className="text-neutral-600 mt-2">
              Monitor and process one-time language adoption expirations
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={loadExpiryData}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={processExpirations}
              disabled={processing}
              className="bg-[#1226AA] hover:bg-blue-800"
            >
              <Play className="mr-2 h-4 w-4" />
              {processing ? 'Processing...' : 'Process Expirations'}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {expiryData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Expiring Soon (24 hours) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Expiring Soon (24 hours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiryData.expiringSoon.length === 0 ? (
                  <p className="text-neutral-500">No campaigns expiring in the next 24 hours</p>
                ) : (
                  <div className="space-y-4">
                    {expiryData.expiringSoon.map((campaign) => (
                      <div key={campaign.campaignId} className="border-l-4 border-red-500 pl-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900 flex items-center">
                              <Globe className="mr-2 h-4 w-4" />
                              {campaign.languageName}
                            </p>
                            <p className="text-sm text-neutral-600 flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {campaign.partnerName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {campaign.partnerEmail}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600">
                              {campaign.hoursUntilExpiry}h remaining
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatDate(campaign.expiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring This Week */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <Calendar className="mr-2 h-5 w-5" />
                  Expiring This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiryData.expiringThisWeek.length === 0 ? (
                  <p className="text-neutral-500">No campaigns expiring this week</p>
                ) : (
                  <div className="space-y-4">
                    {expiryData.expiringThisWeek.map((campaign) => (
                      <div key={campaign.campaignId} className="border-l-4 border-orange-500 pl-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900 flex items-center">
                              <Globe className="mr-2 h-4 w-4" />
                              {campaign.languageName}
                            </p>
                            <p className="text-sm text-neutral-600 flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {campaign.partnerName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {campaign.partnerEmail}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-orange-600">
                              {campaign.daysUntilExpiry} days
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatDate(campaign.expiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Process Results */}
        {processResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <CheckCircle className="mr-2 h-5 w-5" />
                Last Processing Results
              </CardTitle>
              <p className="text-sm text-neutral-600">
                Processed at: {formatDate(processResult.processedAt)}
              </p>
            </CardHeader>
            <CardContent>
              {processResult.results.length === 0 ? (
                <p className="text-neutral-500">No expired campaigns found</p>
              ) : (
                <div className="space-y-4">
                  {processResult.results.map((result, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                      {getActionIcon(result.action)}
                      <div className="flex-1">
                        <p className="font-medium">{result.languageName}</p>
                        <p className="text-sm text-neutral-600">{result.partnerName}</p>
                        <p className="text-xs text-neutral-500">
                          Action: {result.action.replace(/_/g, ' ')}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-600">Error: {result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• One-time language adoptions expire 30 days after payment</li>
            <li>• When a campaign expires, it's marked as COMPLETED</li>
            <li>• If no other active campaigns exist for the language, it becomes AVAILABLE again</li>
            <li>• This process should be run daily via cron job or manually from this page</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}