import type { Appointment, AvailabilityRule, Conversation, Customer, Message, Organization, Professional, ProfessionalService, Service } from "./types";
import { MockMessagingProvider } from "./messaging";
import { getAppointmentEnd, isProfessionalAllowedForService, isSlotAvailable } from "./scheduling";

export interface BeautyState { organizations: Organization[]; services: Service[]; professionals: Professional[]; professionalServices: ProfessionalService[]; availabilityRules: AvailabilityRule[]; customers: Customer[]; conversations: Conversation[]; messages: Message[]; appointments: Appointment[]; processedEvents: Set<string>; }
export const createEmptyBeautyState = (): BeautyState => ({ organizations: [], services: [], professionals: [], professionalServices: [], availabilityRules: [], customers: [], conversations: [], messages: [], appointments: [], processedEvents: new Set() });
const id = (prefix: string, n: number) => `${prefix}_${n}`;

export function seedVerticalFlow(state = createEmptyBeautyState()) {
  const organization: Organization = { id: "org_demo", name: "Studio Demonstração", slug: "studio-demonstracao", businessType: "salon", timezone: "America/Sao_Paulo", locale: "pt-BR" };
  const service: Service = { id: "svc_corte", organizationId: organization.id, name: "Corte feminino", durationMinutes: 60, price: 120, bufferBeforeMinutes: 0, bufferAfterMinutes: 15, active: true, onlineBookingEnabled: true };
  const professional: Professional = { id: "pro_ana", organizationId: organization.id, displayName: "Ana", active: true, acceptsOnlineBooking: true };
  const link: ProfessionalService = { organizationId: organization.id, professionalId: professional.id, serviceId: service.id, active: true };
  const rule: AvailabilityRule = { id: "rule_ana_weekday", organizationId: organization.id, professionalId: professional.id, dayOfWeek: 1, startTime: "09:00", endTime: "18:00", breakStartTime: "12:00", breakEndTime: "13:00", active: true };
  state.organizations.push(organization); state.services.push(service); state.professionals.push(professional); state.professionalServices.push(link); state.availabilityRules.push(rule);
  return { state, organization, service, professional };
}

export async function processMockInbound(input: { state: BeautyState; provider: MockMessagingProvider; organizationId: string; payload: unknown; expectedSecret?: string; secret?: string; requestedStartAt: string; }) {
  const verified = await input.provider.verifyWebhook({ secret: input.secret, expectedSecret: input.expectedSecret });
  if (!verified) throw new Error("webhook_unauthorized");
  const [event] = await input.provider.parseWebhook(input.payload);
  const eventKey = `${input.organizationId}:${event.externalEventId}`;
  if (input.state.processedEvents.has(eventKey)) return { duplicate: true };
  input.state.processedEvents.add(eventKey);

  let customer = input.state.customers.find((c) => c.organizationId === input.organizationId && c.phoneE164 === event.fromPhoneE164);
  if (!customer) {
    customer = { id: id("cus", input.state.customers.length + 1), organizationId: input.organizationId, fullName: "Cliente WhatsApp", phoneE164: event.fromPhoneE164, source: "whatsapp", status: "new" };
    input.state.customers.push(customer);
  }
  let conversation = input.state.conversations.find((c) => c.organizationId === input.organizationId && c.customerId === customer.id && c.status !== "resolved");
  if (!conversation) {
    conversation = { id: id("con", input.state.conversations.length + 1), organizationId: input.organizationId, customerId: customer.id, status: "ai_active", aiEnabled: true, unreadCount: 1 };
    input.state.conversations.push(conversation);
  }
  if (!input.state.messages.some((m) => m.organizationId === input.organizationId && m.providerMessageId === event.externalMessageId)) {
    input.state.messages.push({ id: id("msg", input.state.messages.length + 1), organizationId: input.organizationId, conversationId: conversation.id, customerId: customer.id, providerMessageId: event.externalMessageId, direction: "inbound", senderType: "customer", messageType: event.messageType, textContent: event.text, createdAt: event.timestamp });
  }
  if (!conversation.aiEnabled || conversation.status === "human_active") return { customer, conversation, appointment: undefined };

  const service = input.state.services.find((s) => s.organizationId === input.organizationId && s.active && s.onlineBookingEnabled);
  const professional = input.state.professionals.find((p) => p.organizationId === input.organizationId && p.active && p.acceptsOnlineBooking);
  if (!service || !professional || !isProfessionalAllowedForService(input.state.professionalServices, input.organizationId, professional.id, service.id)) throw new Error("booking_unavailable");
  if (!isSlotAvailable({ organizationId: input.organizationId, professionalId: professional.id, service, startAt: input.requestedStartAt, rules: input.state.availabilityRules, appointments: input.state.appointments })) throw new Error("slot_unavailable");

  const appointment: Appointment = { id: id("apt", input.state.appointments.length + 1), organizationId: input.organizationId, customerId: customer.id, professionalId: professional.id, serviceId: service.id, conversationId: conversation.id, startAt: input.requestedStartAt, endAt: getAppointmentEnd(input.requestedStartAt, service), timezone: "America/Sao_Paulo", status: "confirmed", source: "ai", priceSnapshot: service.price, durationSnapshot: service.durationMinutes };
  input.state.appointments.push(appointment);
  const send = await input.provider.sendText({ toPhoneE164: customer.phoneE164, text: `Agendamento confirmado: ${service.name} com ${professional.displayName}.`, idempotencyKey: `reply:${event.externalMessageId}` });
  input.state.messages.push({ id: id("msg", input.state.messages.length + 1), organizationId: input.organizationId, conversationId: conversation.id, customerId: customer.id, providerMessageId: send.providerMessageId, direction: "outbound", senderType: "ai", messageType: "text", textContent: `Agendamento confirmado: ${service.name} com ${professional.displayName}.`, createdAt: new Date().toISOString() });
  conversation.status = "waiting_customer";
  return { customer, conversation, appointment };
}

export function takeoverConversation(state: BeautyState, organizationId: string, conversationId: string) {
  const conversation = state.conversations.find((item) => item.organizationId === organizationId && item.id === conversationId);
  if (!conversation) throw new Error("conversation_not_found");
  conversation.status = "human_active";
  conversation.aiEnabled = false;
  return conversation;
}
