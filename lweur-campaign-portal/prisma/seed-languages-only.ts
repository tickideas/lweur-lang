// prisma/seed-languages-only.ts
// Production seed script for European languages only
// Seeds the 30 European languages with detailed metadata for Loveworld Europe
// RELEVANT FILES: prisma/schema.prisma, package.json, prisma/seed.ts

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
  },
  // Additional 30 languages to reach 60 total
  {
    name: 'Turkish',
    nativeName: 'Türkçe',
    iso639Code: 'tr',
    region: 'Southern Europe',
    countries: ['TR'],
    speakerCount: 88000000,
    flagUrl: '/flags/tr.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 31,
    description: 'Reaching Turkish speakers across Turkey and Turkish communities in Europe.'
  },
  {
    name: 'Catalan',
    nativeName: 'Català',
    iso639Code: 'ca',
    region: 'Southern Europe',
    countries: ['ES', 'AD'],
    speakerCount: 10000000,
    flagUrl: '/flags/es-ct.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 32,
    description: 'Broadcasting to Catalan speakers in Catalonia, Valencia, and Andorra.'
  },
  {
    name: 'Basque',
    nativeName: 'Euskera',
    iso639Code: 'eu',
    region: 'Southern Europe',
    countries: ['ES', 'FR'],
    speakerCount: 750000,
    flagUrl: '/flags/es-pv.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 33,
    description: 'Reaching Basque speakers in the Basque Country of Spain and France.'
  },
  {
    name: 'Welsh',
    nativeName: 'Cymraeg',
    iso639Code: 'cy',
    region: 'Western Europe',
    countries: ['GB'],
    speakerCount: 580000,
    flagUrl: '/flags/gb-wls.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 34,
    description: 'Broadcasting to Welsh speakers in Wales.'
  },
  {
    name: 'Irish',
    nativeName: 'Gaeilge',
    iso639Code: 'ga',
    region: 'Western Europe',
    countries: ['IE'],
    speakerCount: 170000,
    flagUrl: '/flags/ie.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 35,
    description: 'Reaching Irish Gaelic speakers in Ireland.'
  },
  {
    name: 'Scottish Gaelic',
    nativeName: 'Gàidhlig',
    iso639Code: 'gd',
    region: 'Western Europe',
    countries: ['GB'],
    speakerCount: 57000,
    flagUrl: '/flags/gb-sct.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 36,
    description: 'Broadcasting to Scottish Gaelic speakers in Scotland.'
  },
  {
    name: 'Maltese',
    nativeName: 'Malti',
    iso639Code: 'mt',
    region: 'Southern Europe',
    countries: ['MT'],
    speakerCount: 520000,
    flagUrl: '/flags/mt.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 37,
    description: 'Reaching Maltese speakers in Malta.'
  },
  {
    name: 'Icelandic',
    nativeName: 'Íslenska',
    iso639Code: 'is',
    region: 'Northern Europe',
    countries: ['IS'],
    speakerCount: 350000,
    flagUrl: '/flags/is.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 38,
    description: 'Broadcasting to Icelandic speakers in Iceland.'
  },
  {
    name: 'Armenian',
    nativeName: 'Հայերեն',
    iso639Code: 'hy',
    region: 'Eastern Europe',
    countries: ['AM'],
    speakerCount: 6700000,
    flagUrl: '/flags/am.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 39,
    description: 'Reaching Armenian speakers across Armenia and Armenian diaspora in Europe.'
  },
  {
    name: 'Georgian',
    nativeName: 'ქართული',
    iso639Code: 'ka',
    region: 'Eastern Europe',
    countries: ['GE'],
    speakerCount: 3700000,
    flagUrl: '/flags/ge.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 40,
    description: 'Broadcasting to Georgian speakers in Georgia.'
  },
  {
    name: 'Belarusian',
    nativeName: 'Беларуская',
    iso639Code: 'be',
    region: 'Eastern Europe',
    countries: ['BY'],
    speakerCount: 2200000,
    flagUrl: '/flags/by.svg',
    adoptionStatus: 'PENDING' as const,
    priority: 41,
    description: 'Reaching Belarusian speakers in Belarus.'
  },
  {
    name: 'Luxembourgish',
    nativeName: 'Lëtzebuergesch',
    iso639Code: 'lb',
    region: 'Western Europe',
    countries: ['LU'],
    speakerCount: 400000,
    flagUrl: '/flags/lu.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 42,
    description: 'Broadcasting to Luxembourgish speakers in Luxembourg.'
  },
  {
    name: 'Faroese',
    nativeName: 'Føroyskt',
    iso639Code: 'fo',
    region: 'Northern Europe',
    countries: ['FO'],
    speakerCount: 66000,
    flagUrl: '/flags/fo.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 43,
    description: 'Reaching Faroese speakers in the Faroe Islands.'
  },
  {
    name: 'Breton',
    nativeName: 'Brezhoneg',
    iso639Code: 'br',
    region: 'Western Europe',
    countries: ['FR'],
    speakerCount: 210000,
    flagUrl: '/flags/fr-bzh.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 44,
    description: 'Broadcasting to Breton speakers in Brittany, France.'
  },
  {
    name: 'Corsican',
    nativeName: 'Corsu',
    iso639Code: 'co',
    region: 'Southern Europe',
    countries: ['FR'],
    speakerCount: 80000,
    flagUrl: '/flags/fr-cor.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 45,
    description: 'Reaching Corsican speakers in Corsica.'
  },
  {
    name: 'Galician',
    nativeName: 'Galego',
    iso639Code: 'gl',
    region: 'Southern Europe',
    countries: ['ES'],
    speakerCount: 2400000,
    flagUrl: '/flags/es-ga.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 46,
    description: 'Broadcasting to Galician speakers in Galicia, Spain.'
  },
  {
    name: 'Occitan',
    nativeName: 'Occitan',
    iso639Code: 'oc',
    region: 'Western Europe',
    countries: ['FR', 'ES', 'IT'],
    speakerCount: 220000,
    flagUrl: '/flags/oc.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 47,
    description: 'Reaching Occitan speakers in Southern France, Spain, and Italy.'
  },
  {
    name: 'Romansh',
    nativeName: 'Rumantsch',
    iso639Code: 'rm',
    region: 'Western Europe',
    countries: ['CH'],
    speakerCount: 60000,
    flagUrl: '/flags/ch.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 48,
    description: 'Broadcasting to Romansh speakers in Switzerland.'
  },
  {
    name: 'Ladin',
    nativeName: 'Ladin',
    iso639Code: 'lld',
    region: 'Southern Europe',
    countries: ['IT'],
    speakerCount: 31000,
    flagUrl: '/flags/it.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 49,
    description: 'Reaching Ladin speakers in Northern Italy.'
  },
  {
    name: 'Sardinian',
    nativeName: 'Sardu',
    iso639Code: 'sc',
    region: 'Southern Europe',
    countries: ['IT'],
    speakerCount: 1350000,
    flagUrl: '/flags/it-88.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 50,
    description: 'Broadcasting to Sardinian speakers in Sardinia.'
  },
  {
    name: 'Friulian',
    nativeName: 'Furlan',
    iso639Code: 'fur',
    region: 'Southern Europe',
    countries: ['IT'],
    speakerCount: 600000,
    flagUrl: '/flags/it.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 51,
    description: 'Reaching Friulian speakers in Northeast Italy.'
  },
  {
    name: 'South Tyrolean German',
    nativeName: 'Südtirolerisch',
    iso639Code: 'de-it',
    region: 'Southern Europe',
    countries: ['IT'],
    speakerCount: 300000,
    flagUrl: '/flags/it-32.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 52,
    description: 'Broadcasting to German speakers in South Tyrol, Italy.'
  },
  {
    name: 'Yiddish',
    nativeName: 'ייִדיש',
    iso639Code: 'yi',
    region: 'Eastern Europe',
    countries: ['Multiple'],
    speakerCount: 600000,
    flagUrl: '/flags/yi.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 53,
    description: 'Reaching Yiddish-speaking communities across Europe.'
  },
  {
    name: 'Romani',
    nativeName: 'Rromani čhib',
    iso639Code: 'rom',
    region: 'Eastern Europe',
    countries: ['Multiple'],
    speakerCount: 3500000,
    flagUrl: '/flags/rom.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 54,
    description: 'Broadcasting to Romani communities across Europe.'
  },
  {
    name: 'Karelian',
    nativeName: 'Karjala',
    iso639Code: 'krl',
    region: 'Northern Europe',
    countries: ['FI', 'RU'],
    speakerCount: 25000,
    flagUrl: '/flags/fi.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 55,
    description: 'Reaching Karelian speakers in Finland and Russia.'
  },
  {
    name: 'Sami (Northern)',
    nativeName: 'Davvisámegiella',
    iso639Code: 'se',
    region: 'Northern Europe',
    countries: ['NO', 'SE', 'FI'],
    speakerCount: 20000,
    flagUrl: '/flags/sami.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 56,
    description: 'Broadcasting to Northern Sami speakers across Scandinavia.'
  },
  {
    name: 'Kashubian',
    nativeName: 'Kaszëbsczi',
    iso639Code: 'csb',
    region: 'Eastern Europe',
    countries: ['PL'],
    speakerCount: 110000,
    flagUrl: '/flags/pl.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 57,
    description: 'Reaching Kashubian speakers in Northern Poland.'
  },
  {
    name: 'Sorbian (Upper)',
    nativeName: 'Hornjoserbšćina',
    iso639Code: 'hsb',
    region: 'Western Europe',
    countries: ['DE'],
    speakerCount: 13000,
    flagUrl: '/flags/de-sn.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 58,
    description: 'Broadcasting to Upper Sorbian speakers in Eastern Germany.'
  },
  {
    name: 'Aragonese',
    nativeName: 'Aragonés',
    iso639Code: 'an',
    region: 'Southern Europe',
    countries: ['ES'],
    speakerCount: 4000,
    flagUrl: '/flags/es-ar.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 59,
    description: 'Reaching Aragonese speakers in Aragon, Spain.'
  },
  {
    name: 'Mirandese',
    nativeName: 'Mirandés',
    iso639Code: 'mwl',
    region: 'Southern Europe',
    countries: ['PT'],
    speakerCount: 15000,
    flagUrl: '/flags/pt.svg',
    adoptionStatus: 'AVAILABLE' as const,
    priority: 60,
    description: 'Broadcasting to Mirandese speakers in Northeast Portugal.'
  }
];

async function main() {
  console.log('🌍 Seeding 60 European languages for production...');

  // Only clear language table
  await prisma.language.deleteMany({});

  // Seed languages only
  for (const language of EUROPEAN_LANGUAGES) {
    await prisma.language.create({
      data: language,
    });
    console.log(`✅ Added ${language.name} (${language.nativeName})`);
  }

  console.log('🎉 Language seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ${EUROPEAN_LANGUAGES.length} European languages added`);
  console.log(`   - Ready for production use`);
}

main()
  .catch((e) => {
    console.error('❌ Error during language seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });