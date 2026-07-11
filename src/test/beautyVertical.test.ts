import { describe, expect, it } from "vitest";
import { can } from "@/lib/beauty/authorization";
import { MockMessagingProvider } from "@/lib/beauty/messaging";
import { normalizePhoneToE164 } from "@/lib/beauty/phone";
import { isSlotAvailable } from "@/lib/beauty/scheduling";
import { processMockInbound, seedVerticalFlow, takeoverConversation } from "@/lib/beauty/verticalFlow";

describe("beauty vertical flow", () => {
  it("normalizes Brazilian phones to E.164", () => {
    expect(normalizePhoneToE164("(11) 99999-0000")).toBe("+5511999990000");
  });

  it("creates customer, conversation and appointment, blocks duplicate webhook and pauses AI after takeover", async () => {
    const { state, organization, service, professional } = seedVerticalFlow();
    const provider = new MockMessagingProvider();
    const payload = { eventId: "evt_1", messageId: "wamid_1", from: "11999990000", to: "1133334444", text: "Quero cortar cabelo" };
    const requestedStartAt = "2026-07-13T09:00:00.000Z";
    const first = await processMockInbound({ state, provider, organizationId: organization.id, payload, expectedSecret: "secret", secret: "secret", requestedStartAt });
    expect(first.appointment?.serviceId).toBe(service.id);
    expect(first.appointment?.professionalId).toBe(professional.id);
    expect(state.customers).toHaveLength(1);
    expect(state.conversations).toHaveLength(1);
    expect(state.messages.filter((m) => m.senderType === "ai")).toHaveLength(1);
    const duplicate = await processMockInbound({ state, provider, organizationId: organization.id, payload, expectedSecret: "secret", secret: "secret", requestedStartAt });
    expect(duplicate.duplicate).toBe(true);
    expect(state.appointments).toHaveLength(1);
    const taken = takeoverConversation(state, organization.id, state.conversations[0].id);
    expect(taken.aiEnabled).toBe(false);
    expect(taken.status).toBe("human_active");
  });

  it("rejects unavailable slots and enforces role permissions", () => {
    const { state, organization, service, professional } = seedVerticalFlow();
    expect(isSlotAvailable({ organizationId: organization.id, professionalId: professional.id, service, startAt: "2026-07-13T12:30:00.000Z", rules: state.availabilityRules, appointments: state.appointments })).toBe(false);
    expect(can("receptionist", "manageConversations")).toBe(true);
    expect(can("receptionist", "manageBilling")).toBe(false);
  });
});
