import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Heart, Languages, TrendingUp, Users, Zap } from 'lucide-react';
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
              Join Loveworld Europe's mission to broadcast Christian content across 60 languages in Europe, 
              reaching 750 million souls with life-transforming programming. Adopt a language or sponsor 
              translation for just £150 per month.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/adopt-language">
                <Button size="lg" variant="primary">
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

      {/* Impact Metrics */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Impact Across Europe
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              See how Loveworld Europe is transforming lives across the continent
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-4">
            <div className="metric-card">
              <div className="metric-number">30</div>
              <div className="metric-label">Language Channels</div>
              <p className="mt-2 text-sm text-gray-500">Currently broadcasting</p>
            </div>
            <div className="metric-card">
              <div className="metric-number">60</div>
              <div className="metric-label">Target Languages</div>
              <p className="mt-2 text-sm text-gray-500">By end of year</p>
            </div>
            <div className="metric-card">
              <div className="metric-number">50</div>
              <div className="metric-label">Countries Reached</div>
              <p className="mt-2 text-sm text-gray-500">Across Europe</p>
            </div>
            <div className="metric-card">
              <div className="metric-number">750M</div>
              <div className="metric-label">Potential Audience</div>
              <p className="mt-2 text-sm text-gray-500">Souls to reach</p>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Overview */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Two Ways to Make an Impact
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Choose how you'd like to support our mission to reach Europe with the Gospel
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            {/* Adopt a Language Card */}
            <Card className="campaign-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Languages className="h-12 w-12 text-primary-700" />
                  <span className="rounded-full bg-primary-200 px-3 py-1 text-sm font-medium text-primary-800">
                    £150/month
                  </span>
                </div>
                <CardTitle className="text-primary-900">Adopt a Language</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  Become the exclusive sponsor of a European language channel. Your support 
                  enables us to broadcast Christian programming in that language, reaching 
                  millions of souls with life-transforming content.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-success-600 mr-2" />
                    Exclusive language sponsorship
                  </li>
                  <li className="flex items-center">
                    <Users className="h-4 w-4 text-success-600 mr-2" />
                    Reach millions of speakers
                  </li>
                  <li className="flex items-center">
                    <Heart className="h-4 w-4 text-success-600 mr-2" />
                    Monthly impact reports
                  </li>
                </ul>
                <Link href="/adopt-language">
                  <Button className="w-full">Choose Your Language</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sponsor Translation Card */}
            <Card className="campaign-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Zap className="h-12 w-12 text-primary-700" />
                  <span className="rounded-full bg-primary-200 px-3 py-1 text-sm font-medium text-primary-800">
                    £150/month
                  </span>
                </div>
                <CardTitle className="text-primary-900">Sponsor Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  Enable live translation of our flagship program "Passacris" into multiple 
                  European languages. Your sponsorship brings real-time Gospel content to 
                  diverse communities across the continent.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center">
                    <Globe className="h-4 w-4 text-success-600 mr-2" />
                    Live program translation
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-4 w-4 text-success-600 mr-2" />
                    Real-time impact
                  </li>
                  <li className="flex items-center">
                    <Heart className="h-4 w-4 text-success-600 mr-2" />
                    Multiple languages supported
                  </li>
                </ul>
                <Link href="/sponsor-translation">
                  <Button className="w-full" variant="secondary">Start Sponsoring</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Mission
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              To complete the full preaching of the Gospel of Jesus Christ across the nations of Europe—in 
              the language they best understand. To disciple men and women through life-transforming 
              programming, bombarding the airwaves with truth, faith, and love.
            </p>
            <div className="mt-10">
              <Link href="/about">
                <Button size="lg">Learn More About Our Mission</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
