export type Locale = 'hr' | 'en';

export type LocalizedText = Record<Locale, string>;

export type EventFilter = 'nearby' | 'joined' | 'created';
export type EventVisibility = 'public' | 'friends';
export type EventAttendanceMode = 'open' | 'waitlist' | 'paid';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished';
export type EventAttendanceStatus = 'joined' | 'left' | 'waitlisted' | 'approved' | 'rejected' | 'blocked';

export type EventsView = 'list' | 'map';

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type EventMedia = {
  id: string;
  mediaType: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  byteSize?: number;
  width?: number;
  height?: number;
  sortOrder: number;
};

export type EventMediaPayload = {
  mediaType?: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
};

export type EventQueryParams = {
  from?: string;
  to?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  query?: string;
  tags?: string;
  attendanceModes?: string;
};

export type FeedQueryParams = {
  cursor?: string;
  limit?: number;
  seed?: string;
  excludeEventIds?: string;
  from?: string;
  to?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  query?: string;
  tags?: string;
  attendanceModes?: string;
  scope?: 'all' | 'friends';
  sort?: 'default' | 'trending';
};

export type FypFeedPreset = 'forYou' | 'tonight' | 'weekend' | 'trending' | 'friends';
export type FypLocationMode = 'current' | 'city' | 'country';

export type FypFeedFilter = {
  preset: FypFeedPreset;
  locationMode: FypLocationMode;
  city: string;
  cityPlaceId?: string;
  country: string;
  countryPlaceId?: string;
  attendanceModes: EventAttendanceMode[];
};

export type MyEventsFilter = 'all' | 'joined' | 'created';

export type LocationConsent = 'unknown' | 'accepted' | 'rejected';
export type LocationSource = 'default' | 'device' | 'capital' | 'ip';

export type AppEvent = {
  id: string;
  creatorUserId?: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
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
  sourceUrl?: string;
  updatedAt?: string;
  cacheVersion?: string;
  eventRatingAverage?: number;
  eventRatingCount?: number;
  organizerRatingAverage?: number;
  organizerRatingCount?: number;
  likeCount: number;
  likedByMe?: boolean;
  participantCount: number;
  waitlistCount?: number;
  joinedByMe?: boolean;
  attendanceStatus?: EventAttendanceStatus;
  canJoin?: boolean;
  tags?: string[];
  media?: EventMedia[];
};

export type FeedPage = {
  items: AppEvent[];
  nextCursor?: string;
  hasMore: boolean;
};

export type EventCacheState = {
  id: string;
  cacheVersion: string;
  updatedAt?: string;
};

export type ChatMessagesQueryParams = {
  afterMessageId?: string;
  limit?: number;
};

export type SavedEventsOverview = {
  savedEvents: AppEvent[];
  goingSoon: AppEvent[];
  pastEvents: AppEvent[];
};

export type Friend = {
  id: string;
  name: string;
  avatarUrl?: string;
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
export type ChatMessageType = 'text' | 'event_share' | 'poll' | 'friend_request';
export type FeedPreferenceType = 'event' | 'creator' | 'tag';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export type ChatPerson = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type ChatMember = {
  id: string;
  name: string;
  avatarUrl?: string;
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
  senderAvatarUrl?: string;
  createdAt: string;
  timeLabel?: string;
  mine: boolean;
  event?: EventSharePreview;
  poll?: Poll;
  friendRequest?: FriendRequest;
};

export type ChatRoom = {
  id: string;
  type: ChatRoomType;
  title: string;
  avatarUrl?: string;
  directUserId?: string;
  subtitle?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  timeLabel?: string;
  unreadCount: number;
  memberCount: number;
  myRole?: ChatMemberRole;
  adminOnly: boolean;
  mutedByMe: boolean;
  eventId?: string;
  friendshipStatus?: FriendshipStatus;
  pendingFriendRequest?: FriendRequest;
  members?: ChatMember[];
};

export type EventParticipant = {
  userId: string;
  name: string;
  avatarUrl?: string;
  status: EventAttendanceStatus;
  joinedAt?: string;
  approvedAt?: string;
  blocked: boolean;
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
  avatarImage?: LocalEventImage;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type DeleteAccountPayload = {
  currentPassword?: string;
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
  notifications: AppNotification[];
};

export type OrganizerRatingPayload = {
  eventId: string;
  rating: number;
  comment?: string;
};

export type EventRatingPayload = {
  eventId: string;
  eventRating: number;
  organizerRating: number;
  eventComment?: string;
  organizerComment?: string;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  eventId?: string;
  createdAt?: string;
  readAt?: string;
};

export type NotificationPreferences = {
  directMessagesEnabled: boolean;
  groupMessagesEnabled: boolean;
};

export type FeedPreference = {
  id: string;
  type: FeedPreferenceType;
  targetId: string;
  label: string;
  createdAt?: string;
};

export type CreateFeedPreferencePayload = {
  type: FeedPreferenceType;
  targetId: string;
  label: string;
};

export type FriendRequest = {
  id: string;
  requesterUserId: string;
  requesterName?: string;
  recipientUserId: string;
  recipientName?: string;
  status: FriendRequestStatus;
  chatRoomId?: string;
  createdAt?: string;
  respondedAt?: string;
};

export type CreateFriendRequestPayload = {
  recipientUserId: string;
  chatRoomId: string;
};

export type TicketCheckout = {
  orderId?: string;
  eventId: string;
  provider: string;
  providerMode: string;
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

export type UpdateEventPayload = Partial<
  Pick<
    CreateEventPayload,
    | 'title'
    | 'where'
    | 'address'
    | 'about'
    | 'whenISO'
    | 'startAt'
    | 'endAt'
    | 'coordinates'
    | 'entranceCoordinates'
    | 'entryInstructions'
    | 'visibility'
    | 'attendanceMode'
    | 'priceAmount'
    | 'priceCurrency'
    | 'capacity'
    | 'tags'
  >
> & {
  status?: EventStatus;
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
  tags?: string[];
  images?: LocalEventImage[];
  video?: LocalEventVideo;
};

export type LocalEventImage = {
  uri: string;
  name: string;
  type: string;
  size?: number;
  width?: number;
  height?: number;
};

export type LocalEventVideo = {
  uri: string;
  name: string;
  type: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number | null;
};
