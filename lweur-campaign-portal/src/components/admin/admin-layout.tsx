'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AdminFooter } from '@/components/admin/admin-footer';
import Link from 'next/link';
import { 
  LogOut,
  Home,
  Users,
  BarChart3,
  Settings,
  FileText,
  Heart,
  Languages as LanguagesIcon,
  Globe,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
  },
  {
    name: 'Partners',
    href: '/admin/partners',
    icon: Users,
  },
  {
    name: 'Languages',
    href: '/admin/languages',
    icon: LanguagesIcon,
  },
  {
    name: 'Translations',
    href: '/admin/translations',
    icon: Globe,
  },
  {
    name: 'Impact',
    href: '/admin/impact',
    icon: Heart,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Campaign Expiry',
    href: '/admin/campaign-expiry',
    icon: Clock,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-[#1226AA] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">LWE</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
                  <p className="text-sm text-neutral-500">Campaign Management Portal</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">
                  {session.user.firstName} {session.user.lastName}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {session.user.role.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-[#1226AA] text-[#1226AA]"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      
      {/* Footer */}
      <AdminFooter />
    </div>
  );
}
