export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum UserTier {
  BRONZE = 'Bronze',
  PRATA = 'Prata',
  OURO = 'Ouro',
  DIAMANTE = 'Diamante'
}

export interface UserProfile {
  uid: string;
  phone: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  inviteCode: string;
  referredBy?: string;
  tier: UserTier;
  creditsBalance: number;
  createdAt: any;
  lastSeenAt?: any;
  onboardingCompleted?: boolean;
}

export enum TransactionType {
  REFERRAL = 'referral',
  BOOKING_DISCOUNT = 'booking_discount',
  TRANSFER_SEND = 'transfer_send',
  TRANSFER_RECEIVE = 'transfer_receive',
  EXPIRATION = 'expiration',
  ADMIN_ADJUSTMENT = 'admin_adjustment'
}

export enum NotificationType {
  CREDIT_RECEIVED = 'credit_received',
  EXPIRATION_ALERT = 'expiration_alert',
  NEW_REFERRAL = 'new_referral',
  RANK_UP = 'rank_up',
  BOOKING_CONFIRMED = 'booking_confirmed',
  SYSTEM = 'system'
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  sourceId?: string;
  description?: string;
  createdAt: any;
  expiresAt?: any;
}

export enum BookingStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESCHEDULED = 'rescheduled',
  DEPOSIT_PENDING = 'deposit_pending',
  DEPOSIT_PAID = 'deposit_paid',
  NO_SHOW = 'no_show',
  COMPLETED = 'completed'
}

export interface StudioSettings {
  workingDays: number[]; // 0-6 (Sunday-Saturday)
  workingHours: { start: string; end: string };
  durations: {
    Pequena: number; // in minutes
    Média: number;
    Grande: number;
  };
  blockedDates: string[]; // YYYY-MM-DD
  blockedIntervals: {
    date: string;
    start: string;
    end: string;
    label?: string;
  }[];
  maxSessionsPerDay: number;
  adminIds: string[];
  allowIndicatorBooking: boolean;
  allowArtistBooking: boolean;
  whatsappTemplates?: {
    confirmacao?: string;
    lembrete?: string;
    followup?: string;
  };
  automation?: {
    evolutionBaseUrl: string;
    evolutionApiKey: string;
    evolutionInstance: string;
    reminderValue: number;
    reminderUnit: 'minutes' | 'hours' | 'days';
    followUpValue: number;
    followUpUnit: 'minutes' | 'hours' | 'days';
    enabled: boolean;
    confirmationEnabled?: boolean;
    reminderEnabled?: boolean;
    followUpEnabled?: boolean;
  };
}

export interface StudioRule {
  id: string;
  order: number;
  title: string;
  content: string;
  active: boolean;
}

export interface InviteCode {
  id: string;
  code: string;
  createdAt: any;
  expiresAt: any;
  maxUses: number;
  usesCount: number;
  createdByAdmin: boolean;
  active: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  bonusLevel1Percent: number; // e.g. 100 means R$ 100
  bonusLevel2Percent: number;
  bonusLevel3Percent: number;
  startDate: any;
  endDate: any;
  active: boolean;
}

export interface Artist {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  active: boolean;
  bio: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  artistId?: string;
  size: 'Pequena' | 'Média' | 'Grande';
  date: string;
  time: string;
  status: BookingStatus;
  priceEstimated: number;
  depositPaid: number;
  creditsUsed: number;
  createdAt: any;
  // Campos da Agenda Administrativa
  fotos_referencia?: string[];
  descricao_servico?: string;
  estilo?: string;
  primeira_tatuagem?: boolean;
  regiao_corpo?: string;
  observacoes?: string;
  valor_estimado?: number;
  valor_sinal?: number;
  confirmationSent?: boolean;
  reminderSent?: boolean;
  followUpSent?: boolean;
}

export interface Invite {
  code: string;
  userId: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}
