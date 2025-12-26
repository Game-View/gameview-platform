import { prisma } from "./index";
import { Category, UserRole } from "@prisma/client";

async function seed() {
  console.log("Seeding database...");

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: "test@gameview.tv" },
    update: {},
    create: {
      clerkId: "test_clerk_id",
      email: "test@gameview.tv",
      displayName: "Test User",
      role: UserRole.PLAYER,
    },
  });

  console.log("Created test user:", testUser.id);

  // Create a test creator
  const testCreator = await prisma.user.upsert({
    where: { email: "creator@gameview.tv" },
    update: {},
    create: {
      clerkId: "creator_clerk_id",
      email: "creator@gameview.tv",
      displayName: "Demo Creator",
      role: UserRole.CREATOR,
      creator: {
        create: {
          username: "democreator",
          displayName: "Demo Creator",
          bio: "Creating amazing immersive experiences",
          tagline: "Experience the world differently",
          isVerified: true,
        },
      },
    },
  });

  console.log("Created test creator:", testCreator.id);

  // Get the creator record
  const creator = await prisma.creator.findUnique({
    where: { userId: testCreator.id },
  });

  if (creator) {
    // Create sample experiences
    const experiences = await Promise.all([
      prisma.experience.create({
        data: {
          creatorId: creator.id,
          title: "Virtual Concert Experience",
          description:
            "Step into an immersive concert experience with full 360-degree views.",
          category: Category.ENTERTAINMENT,
          subcategory: "Music & Concerts",
          tags: ["music", "concert", "live", "immersive"],
          duration: 180,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      }),
      prisma.experience.create({
        data: {
          creatorId: creator.id,
          title: "Space Station Tour",
          description:
            "Explore the International Space Station like never before.",
          category: Category.EDUCATION,
          subcategory: "STEM & Science",
          tags: ["space", "science", "iss", "astronomy"],
          duration: 300,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      }),
      prisma.experience.create({
        data: {
          creatorId: creator.id,
          title: "Ancient Rome Walk",
          description:
            "Walk through the streets of ancient Rome at the height of the empire.",
          category: Category.EXPLORATION,
          subcategory: "History & Culture",
          tags: ["history", "rome", "ancient", "architecture"],
          duration: 420,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      }),
    ]);

    console.log("Created sample experiences:", experiences.length);

    // Add some interests to the test user
    await prisma.userInterest.createMany({
      data: [
        { userId: testUser.id, interest: "music", category: Category.ENTERTAINMENT },
        { userId: testUser.id, interest: "space", category: Category.EDUCATION },
        { userId: testUser.id, interest: "travel", category: Category.EXPLORATION },
      ],
      skipDuplicates: true,
    });

    console.log("Added user interests");

    // Make test user follow the creator
    await prisma.follow.upsert({
      where: {
        followerId_creatorId: {
          followerId: testUser.id,
          creatorId: creator.id,
        },
      },
      update: {},
      create: {
        followerId: testUser.id,
        creatorId: creator.id,
      },
    });

    console.log("Created follow relationship");
  }

  console.log("Seed completed!");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
