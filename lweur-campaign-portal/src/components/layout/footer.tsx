import Link from 'next/link';
import { Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-6 sm:py-8 lg:px-8">
        <div className="mt-4  pt-2 sm:mt-4 lg:mt-4">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <Link
                href="https://loveworldeurope.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-white transition-colors"
              >
                <span className="sr-only">Visit Loveworld Europe</span>
                <Globe className="h-6 w-6" />
              </Link>
            </div>
            <p className="mt-8 text-xs leading-5 text-primary-200 md:order-1 md:mt-0">
              &copy; {new Date().getFullYear()} Loveworld Europe. All rights reserved. 
             
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}