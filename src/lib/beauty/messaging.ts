import { normalizePhoneToE164 } from "./phone";
import type { NormalizedWebhookEvent, SendMessageResult } from "./types";

export interface VerifyWebhookInput { secret?: string; expectedSecret?: string; }
export interface SendTextInput { toPhoneE164: string; text: string; idempotencyKey: string; }

export interface MessagingProvider {
  verifyWebhook(input: VerifyWebhookInput): Promise<boolean>;
  parseWebhook(input: unknown): Promise<NormalizedWebhookEvent[]>;
  sendText(input: SendTextInput): Promise<SendMessageResult>;
}

export class MockMessagingProvider implements MessagingProvider {
  sent = new Map<string, SendMessageResult>();
  async verifyWebhook(input: VerifyWebhookInput) { return !input.expectedSecret || input.secret === input.expectedSecret; }
  async parseWebhook(input: unknown) {
    const payload = input as { eventId?: string; messageId?: string; from?: string; to?: string; text?: string; timestamp?: string };
    if (!payload.eventId || !payload.messageId || !payload.from || !payload.to) throw new Error("invalid_mock_webhook");
    return [{ externalEventId: payload.eventId, externalMessageId: payload.messageId, fromPhoneE164: normalizePhoneToE164(payload.from), toPhoneE164: normalizePhoneToE164(payload.to), timestamp: payload.timestamp ?? new Date().toISOString(), messageType: "text", text: payload.text ?? "", raw: input }];
  }
  async sendText(input: SendTextInput) {
    if (this.sent.has(input.idempotencyKey)) return this.sent.get(input.idempotencyKey)!;
    const result = { providerMessageId: `mock_${input.idempotencyKey}`, status: "sent" as const };
    this.sent.set(input.idempotencyKey, result);
    return result;
  }
}

export class UazapiMessagingProvider extends MockMessagingProvider {
  async parseWebhook(input: unknown) {
    const payload = input as { id?: string; message?: { id?: string; from?: string; to?: string; text?: string }; timestamp?: string };
    if (payload.message?.id && payload.message.from && payload.message.to) {
      return [{ externalEventId: payload.id ?? payload.message.id, externalMessageId: payload.message.id, fromPhoneE164: normalizePhoneToE164(payload.message.from), toPhoneE164: normalizePhoneToE164(payload.message.to), timestamp: payload.timestamp ?? new Date().toISOString(), messageType: "text", text: payload.message.text ?? "", raw: input }];
    }
    return super.parseWebhook(input);
  }
}
