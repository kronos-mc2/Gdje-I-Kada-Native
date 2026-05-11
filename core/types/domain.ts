export type Locale = 'hr' | 'en';

export type LocalizedText = Record<Locale, string>;

export type EventFilter = 'nearby' | 'joined' | 'created';
export type EventVisibility = 'public' | 'friends';
export type EventAttendanceMode = 'open' | 'waitlist' | 'paid';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished';
export type EventAttendanceStatus = 'joined' | 'left' | 'waitlisted' | 'approved' | 'rejected';

export type EventsView = 'list' | 'map';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type EventMedia = {
  id: string;
  mediaType: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  sortOrder: number;
};

export type EventQueryParams = {
  from?: string;
  to?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  query?: string;
};

export type FeedQueryParams = {
  cursor?: string;
  limit?: number;
};

export type MyEventsFilter = 'all' | 'joined' | 'created';

export type LocationConsent = 'unknown' | 'accepted' | 'rejected';
export type LocationSource = 'default' | 'device' | 'capital' | 'ip';

export type AppEvent = {
  id: string;
  creatorUserId?: string;
  title: LocalizedText;
  where: LocalizedText;
  address: string;
  about: LocalizedText;
  whenISO: string;
  startAt: string;
  endAt?: string;
  type: EventFilter;
  coordinates: Coordinates;
  entranceCoordinates?: Coordinates;
  entryInstructions?: LocalizedText;
  visibility?: EventVisibility;
  attendanceMode?: EventAttendanceMode;
  priceAmount?: number;
  priceCurrency?: string;
  capacity?: number;
  status?: EventStatus;
  organizerRatingAverage?: number;
  organizerRatingCount?: number;
  likeCount: number;
  likedByMe?: boolean;
  participantCount: number;
  joinedByMe?: boolean;
  attendanceStatus?: EventAttendanceStatus;
  canJoin?: boolean;
  media?: EventMedia[];
};

export type FeedPage = {
  items: AppEvent[];
  nextCursor?: string;
  hasMore: boolean;
};

export type Friend = {
  id: string;
  name: string;
  status: LocalizedText;
};

export type Conversation = {
  id: string;
  contact: string;
  lastMessage: LocalizedText;
  timeLabel: string;
};

export type ChatRoomType = 'direct' | 'group' | 'event';
export type ChatMemberRole = 'owner' | 'admin' | 'member';
export type ChatMessageType = 'text' | 'event_share' | 'poll';

export type ChatPerson = {
  id: string;
  name: string;
  email: string;
};

export type ChatMember = {
  id: string;
  name: string;
  role: ChatMemberRole;
};

export type EventSharePreview = {
  id: string;
  title: LocalizedText;
  where: LocalizedText;
  about: LocalizedText;
  whenISO: string;
  coverUrl?: string;
};

export type PollOption = {
  id: string;
  text: string;
  voteCount: number;
  votedByMe: boolean;
};

export type Poll = {
  id: string;
  question: string;
  allowMultiple: boolean;
  totalVotes: number;
  closed: boolean;
  myOptionIds: string[];
  options: PollOption[];
};

export type ChatMessage = {
  id: string;
  roomId: string;
  type: ChatMessageType;
  body?: string;
  senderUserId?: string;
  senderName?: string;
  createdAt: string;
  timeLabel?: string;
  mine: boolean;
  event?: EventSharePreview;
  poll?: Poll;
};

export type ChatRoom = {
  id: string;
  type: ChatRoomType;
  title: string;
  subtitle?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  timeLabel?: string;
  unreadCount: number;
  memberCount: number;
  myRole?: ChatMemberRole;
  adminOnly: boolean;
  eventId?: string;
  members?: ChatMember[];
};

export type ChatRoomDetail = {
  room: ChatRoom;
  messages: ChatMessage[];
};

export type CreateChatRoomPayload = {
  type: ChatRoomType;
  title?: string;
  memberUserId?: string;
  eventId?: string;
  memberUserIds?: string[];
};

export type CreatePollPayload = {
  question: string;
  options: string[];
  allowMultiple?: boolean;
};

export type UserProfile = {
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: UserProfile;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type UpdateProfilePayload = {
  name: string;
  bio?: string;
  avatarUrl?: string;
};

export type Transaction = {
  id: string;
  eventId?: string;
  eventTitle?: string;
  orderId?: string;
  type: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  description?: string;
  paymentProvider?: string;
  providerReference?: string;
  createdAt: string;
};

export type ProfileActivity = {
  joinedEvents: AppEvent[];
  likedEvents: AppEvent[];
  ratingCandidates: AppEvent[];
  transactions: Transaction[];
};

export type OrganizerRatingPayload = {
  eventId: string;
  rating: number;
  comment?: string;
};

export type TicketCheckout = {
  orderId?: string;
  eventId: string;
  provider: 'stripe' | string;
  providerMode: 'stub' | 'live' | string;
  status: 'pending' | 'succeeded' | 'cancelled' | 'failed' | 'expired';
  amount: number;
  currency: string;
  checkoutUrl?: string;
  clientSecret?: string;
  publishableKey?: string;
};

export type TicketCheckoutResult = {
  checkout: TicketCheckout;
  event: AppEvent;
  transaction?: Transaction;
};

export type CreateEventPayload = {
  title: string;
  titleHr?: string;
  titleEn?: string;
  where: string;
  whereHr?: string;
  whereEn?: string;
  address: string;
  about: string;
  aboutHr?: string;
  aboutEn?: string;
  whenISO: string;
  startAt?: string;
  endAt?: string;
  coordinates: Coordinates;
  entranceCoordinates?: Coordinates;
  entryInstructions?: string;
  entryInstructionsHr?: string;
  entryInstructionsEn?: string;
  visibility?: EventVisibility;
  attendanceMode?: EventAttendanceMode;
  priceAmount?: number;
  priceCurrency?: string;
  capacity?: number;
};
