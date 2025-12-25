/**
 * Mock Data for Player Platform Testing
 *
 * This data allows testing the full UI without a database connection.
 */

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner?: string;
  tagline?: string;
  bio?: string;
  websiteUrl?: string;
  socialLinks?: Record<string, string>;
  followers: number;
  experienceCount: number;
  totalPlays: number;
  isVerified: boolean;
  isPro: boolean;
  joinedAt: string;
  category: "entertainment" | "education" | "exploration";
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  previewUrl?: string;
  creatorId: string;
  category: "entertainment" | "education" | "exploration";
  subcategory: string;
  tags: string[];
  duration: number; // minutes
  playCount: number;
  price: number; // 0 = free
  releaseDate: string;
  ageRating: "E" | "E10+" | "T" | "M";
  rating?: number;
  seriesId?: string;
}

export interface Series {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  experienceIds: string[];
  thumbnail: string;
}

// Mock Creators
export const mockCreators: Creator[] = [
  {
    id: "creator_1",
    username: "zacbrownband",
    displayName: "Zac Brown Band",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=ZBB&backgroundColor=f97066",
    banner: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=300&fit=crop",
    tagline: "Official immersive concert experiences & behind the scenes",
    bio: "Step into our world with immersive 360° concert experiences. From the front row to backstage, experience our music like never before.",
    websiteUrl: "https://zacbrownband.com",
    socialLinks: {
      instagram: "https://instagram.com/zacbrownband",
      twitter: "https://twitter.com/zaborwnband",
    },
    followers: 45200,
    experienceCount: 12,
    totalPlays: 892000,
    isVerified: true,
    isPro: true,
    joinedAt: "2024-06-15",
    category: "entertainment",
  },
  {
    id: "creator_2",
    username: "dukebasketball",
    displayName: "Duke Basketball",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Duke&backgroundColor=1e40af",
    banner: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=300&fit=crop",
    tagline: "Experience Cameron Indoor Stadium like never before",
    bio: "The official Duke Basketball immersive experience channel. Go Blue Devils!",
    websiteUrl: "https://goduke.com",
    socialLinks: {
      instagram: "https://instagram.com/dukebasketball",
      twitter: "https://twitter.com/dukebasketball",
    },
    followers: 128500,
    experienceCount: 8,
    totalPlays: 2340000,
    isVerified: true,
    isPro: true,
    joinedAt: "2024-03-01",
    category: "entertainment",
  },
  {
    id: "creator_3",
    username: "smithsonian",
    displayName: "Smithsonian Institution",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SI&backgroundColor=14b8a6",
    banner: "https://images.unsplash.com/photo-1564399580075-5dfe19c205f3?w=1200&h=300&fit=crop",
    tagline: "Explore our museums and artifacts from anywhere in the world",
    bio: "The Smithsonian Institution brings you immersive educational experiences from our world-famous museums and collections.",
    websiteUrl: "https://si.edu",
    socialLinks: {
      instagram: "https://instagram.com/smithsonian",
    },
    followers: 89000,
    experienceCount: 24,
    totalPlays: 1567000,
    isVerified: true,
    isPro: true,
    joinedAt: "2024-01-10",
    category: "education",
  },
  {
    id: "creator_4",
    username: "wanderlust_sarah",
    displayName: "Sarah's Travel Diaries",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=fbbf24",
    banner: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop",
    tagline: "Travel blogger turned immersive creator",
    bio: "Let me take you places! From hidden gems to famous landmarks, experience the world's most beautiful destinations.",
    websiteUrl: "https://sarahtravels.com",
    socialLinks: {
      instagram: "https://instagram.com/wanderlust_sarah",
      youtube: "https://youtube.com/@sarahtraveldiaries",
    },
    followers: 23400,
    experienceCount: 18,
    totalPlays: 445000,
    isVerified: false,
    isPro: true,
    joinedAt: "2024-07-20",
    category: "exploration",
  },
  {
    id: "creator_5",
    username: "nasa_exploration",
    displayName: "NASA",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=NASA&backgroundColor=3b82f6",
    banner: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=300&fit=crop",
    tagline: "Explore the universe from Earth",
    bio: "Virtual space missions, astronaut training, and tours of the cosmos. Experience space exploration like never before.",
    websiteUrl: "https://nasa.gov",
    socialLinks: {
      twitter: "https://twitter.com/nasa",
      instagram: "https://instagram.com/nasa",
    },
    followers: 567000,
    experienceCount: 15,
    totalPlays: 8920000,
    isVerified: true,
    isPro: true,
    joinedAt: "2024-02-01",
    category: "education",
  },
  {
    id: "creator_6",
    username: "ancient_rome_vr",
    displayName: "Ancient Rome Virtual",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=ARV&backgroundColor=dc2626",
    banner: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=300&fit=crop",
    tagline: "Walk through ancient Rome as it was 2000 years ago",
    bio: "History comes alive with our meticulously reconstructed ancient Roman environments.",
    followers: 34500,
    experienceCount: 9,
    totalPlays: 678000,
    isVerified: true,
    isPro: false,
    joinedAt: "2024-05-01",
    category: "exploration",
  },
];

// Helper to get creator by ID
export function getCreatorById(id: string): Creator | undefined {
  return mockCreators.find((c) => c.id === id);
}

// Helper to get creator by username
export function getCreatorByUsername(username: string): Creator | undefined {
  return mockCreators.find((c) => c.username === username);
}

// Mock Experiences
export const mockExperiences: Experience[] = [
  // Zac Brown Band experiences
  {
    id: "exp_1",
    title: "Live at Fenway Park",
    description:
      "Experience our legendary Fenway Park concert from the front row. Feel the energy of 35,000 fans singing along to your favorite songs. This immersive 360° experience puts you right in the middle of the action.",
    thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop",
    creatorId: "creator_1",
    category: "entertainment",
    subcategory: "Music & Concerts",
    tags: ["concert", "live music", "country", "stadium"],
    duration: 15,
    playCount: 234000,
    price: 4.99,
    releaseDate: "2024-11-15",
    ageRating: "E",
    rating: 4.8,
    seriesId: "series_1",
  },
  {
    id: "exp_2",
    title: "Backstage Pass",
    description:
      "Go behind the scenes and see what happens before we hit the stage. Meet the crew, see the preparations, and experience the excitement of showtime from a whole new perspective.",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
    creatorId: "creator_1",
    category: "entertainment",
    subcategory: "Music & Concerts",
    tags: ["behind the scenes", "backstage", "country"],
    duration: 8,
    playCount: 156000,
    price: 0,
    releaseDate: "2024-10-20",
    ageRating: "E",
    rating: 4.6,
  },
  // Duke Basketball experiences
  {
    id: "exp_3",
    title: "Cameron Indoor Experience",
    description:
      "Step into the legendary Cameron Indoor Stadium. Feel the Cameron Crazies energy as you experience game day from courtside. The most immersive college basketball experience available.",
    thumbnail: "https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=600&h=400&fit=crop",
    creatorId: "creator_2",
    category: "entertainment",
    subcategory: "Sports & Fan Experiences",
    tags: ["basketball", "college sports", "duke", "arena"],
    duration: 12,
    playCount: 892000,
    price: 2.99,
    releaseDate: "2024-09-01",
    ageRating: "E",
    rating: 4.9,
    seriesId: "series_2",
  },
  {
    id: "exp_4",
    title: "Coach K's Office Tour",
    description:
      "Exclusive tour of the legendary Coach K's office and trophy room. See championship memorabilia, personal artifacts, and hear stories from Duke Basketball's storied history.",
    thumbnail: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&h=400&fit=crop",
    creatorId: "creator_2",
    category: "entertainment",
    subcategory: "Sports & Fan Experiences",
    tags: ["basketball", "history", "duke", "tour"],
    duration: 6,
    playCount: 445000,
    price: 0,
    releaseDate: "2024-08-15",
    ageRating: "E",
    rating: 4.7,
    seriesId: "series_2",
  },
  // Smithsonian experiences
  {
    id: "exp_5",
    title: "Apollo 11 Command Module",
    description:
      "Get inside the actual Apollo 11 command module that carried astronauts to the Moon and back. Touch history and experience the cramped quarters that housed humanity's greatest explorers.",
    thumbnail: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600&h=400&fit=crop",
    creatorId: "creator_3",
    category: "education",
    subcategory: "STEM & Science",
    tags: ["space", "apollo", "history", "museum"],
    duration: 10,
    playCount: 567000,
    price: 0,
    releaseDate: "2024-07-20",
    ageRating: "E",
    rating: 4.9,
    seriesId: "series_3",
  },
  {
    id: "exp_6",
    title: "Dinosaur Hall",
    description:
      "Walk among the giants. Our famous dinosaur exhibits come to life as you explore the Natural History Museum's renowned fossil collection.",
    thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop",
    creatorId: "creator_3",
    category: "education",
    subcategory: "STEM & Science",
    tags: ["dinosaurs", "fossils", "museum", "natural history"],
    duration: 15,
    playCount: 445000,
    price: 0,
    releaseDate: "2024-06-10",
    ageRating: "E",
    rating: 4.8,
  },
  // Sarah's Travel experiences
  {
    id: "exp_7",
    title: "Santorini Sunset",
    description:
      "Watch the famous Santorini sunset from the best viewpoint in Oia. Experience the magical colors as the sun dips below the Aegean Sea.",
    thumbnail: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop",
    creatorId: "creator_4",
    category: "exploration",
    subcategory: "Travel & Tourism",
    tags: ["greece", "santorini", "sunset", "travel"],
    duration: 8,
    playCount: 123000,
    price: 1.99,
    releaseDate: "2024-12-01",
    ageRating: "E",
    rating: 4.7,
    seriesId: "series_4",
  },
  {
    id: "exp_8",
    title: "Tokyo Night Walk",
    description:
      "Experience the neon-lit streets of Shibuya at night. From the famous crossing to hidden alleyways, discover Tokyo after dark.",
    thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop",
    creatorId: "creator_4",
    category: "exploration",
    subcategory: "Travel & Tourism",
    tags: ["japan", "tokyo", "night", "city"],
    duration: 12,
    playCount: 189000,
    price: 0,
    releaseDate: "2024-11-10",
    ageRating: "E",
    rating: 4.5,
  },
  // NASA experiences
  {
    id: "exp_9",
    title: "ISS Spacewalk",
    description:
      "Float outside the International Space Station and see Earth from 250 miles up. Experience the awe of a real astronaut spacewalk.",
    thumbnail: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=400&fit=crop",
    creatorId: "creator_5",
    category: "education",
    subcategory: "STEM & Science",
    tags: ["space", "ISS", "astronaut", "earth"],
    duration: 20,
    playCount: 2340000,
    price: 0,
    releaseDate: "2024-10-01",
    ageRating: "E",
    rating: 5.0,
    seriesId: "series_5",
  },
  {
    id: "exp_10",
    title: "Mars Rover Mission",
    description:
      "Drive the Perseverance rover across the Martian surface. Explore craters, collect samples, and search for signs of ancient life.",
    thumbnail: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&h=400&fit=crop",
    creatorId: "creator_5",
    category: "education",
    subcategory: "STEM & Science",
    tags: ["mars", "rover", "space", "exploration"],
    duration: 15,
    playCount: 1890000,
    price: 0,
    releaseDate: "2024-09-15",
    ageRating: "E",
    rating: 4.9,
    seriesId: "series_5",
  },
  // Ancient Rome experiences
  {
    id: "exp_11",
    title: "Colosseum Gladiator Day",
    description:
      "Experience a day in the life of a Roman gladiator at the Colosseum. Train in the ludus, prepare for battle, and face the arena.",
    thumbnail: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop",
    creatorId: "creator_6",
    category: "exploration",
    subcategory: "Historic Sites",
    tags: ["rome", "history", "gladiator", "colosseum"],
    duration: 18,
    playCount: 345000,
    price: 3.99,
    releaseDate: "2024-08-01",
    ageRating: "T",
    rating: 4.6,
    seriesId: "series_6",
  },
  {
    id: "exp_12",
    title: "Roman Forum Walk",
    description:
      "Stroll through the Roman Forum as it was 2000 years ago. See temples, markets, and public spaces in their original glory.",
    thumbnail: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600&h=400&fit=crop",
    creatorId: "creator_6",
    category: "exploration",
    subcategory: "Historic Sites",
    tags: ["rome", "history", "architecture", "ancient"],
    duration: 12,
    playCount: 234000,
    price: 0,
    releaseDate: "2024-07-15",
    ageRating: "E",
    rating: 4.5,
    seriesId: "series_6",
  },
];

// Mock Series
export const mockSeries: Series[] = [
  {
    id: "series_1",
    title: "Live Concert Series",
    description: "Experience our biggest shows from the best seats in the house",
    creatorId: "creator_1",
    experienceIds: ["exp_1"],
    thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop",
  },
  {
    id: "series_2",
    title: "Duke Game Day",
    description: "The complete Duke basketball experience",
    creatorId: "creator_2",
    experienceIds: ["exp_3", "exp_4"],
    thumbnail: "https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=600&h=400&fit=crop",
  },
  {
    id: "series_3",
    title: "Air & Space Collection",
    description: "Explore aviation and space history",
    creatorId: "creator_3",
    experienceIds: ["exp_5"],
    thumbnail: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600&h=400&fit=crop",
  },
  {
    id: "series_4",
    title: "Mediterranean Dreams",
    description: "Beautiful destinations around the Mediterranean",
    creatorId: "creator_4",
    experienceIds: ["exp_7"],
    thumbnail: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop",
  },
  {
    id: "series_5",
    title: "Space Exploration",
    description: "Journey through space with NASA",
    creatorId: "creator_5",
    experienceIds: ["exp_9", "exp_10"],
    thumbnail: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=400&fit=crop",
  },
  {
    id: "series_6",
    title: "Ancient Rome",
    description: "Step back in time 2000 years",
    creatorId: "creator_6",
    experienceIds: ["exp_11", "exp_12"],
    thumbnail: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop",
  },
];

// Helper functions
export function getExperienceById(id: string): Experience | undefined {
  return mockExperiences.find((e) => e.id === id);
}

export function getExperiencesByCreator(creatorId: string): Experience[] {
  return mockExperiences.filter((e) => e.creatorId === creatorId);
}

export function getExperiencesByCategory(category: string): Experience[] {
  return mockExperiences.filter((e) => e.category === category);
}

export function getFreeExperiences(): Experience[] {
  return mockExperiences.filter((e) => e.price === 0);
}

export function getTrendingExperiences(limit = 6): Experience[] {
  return [...mockExperiences].sort((a, b) => b.playCount - a.playCount).slice(0, limit);
}

export function getFeaturedCreators(limit = 4): Creator[] {
  return [...mockCreators].sort((a, b) => b.followers - a.followers).slice(0, limit);
}

export function getSeriesByCreator(creatorId: string): Series[] {
  return mockSeries.filter((s) => s.creatorId === creatorId);
}

export function formatPlayCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

// ============================================
// Mock User Data (for personalization testing)
// ============================================

export interface PlayHistoryEntry {
  experienceId: string;
  playedAt: string;
  completed: boolean;
  playTimeMinutes: number;
}

export interface ConnectedAccount {
  platform: "youtube" | "tiktok" | "twitch" | "twitter" | "instagram";
  username: string;
  connected: boolean;
  avatarUrl?: string;
}

export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio?: string;
  joinedAt: string;
  // Interests selected during onboarding
  interests: string[];
  // Category preferences
  categoryPreferences: ("entertainment" | "education" | "exploration")[];
  // Social connections
  connectedAccounts: ConnectedAccount[];
  // Following & activity
  followedCreatorIds: string[];
  wishlistExperienceIds: string[];
  playHistory: PlayHistoryEntry[];
  // Stats
  totalPlayTimeMinutes: number;
}

// Available interest tags for onboarding
export const AVAILABLE_INTERESTS = [
  // Entertainment
  { id: "music", label: "Music & Concerts", category: "entertainment" },
  { id: "sports", label: "Sports", category: "entertainment" },
  { id: "gaming", label: "Gaming", category: "entertainment" },
  { id: "movies", label: "Movies & TV", category: "entertainment" },
  { id: "comedy", label: "Comedy", category: "entertainment" },
  { id: "art", label: "Art & Design", category: "entertainment" },
  // Education
  { id: "science", label: "Science", category: "education" },
  { id: "space", label: "Space & Astronomy", category: "education" },
  { id: "history", label: "History", category: "education" },
  { id: "nature", label: "Nature & Wildlife", category: "education" },
  { id: "technology", label: "Technology", category: "education" },
  { id: "learning", label: "Learning & Skills", category: "education" },
  // Exploration
  { id: "travel", label: "Travel & Tourism", category: "exploration" },
  { id: "architecture", label: "Architecture", category: "exploration" },
  { id: "culture", label: "Culture & Heritage", category: "exploration" },
  { id: "adventure", label: "Adventure", category: "exploration" },
  { id: "food", label: "Food & Cuisine", category: "exploration" },
  { id: "cities", label: "Cities & Urban", category: "exploration" },
];

// Simulated logged-in user for testing personalization
export const mockCurrentUser: MockUser = {
  id: "user_1",
  username: "player_james",
  displayName: "James",
  email: "james@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James&backgroundColor=f97066",
  bio: "Love exploring virtual worlds and discovering new experiences!",
  joinedAt: "2024-11-01",
  // Selected interests
  interests: ["music", "space", "history", "travel"],
  categoryPreferences: ["entertainment", "education", "exploration"],
  // Connected social accounts
  connectedAccounts: [
    { platform: "youtube", username: "JamesPlays", connected: true },
    { platform: "tiktok", username: "", connected: false },
    { platform: "twitch", username: "james_gamer", connected: true },
    { platform: "twitter", username: "", connected: false },
    { platform: "instagram", username: "", connected: false },
  ],
  // User follows Zac Brown Band and NASA
  followedCreatorIds: ["creator_1", "creator_5"],
  // Wishlist
  wishlistExperienceIds: ["exp_1", "exp_7", "exp_11"],
  // User has played some experiences
  playHistory: [
    { experienceId: "exp_2", playedAt: "2024-12-20", completed: true, playTimeMinutes: 8 },
    { experienceId: "exp_9", playedAt: "2024-12-18", completed: true, playTimeMinutes: 20 },
    { experienceId: "exp_10", playedAt: "2024-12-15", completed: false, playTimeMinutes: 7 },
  ],
  totalPlayTimeMinutes: 35,
};

// Get creators the user follows
export function getFollowedCreators(): Creator[] {
  return mockCreators.filter((c) => mockCurrentUser.followedCreatorIds.includes(c.id));
}

// Get creators the user follows in a specific category
export function getFollowedCreatorsByCategory(category: string): Creator[] {
  return mockCreators.filter(
    (c) => mockCurrentUser.followedCreatorIds.includes(c.id) && c.category === category
  );
}

// Get experiences from creators the user follows
export function getExperiencesFromFollowedCreators(category?: string): Experience[] {
  const followedIds = mockCurrentUser.followedCreatorIds;
  let experiences = mockExperiences.filter((e) => followedIds.includes(e.creatorId));
  if (category) {
    experiences = experiences.filter((e) => e.category === category);
  }
  return experiences;
}

// Get experiences the user has played
export function getPlayedExperiences(): Experience[] {
  const playedIds = mockCurrentUser.playHistory.map((h) => h.experienceId);
  return mockExperiences.filter((e) => playedIds.includes(e.id));
}

// Get "More Like This" recommendations based on play history
// Returns experiences with similar tags or from same category that user hasn't played
export function getMoreLikeRecommendations(category?: string, limit = 6): Experience[] {
  const playedIds = mockCurrentUser.playHistory.map((h) => h.experienceId);
  const playedExperiences = getPlayedExperiences();

  // Collect tags from played experiences
  const playedTags = new Set<string>();
  playedExperiences.forEach((e) => e.tags.forEach((t) => playedTags.add(t)));

  // Find unplayed experiences with matching tags
  let recommendations = mockExperiences
    .filter((e) => !playedIds.includes(e.id))
    .filter((e) => !category || e.category === category)
    .map((e) => {
      // Score by number of matching tags
      const matchingTags = e.tags.filter((t) => playedTags.has(t)).length;
      return { experience: e, score: matchingTags };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.experience);

  return recommendations.slice(0, limit);
}

// Get popular experiences in category (excluding what user has played)
export function getPopularInCategory(category: string, limit = 6): Experience[] {
  const playedIds = mockCurrentUser.playHistory.map((h) => h.experienceId);
  return mockExperiences
    .filter((e) => e.category === category && !playedIds.includes(e.id))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

// Get new releases in category
export function getNewInCategory(category: string, limit = 6): Experience[] {
  return mockExperiences
    .filter((e) => e.category === category)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, limit);
}

// Get creators to discover (not followed, in category)
export function getCreatorsToDiscover(category: string, limit = 4): Creator[] {
  return mockCreators
    .filter((c) => c.category === category && !mockCurrentUser.followedCreatorIds.includes(c.id))
    .sort((a, b) => b.followers - a.followers)
    .slice(0, limit);
}

// Get user's wishlist experiences
export function getWishlistExperiences(): Experience[] {
  return mockExperiences.filter((e) => mockCurrentUser.wishlistExperienceIds.includes(e.id));
}

// Get user's play history with experience details
export function getPlayHistoryWithDetails(): (PlayHistoryEntry & { experience: Experience })[] {
  return mockCurrentUser.playHistory
    .map((entry) => {
      const experience = mockExperiences.find((e) => e.id === entry.experienceId);
      if (!experience) return null;
      return { ...entry, experience };
    })
    .filter((entry): entry is PlayHistoryEntry & { experience: Experience } => entry !== null)
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
}

// Format play time
export function formatPlayTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}
