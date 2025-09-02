import Link from 'next/link';
import { Heart, Globe, Mail, Phone } from 'lucide-react';

const navigation = {
  campaigns: [
    { name: 'Adopt a Language', href: '/adopt-language' },
    { name: 'Sponsor Translation', href: '/sponsor-translation' },
    { name: 'Impact Stories', href: '/impact' },
  ],
  support: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Support', href: '/support' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-900 font-bold">LWE</span>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold">Loveworld Europe</div>
                <div className="text-primary-200 text-sm">Campaign Portal</div>
              </div>
            </div>
            <p className="text-base leading-6 text-primary-200">
              Spreading the Gospel, changing lives, in every language across Europe. 
              Join us in reaching 750 million souls through 60 language channels.
            </p>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2 text-primary-200">
                <Globe className="h-5 w-5" />
                <span className="text-sm">50 Countries</span>
              </div>
              <div className="flex items-center space-x-2 text-primary-200">
                <Heart className="h-5 w-5" />
                <span className="text-sm">750M Potential Reach</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Campaigns</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.campaigns.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-primary-200 hover:text-white transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-primary-200 hover:text-white transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-primary-200 hover:text-white transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Contact</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-3 text-primary-200">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:support@loveworldeurope.org" className="text-sm hover:text-white transition-colors">
                      support@loveworldeurope.org
                    </a>
                  </div>
                  <div className="flex items-center space-x-3 text-primary-200">
                    <Phone className="h-4 w-4" />
                    <a href="tel:+442012345678" className="text-sm hover:text-white transition-colors">
                      +44 20 1234 5678
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 border-t border-primary-800 pt-8 sm:mt-20 lg:mt-24">
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
              <span className="block sm:inline">Registered Charity in England and Wales.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}