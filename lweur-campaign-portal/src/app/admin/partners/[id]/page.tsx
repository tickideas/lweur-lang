'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, ArrowLeft, Calendar, DollarSign, Users } from 'lucide-react';

interface PartnerDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  organization?: string | null;
  country: string;
  firstContributionAt?: string | null;
  lastContributionAt?: string | null;
  totalContributions: number;
  campaigns: { id: string; type: string; status: string; monthlyAmount: number; startDate: string; language: { name: string } }[];
  payments: { id: string; amount: number; status: string; paymentDate: string }[];
}

export default function PartnerDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/partners/${params.id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const fmtCurrency = (pence: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push('/admin/partners')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading partner…</div>
      ) : !data ? (
        <div className="text-red-600">Partner not found</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.firstName} {data.lastName}</h1>
            <p className="text-gray-600">{data.organization || '—'} • {data.country}</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Contributions</p>
                    <p className="text-2xl font-semibold">{fmtCurrency(data.totalContributions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-primary-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Active Campaigns</p>
                    <p className="text-2xl font-semibold">{data.campaigns.filter(c => c.status === 'ACTIVE').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">First Contribution</p>
                    <p className="text-2xl font-semibold">{data.firstContributionAt ? fmtDate(data.firstContributionAt) : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Last Contribution</p>
                    <p className="text-2xl font-semibold">{data.lastContributionAt ? fmtDate(data.lastContributionAt) : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Button variant="outline" onClick={() => (window.location.href = `mailto:${data.email}`)}>
                  <Mail className="h-4 w-4 mr-2" /> {data.email}
                </Button>
                {data.phoneNumber && (
                  <Button variant="outline" onClick={() => (window.location.href = `tel:${data.phoneNumber}`)}>
                    <Phone className="h-4 w-4 mr-2" /> {data.phoneNumber}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {data.campaigns.length === 0 ? (
                <div className="text-sm text-gray-500">No campaigns yet.</div>
              ) : (
                <div className="space-y-3">
                  {data.campaigns.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded border bg-white">
                      <div>
                        <div className="font-medium">{c.language.name} ({c.type === 'ADOPT_LANGUAGE' ? 'Adoption' : 'Translation'})</div>
                        <div className="text-sm text-gray-500">Started {fmtDate(c.startDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{fmtCurrency(c.monthlyAmount)}</div>
                        <div className="text-xs text-gray-500">{c.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {data.payments.length === 0 ? (
                <div className="text-sm text-gray-500">No payments recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-6 py-3 text-sm">{fmtDate(p.paymentDate)}</td>
                          <td className="px-6 py-3 text-sm">{fmtCurrency(p.amount)}</td>
                          <td className="px-6 py-3 text-sm">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
