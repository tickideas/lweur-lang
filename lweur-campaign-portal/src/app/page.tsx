import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ImpactPreview } from '@/components/impact/impact-preview';
import { Heart, Languages, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Spreading the Gospel,{' '}
              <span className="text-secondary-400">Changing Lives</span>,{' '}
              in Every Language
            </h1>
            <p className="mt-6 text-lg leading-8 text-primary-100">
              Join Loveworld Europe&apos;s mission to broadcast inspiring, faith-filled content in 60+ languages across Europe.
We’re reaching over <strong>750 million people</strong> with the Gospel — one language at a time. 
<strong> Adopt a Language</strong> or <strong>Sponsor a Translation</strong> for just <strong>£150/month</strong> and help us transform nations.

            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/adopt-language">
                <Button size="lg" variant="outline" className="bg-white text-[#1226AA] border-white hover:bg-[#1226AA] hover:text-white">
                  <Languages className="mr-2 h-5 w-5" />
                  Adopt a Language
                </Button>
              </Link>
              <Link href="/sponsor-translation">
                <Button size="lg" variant="secondary">
                  <Zap className="mr-2 h-5 w-5" />
                  Sponsor Translation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* Mission Statement */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Mission
            </h2>
            <p className="mt-6 text-xl leading-8 text-gray-600">
              To complete the full preaching of the Gospel of Jesus Christ across the nations of Europe, this year 2025 — in 
              the language they best understand. To disciple men and women through life-transforming 
              programming, bombarding the airwaves with truth, faith, and love.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Preview Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Hear From Our Partners
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Real stories of transformation and impact from supporters across Europe
            </p>
          </div>
          
          {/* Impact Stories Preview */}
          <ImpactPreview />
          
          {/* View More Link */}
          <div className="text-center mt-12">
            <Link href="/impact">
              <Button size="lg" variant="outline">
                <Heart className="mr-2 h-5 w-5" />
                View All Impact Stories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
