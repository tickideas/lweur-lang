'use client';

import { useState } from 'react';
import { format as formatDate } from 'date-fns';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  FileText, 
  Users, 
  CreditCard, 
  Languages, 
  BarChart3,
  Filter
} from 'lucide-react';

const reportTypes = [
  {
    id: 'partners',
    name: 'Partners Report',
    description: 'Complete list of partners with campaign and payment data',
    icon: Users,
  },
  {
    id: 'campaigns',
    name: 'Campaigns Report',
    description: 'Active and historical campaign information',
    icon: BarChart3,
  },
  {
    id: 'payments',
    name: 'Payments Report',
    description: 'Payment transactions and revenue details',
    icon: CreditCard,
  },
  {
    id: 'languages',
    name: 'Languages Report',
    description: 'Language adoption status and revenue by language',
    icon: Languages,
  },
  {
    id: 'dashboard',
    name: 'Dashboard Summary',
    description: 'Key metrics and performance indicators',
    icon: FileText,
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  // exportFormat represents the requested output format (csv | json)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateReport = async () => {
    if (!selectedReport) return;

    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        type: selectedReport,
  format: exportFormat,
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/reports?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

  if (exportFormat === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
  a.download = `${selectedReport}-report-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
  a.download = `${selectedReport}-report-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickReport = async (reportType: string) => {
    setSelectedReport(reportType);
    setStartDate('');
    setEndDate('');
    
    // Auto-generate for quick access
    setTimeout(() => {
      handleGenerateReport();
    }, 100);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">
            Generate and download detailed reports for campaign analysis and partner management.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const IconComponent = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReport(report.id)}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Quick Download
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Custom Report Generator</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={exportFormat} onValueChange={(value: 'json' | 'csv') => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date (Optional)</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedReport || isGenerating}
                className="min-w-[150px]"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Report Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Date Filtering</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Leave dates empty to include all historical data</li>
                  <li>• Partners/Campaigns: Filtered by creation date</li>
                  <li>• Payments: Filtered by payment date</li>
                  <li>• Languages: Date filters don&apos;t apply</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Export Formats</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CSV: Excel-compatible format for analysis</li>
                  <li>• JSON: Structured data for technical integration</li>
                  <li>• Reports include all relevant relational data</li>
                  <li>• Financial amounts shown in original currency</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}