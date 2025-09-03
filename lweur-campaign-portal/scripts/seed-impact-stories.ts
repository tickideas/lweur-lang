// scripts/seed-impact-stories.ts
// Script to seed sample impact stories for testing the impact management system
// Creates testimonials matching the design shown in the user's image
// RELEVANT FILES: prisma/schema.prisma, src/app/api/admin/impact/route.ts, src/types/impact.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedImpactStories() {
  console.log('🌱 Seeding impact stories...');

  const stories = [
    {
      content: "I want to say how grateful I am for LOVEWORLD UK and the many blessings that has come to me and my family. I am forever grateful. I watch Loveworld UK online everyday.",
      authorName: "Chris Anable",
      authorRole: "Supporter",
      location: "London, UK",
      isPublished: true,
      isFeatured: false,
      displayOrder: 1
    },
    {
      content: "Dear Pastor Chris, may your ministry continue to grow & be a blessing to people's lives all over the world. I am so privileged to be a partner of this ministry. I thank you for blessing me & my family with the Word, your inspiring messages & for the little gifts I have received from you in the post recently & over the past few months.",
      authorName: "Denise Pearce",
      authorRole: "Ministry Partner",
      location: "Birmingham, UK",
      isPublished: true,
      isFeatured: true, // This will be the featured center card
      displayOrder: 2
    },
    {
      content: "One morning as I prepared for church I happened to tune in to one of Pastor Chris's sermons on LoveWorld UK, and he spoke something into my spirit that touched me in a way that I believed was an anointing of the Holy Spirit affirming that there would be answers to needs and inquiries I had been expressing. I will keep Pastor Chris's ministry apprised of my progress and will spend time listening to his sermons. Thank you",
      authorName: "Bro. D. Leonard Wells",
      authorRole: "Church Member",
      location: "Manchester, UK",
      isPublished: true,
      isFeatured: false,
      displayOrder: 3
    },
    {
      content: "The impact of Loveworld Europe has been phenomenal in our community. Through the German language channel, we've seen families transformed and hearts changed. The daily programs bring hope and faith to thousands of German-speaking believers across Europe.",
      authorName: "Pastor Klaus Mueller",
      authorRole: "German Language Coordinator",
      location: "Berlin, Germany",
      isPublished: true,
      isFeatured: false,
      displayOrder: 4
    },
    {
      content: "Supporting the French translation has been one of our most rewarding decisions. We receive testimonials weekly from French-speaking viewers whose lives have been touched by Pastor Chris's teachings. The reach across Francophone Europe is incredible.",
      authorName: "Marie Dubois",
      authorRole: "Translation Sponsor",
      location: "Lyon, France",
      isPublished: true,
      isFeatured: false,
      displayOrder: 5
    },
    {
      content: "As a Spanish language adopter, I've witnessed firsthand how the Gospel message transcends borders. Our monthly support enables continuous broadcasting that reaches millions of Spanish speakers across Europe with life-transforming content.",
      authorName: "Carlos Rodriguez",
      authorRole: "Language Adopter",
      location: "Madrid, Spain",
      isPublished: false, // Draft story
      isFeatured: false,
      displayOrder: 6
    }
  ];

  for (const story of stories) {
    try {
      const createdStory = await prisma.impactStory.create({
        data: story
      });
      console.log(`✅ Created story by ${story.authorName} (ID: ${createdStory.id})`);
    } catch (error) {
      console.error(`❌ Failed to create story by ${story.authorName}:`, error);
    }
  }

  console.log('🎉 Impact stories seeding completed!');
}

async function main() {
  try {
    await seedImpactStories();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();