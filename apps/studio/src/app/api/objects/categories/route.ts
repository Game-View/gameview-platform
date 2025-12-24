import { NextResponse } from "next/server";
import { getCategoryCounts } from "@/lib/objects";

// Category display info
const categoryInfo = {
  collectibles: {
    name: "Collectibles",
    description: "Coins, gems, stars, and items players can collect",
    icon: "Star",
  },
  furniture: {
    name: "Furniture",
    description: "Tables, chairs, lamps, and home furnishings",
    icon: "Sofa",
  },
  props: {
    name: "Props",
    description: "Boxes, barrels, signs, and environmental props",
    icon: "Box",
  },
  interactive: {
    name: "Interactive",
    description: "Buttons, levers, doors, and interactive elements",
    icon: "MousePointer",
  },
  decorations: {
    name: "Decorations",
    description: "Plants, art, rugs, and decorative items",
    icon: "Palette",
  },
  audio: {
    name: "Audio",
    description: "Speakers, music players, and audio sources",
    icon: "Volume2",
  },
  effects: {
    name: "Effects",
    description: "Particles, lights, and visual effects",
    icon: "Sparkles",
  },
  characters: {
    name: "Characters",
    description: "NPCs, enemies, and character models",
    icon: "User",
  },
  vehicles: {
    name: "Vehicles",
    description: "Cars, boats, planes, and transportation",
    icon: "Car",
  },
  nature: {
    name: "Nature",
    description: "Trees, rocks, water, and natural elements",
    icon: "TreePine",
  },
};

/**
 * GET /api/objects/categories
 * Get all categories with counts and metadata
 */
export async function GET() {
  try {
    const counts = await getCategoryCounts();

    const categories = Object.entries(counts).map(([key, count]) => ({
      id: key,
      ...categoryInfo[key as keyof typeof categoryInfo],
      count,
    }));

    // Sort by count descending, then by name
    categories.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to get categories:", error);
    return NextResponse.json(
      { error: "Failed to get categories" },
      { status: 500 }
    );
  }
}
