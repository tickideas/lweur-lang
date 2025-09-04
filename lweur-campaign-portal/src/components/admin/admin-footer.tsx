// src/components/admin/admin-footer.tsx
// Footer component specifically designed for admin dashboard pages
// Provides admin-relevant links and branding in a clean, minimal design
// RELEVANT FILES: admin-layout.tsx, footer.tsx, admin/page.tsx, admin/settings/page.tsx

import Link from 'next/link';
import { 
  Globe, 
  HelpCircle, 
  Shield, 
  Settings, 
  LifeBuoy 
} from 'lucide-react';

export function AdminFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Left side - Copyright and branding */}
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0">
                <img src="/lweur_icon.png" alt="LWE Logo" className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">
                  © {currentYear} Loveworld Europe Campaign Portal
                </p>
                <p className="text-xs text-neutral-500">
                  Admin Dashboard v2.0
                </p>
              </div>
            </div>
            
            {/* Right side - Admin links */}
            <div className="flex items-center space-x-6">
              <Link
                href="/admin/settings"
                className="flex items-center space-x-2 text-sm text-neutral-500 hover:text-[#1226AA] transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              
              <Link
                href="/admin/help"
                className="flex items-center space-x-2 text-sm text-neutral-500 hover:text-[#1226AA] transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </Link>
              
              <Link
                href="/admin/support"
                className="flex items-center space-x-2 text-sm text-neutral-500 hover:text-[#1226AA] transition-colors"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Support</span>
              </Link>
              
              <div className="h-4 w-px bg-neutral-300"></div>
              
              <Link
                href="https://loveworldeurope.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-neutral-500 hover:text-[#1226AA] transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>Main Site</span>
              </Link>
              
              <Link
                href="/privacy"
                className="flex items-center space-x-2 text-sm text-neutral-500 hover:text-[#1226AA] transition-colors"
              >
                <Shield className="h-4 w-4" />
                <span>Privacy</span>
              </Link>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-center md:justify-end">
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}