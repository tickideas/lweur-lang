import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// European languages data for Loveworld Europe
const EUROPEAN_LANGUAGES = [
  {
    name: 'English',
    nativeName: 'English',
    iso639Code: 'en',
    region: 'Western Europe',
    countries: ['GB', 'IE'],
    speakerCount: 380000000,
    flagUrl: '/flags/gb.svg',
    adoptionStatus: 'ADOPTED' as const,
    priority: 1,
    description: 'The primary language for Loveworld Europe broadcasts, reaching English speakers across the UK and Ireland.'
  },
  {
    name: 'German',
    nativeName: 'Deutsch',
    iso639Code: 'de',
    region: 'Western Europe',
    countries: ['DE', 'AT', 'CH', 'LU'],
    speakerCount: 95000000,
    flagUrl: '/flags/de.svg',
    adoptionStatus: 'ADOPTED' as const,
    priority: 2,
    description: 'Reaching German-speaking communities across Germany, Austria, Switzerland, and Luxembourg.'
  },
  {
    name: 'French',
    nativeName: 'Français',
    iso639Code: 'fr',
    region: 'Western Europe',
    countries: ['FR', 'BE', 'CH', 'LU', 'MC'],
    speakerCount: 80000000,
    flagUrl: '/flags/fr.svg',
    adoptionStatus: 'ADOPTED' as const,
    priority: 3,
    description: 'Broadcasting to French speakers in France, Belgium, Switzerland, and surrounding regions.'
  },
  {
    name: 'Spanish',
    nativeName: 'Español',
    iso639Code: 'es',
    region: 'Southern Europe',
    countries: ['ES'],
    speakerCount: 47000000,
    flagUrl: '/flags/es.svg',
    adoptionStatus: 'ADOPTED' as const,
    priority: 4,
    description: 'Bringing the Gospel to Spanish-speaking communities throughout Spain.'
  },
  {
    name: 'Italian',
    nativeName: 'Italiano',
    iso639Code: 'it',
    region: 'Southern Europe',
    countries: ['IT', 'CH', 'SM', 'VA'],
    speakerCount: 65000000,
    flagUrl: '/flags/it.svg',
    adoptionStatus: 'ADOPTED' as const,
    priority: 5,
    description: 'Reaching Italian speakers across Italy, San Marino, Vatican City, and Italian-speaking Switzerland.'
  },
  {
    name: 'Polish',
    nativeName: 'Polski',
    iso639Code: 'pl',
    region: 'Eastern Europe',
    countries: ['PL'],
    speakerCount: 38000000,
    flagUrl: '/flags/pl.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 6,
    description: 'Expanding into Poland with life-transforming Christian programming for Polish speakers.'
  },
  {
    name: 'Romanian',
    nativeName: 'Română',
    iso639Code: 'ro',
    region: 'Southern Europe',
    countries: ['RO', 'MD'],
    speakerCount: 24000000,
    flagUrl: '/flags/ro.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 7,
    description: 'Bringing hope and faith to Romanian speakers in Romania and Moldova.'
  },
  {
    name: 'Dutch',
    nativeName: 'Nederlands',
    iso639Code: 'nl',
    region: 'Western Europe',
    countries: ['NL', 'BE'],
    speakerCount: 24000000,
    flagUrl: '/flags/nl.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 8,
    description: 'Reaching Dutch speakers in the Netherlands and Belgium with Christian television.'
  },
  {
    name: 'Greek',
    nativeName: 'Ελληνικά',
    iso639Code: 'el',
    region: 'Southern Europe',
    countries: ['GR', 'CY'],
    speakerCount: 13500000,
    flagUrl: '/flags/gr.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 9,
    description: 'Broadcasting to Greek communities in Greece and Cyprus.'
  },
  {
    name: 'Portuguese',
    nativeName: 'Português',
    iso639Code: 'pt',
    region: 'Southern Europe',
    countries: ['PT'],
    speakerCount: 10500000,
    flagUrl: '/flags/pt.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 10,
    description: 'Expanding to Portuguese speakers with faith-building content.'
  },
  {
    name: 'Czech',
    nativeName: 'Čeština',
    iso639Code: 'cs',
    region: 'Eastern Europe',
    countries: ['CZ'],
    speakerCount: 10700000,
    flagUrl: '/flags/cz.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 11,
    description: 'Bringing Christian programming to Czech Republic.'
  },
  {
    name: 'Hungarian',
    nativeName: 'Magyar',
    iso639Code: 'hu',
    region: 'Eastern Europe',
    countries: ['HU'],
    speakerCount: 13000000,
    flagUrl: '/flags/hu.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 12,
    description: 'Reaching Hungarian speakers with transformative Christian content.'
  },
  {
    name: 'Swedish',
    nativeName: 'Svenska',
    iso639Code: 'sv',
    region: 'Northern Europe',
    countries: ['SE', 'FI'],
    speakerCount: 10200000,
    flagUrl: '/flags/se.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 13,
    description: 'Broadcasting to Swedish speakers in Sweden and Finland.'
  },
  {
    name: 'Bulgarian',
    nativeName: 'Български',
    iso639Code: 'bg',
    region: 'Southern Europe',
    countries: ['BG'],
    speakerCount: 8000000,
    flagUrl: '/flags/bg.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 14,
    description: 'Expanding Christian television to Bulgarian speakers.'
  },
  {
    name: 'Croatian',
    nativeName: 'Hrvatski',
    iso639Code: 'hr',
    region: 'Southern Europe',
    countries: ['HR', 'BA'],
    speakerCount: 5600000,
    flagUrl: '/flags/hr.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 15,
    description: 'Reaching Croatian speakers in Croatia and Bosnia and Herzegovina.'
  },
  {
    name: 'Finnish',
    nativeName: 'Suomi',
    iso639Code: 'fi',
    region: 'Northern Europe',
    countries: ['FI'],
    speakerCount: 5500000,
    flagUrl: '/flags/fi.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 16,
    description: 'Bringing faith-based programming to Finnish speakers.'
  },
  {
    name: 'Slovak',
    nativeName: 'Slovenčina',
    iso639Code: 'sk',
    region: 'Eastern Europe',
    countries: ['SK'],
    speakerCount: 5400000,
    flagUrl: '/flags/sk.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 17,
    description: 'Expanding to Slovak speakers with Christian television content.'
  },
  {
    name: 'Danish',
    nativeName: 'Dansk',
    iso639Code: 'da',
    region: 'Northern Europe',
    countries: ['DK'],
    speakerCount: 6000000,
    flagUrl: '/flags/dk.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 18,
    description: 'Broadcasting to Danish speakers with life-transforming content.'
  },
  {
    name: 'Norwegian',
    nativeName: 'Norsk',
    iso639Code: 'no',
    region: 'Northern Europe',
    countries: ['NO'],
    speakerCount: 5300000,
    flagUrl: '/flags/no.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 19,
    description: 'Reaching Norwegian speakers with Christian programming.'
  },
  {
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    iso639Code: 'lt',
    region: 'Northern Europe',
    countries: ['LT'],
    speakerCount: 3200000,
    flagUrl: '/flags/lt.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 20,
    description: 'Expanding to Lithuanian speakers with faith-building broadcasts.'
  },
  {
    name: 'Slovenian',
    nativeName: 'Slovenščina',
    iso639Code: 'sl',
    region: 'Southern Europe',
    countries: ['SI'],
    speakerCount: 2500000,
    flagUrl: '/flags/si.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 21,
    description: 'Bringing Christian television to Slovenian speakers.'
  },
  {
    name: 'Latvian',
    nativeName: 'Latviešu',
    iso639Code: 'lv',
    region: 'Northern Europe',
    countries: ['LV'],
    speakerCount: 2200000,
    flagUrl: '/flags/lv.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 22,
    description: 'Reaching Latvian speakers with transformative Christian content.'
  },
  {
    name: 'Estonian',
    nativeName: 'Eesti',
    iso639Code: 'et',
    region: 'Northern Europe',
    countries: ['EE'],
    speakerCount: 1100000,
    flagUrl: '/flags/ee.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 23,
    description: 'Expanding Christian broadcasts to Estonian speakers.'
  },
  {
    name: 'Ukrainian',
    nativeName: 'Українська',
    iso639Code: 'uk',
    region: 'Eastern Europe',
    countries: ['UA'],
    speakerCount: 41000000,
    flagUrl: '/flags/ua.svg',
    adoptionStatus: 'PENDING' as const,
    priority: 24,
    description: 'Supporting Ukrainian speakers with hope and faith during challenging times.'
  },
  {
    name: 'Russian',
    nativeName: 'Русский',
    iso639Code: 'ru',
    region: 'Eastern Europe',
    countries: ['RU', 'BY'],
    speakerCount: 154000000,
    flagUrl: '/flags/ru.svg',
    adoptionStatus: 'PENDING' as const,
    priority: 25,
    description: 'Reaching Russian speakers across Eastern Europe.'
  },
  // Additional languages to reach 60 total
  {
    name: 'Serbian',
    nativeName: 'Српски',
    iso639Code: 'sr',
    region: 'Southern Europe',
    countries: ['RS', 'BA', 'ME'],
    speakerCount: 12000000,
    flagUrl: '/flags/rs.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 26,
    description: 'Broadcasting to Serbian speakers in the Balkans.'
  },
  {
    name: 'Albanian',
    nativeName: 'Shqip',
    iso639Code: 'sq',
    region: 'Southern Europe',
    countries: ['AL', 'XK', 'MK'],
    speakerCount: 7500000,
    flagUrl: '/flags/al.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 27,
    description: 'Reaching Albanian speakers across the Balkans.'
  },
  {
    name: 'Macedonian',
    nativeName: 'Македонски',
    iso639Code: 'mk',
    region: 'Southern Europe',
    countries: ['MK'],
    speakerCount: 2100000,
    flagUrl: '/flags/mk.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 28,
    description: 'Broadcasting to Macedonian speakers.'
  },
  {
    name: 'Bosnian',
    nativeName: 'Bosanski',
    iso639Code: 'bs',
    region: 'Southern Europe',
    countries: ['BA'],
    speakerCount: 2500000,
    flagUrl: '/flags/ba.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 29,
    description: 'Reaching Bosnian speakers with Christian programming.'
  },
  {
    name: 'Montenegrin',
    nativeName: 'Crnogorski',
    iso639Code: 'cnr',
    region: 'Southern Europe',
    countries: ['ME'],
    speakerCount: 630000,
    flagUrl: '/flags/me.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 30,
    description: 'Broadcasting to Montenegrin speakers.'
  }
  // Note: We currently have 30 languages (matching current status)
  // Additional 30 languages would be added to reach the 60 target
];

async function main() {
  console.log('🌍 Seeding European languages for Loveworld Europe...');

  // Clear existing data
  await prisma.communication.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.language.deleteMany({});
  await prisma.partner.deleteMany({});
  await prisma.admin.deleteMany({});

  // Seed languages
  for (const language of EUROPEAN_LANGUAGES) {
    await prisma.language.create({
      data: language,
    });
    console.log(`✅ Added ${language.name} (${language.nativeName})`);
  }

  // Create a demo admin user
  const adminUser = await prisma.admin.create({
    data: {
      email: 'admin@loveworldeurope.org',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYhBK7nbVFszzqi', // 'password123'
      isActive: true,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create some demo partners and campaigns
  const demoPartner = await prisma.partner.create({
    data: {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'Partner',
      country: 'GB',
      preferredLanguage: 'en',
      organization: 'Demo Organization',
      phoneNumber: '+44 20 1234 5678',
    },
  });

  // Get first few languages for demo campaigns
  const languages = await prisma.language.findMany({
    take: 5,
    orderBy: { priority: 'asc' },
  });

  // Create demo campaigns
  for (const [index, language] of languages.entries()) {
    if (index < 3) {
      await prisma.campaign.create({
        data: {
          type: 'ADOPT_LANGUAGE',
          partnerId: demoPartner.id,
          languageId: language.id,
          monthlyAmount: 15000, // £150 in pence
          currency: 'GBP',
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });
      console.log(`✅ Created adoption campaign for ${language.name}`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ${EUROPEAN_LANGUAGES.length} languages added`);
  console.log(`   - 1 admin user created`);
  console.log(`   - 1 demo partner created`);
  console.log(`   - 3 demo campaigns created`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });"