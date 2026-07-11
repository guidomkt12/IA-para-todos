export type OrganizationRole = "platform_admin" | "owner" | "admin" | "receptionist" | "professional" | "viewer";
export type BusinessType = "salon" | "barbershop" | "beauty_studio" | "independent_professional" | "other";
export type ConversationStatus = "ai_active" | "waiting_customer" | "waiting_human" | "human_active" | "resolved" | "blocked";

export interface Organization { id: string; name: string; slug: string; businessType: BusinessType; timezone: string; locale: string; }
export interface Service { id: string; organizationId: string; name: string; durationMinutes: number; price: number; bufferBeforeMinutes: number; bufferAfterMinutes: number; active: boolean; onlineBookingEnabled: boolean; }
export interface Professional { id: string; organizationId: string; displayName: string; active: boolean; acceptsOnlineBooking: boolean; }
export interface ProfessionalService { organizationId: string; professionalId: string; serviceId: string; active: boolean; customDurationMinutes?: number; customPrice?: number; }
export interface AvailabilityRule { id: string; organizationId: string; professionalId: string; dayOfWeek: number; startTime: string; endTime: string; breakStartTime?: string; breakEndTime?: string; active: boolean; }
export interface Customer { id: string; organizationId: string; fullName: string; phoneE164: string; source: string; status: "new" | "active" | "inactive" | "vip" | "at_risk" | "blocked"; }
export interface Conversation { id: string; organizationId: string; customerId: string; status: ConversationStatus; aiEnabled: boolean; unreadCount: number; summary?: string; }
export interface Message { id: string; organizationId: string; conversationId: string; customerId: string; providerMessageId: string; direction: "inbound" | "outbound"; senderType: "customer" | "ai" | "human" | "system"; messageType: "text" | "image" | "audio" | "video" | "document" | "unsupported"; textContent?: string; createdAt: string; }
export interface Appointment { id: string; organizationId: string; customerId: string; professionalId: string; serviceId: string; conversationId?: string; startAt: string; endAt: string; timezone: string; status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"; source: "ai" | "human" | "dashboard" | "import" | "external"; priceSnapshot: number; durationSnapshot: number; }

export interface NormalizedWebhookEvent { externalEventId: string; externalMessageId: string; fromPhoneE164: string; toPhoneE164: string; timestamp: string; messageType: Message["messageType"]; text?: string; raw: unknown; }
export interface SendMessageResult { providerMessageId: string; status: "sent" | "queued" | "failed"; }
