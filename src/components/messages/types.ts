export interface ChatUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ChatListing {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  condition: string;
  status: string;
  card: {
    cardCode: string;
    nameJp: string;
    nameEn: string | null;
    imageUrl: string | null;
    rarity: string;
    latestPriceJpy: number | null;
    latestPriceThb: number | null;
  };
  user: ChatUser;
}

export interface ChatOffer {
  id: number;
  priceThb: number;
  status: string;
  note: string | null;
  buyerId: string;
  sellerId: string;
  parentId: number | null;
  createdAt: string;
}

export interface ChatOrder {
  id: number;
  priceThb: number;
  status: string;
  trackingNumber: string | null;
  shippingMethod: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  type: "TEXT" | "IMAGE" | "OFFER" | "ORDER_UPDATE" | "SYSTEM";
  senderId: string;
  isOwn: boolean;
  sender: { displayName: string | null; avatarUrl: string | null };
  offer: ChatOffer | null;
  order: ChatOrder | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Conversation {
  listingId: number;
  listing: ChatListing;
  otherUser: ChatUser;
  isSeller: boolean;
  lastMessage: string;
  lastMessageType: string;
  lastMessageAt: string;
  unread: number;
  pendingOffer: {
    id: number;
    priceThb: number;
    status: string;
    buyerId: string;
    listingId: number;
  } | null;
  activeOrder: {
    id: number;
    status: string;
    priceThb: number;
    buyerId: string;
    listingId: number;
  } | null;
}

export type OrderStatusType =
  | "AWAITING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";
