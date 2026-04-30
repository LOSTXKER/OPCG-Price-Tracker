import type { ProfileSocialLinks } from "@/lib/profile/load-public-profile";

/**
 * The slim view of a user that the public profile UI needs. This is the
 * serialised shape produced by `loadPublicProfileData` (dates → ISO strings,
 * social fields collapsed into a single nullable object).
 */
export type ProfileUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  tier: string;
  sellerRating: number | null;
  sellerReviewCount: number;
  createdAt: string;
  handle: string | null;
  socials: ProfileSocialLinks | null;
};

export type ProfileStats = {
  listingCount: number;
  reviewCount: number;
  portfolioCardCount: number;
};

export type SerializedListing = {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  condition: string;
  quantity: number;
  shipping: string[];
  location: string | null;
  isFeatured: boolean;
  createdAt: string;
  card: {
    cardCode: string;
    nameJp: string;
    nameEn: string | null;
    rarity: string;
    imageUrl: string | null;
    latestPriceJpy: number | null;
  };
  seller: {
    displayName: string | null;
    avatarUrl: string | null;
    sellerRating: number | null;
    sellerReviewCount: number;
  };
};

export type SerializedReview = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export type ProfileCardData = {
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  priceJpy: number | null;
  priceThb: number | null;
  setCode?: string | null;
  quantity?: number | null;
  isPrivate?: boolean;
};

export type ProfileTab =
  | "achievements"
  | "listings"
  | "collection"
  | "reviews";
