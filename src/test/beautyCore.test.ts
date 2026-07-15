import { describe, expect, it } from "vitest";
import { can } from "@/lib/beauty/authorization";
import { normalizePhoneToE164 } from "@/lib/beauty/phone";
import { isSlotAvailable } from "@/lib/beauty/scheduling";

describe("beauty SaaS core rules", () => {
  it("normalizes phone numbers without relying on last digits", () => {
    expect(normalizePhoneToE164("(11) 99999-0000")).toBe("+5511999990000");
    expect(() => normalizePhoneToE164("abc")).toThrow("phone_empty");
  });
  it("centralizes permissions by organization role", () => {
    expect(can("owner", "manageBilling")).toBe(true);
    expect(can("receptionist", "manageBilling")).toBe(false);
    expect(can("professional", "manageSchedule")).toBe(true);
  });
  it("applies hours, breaks, buffers and appointment conflicts", () => {
    const service = { duration_minutes: 60, buffer_before_minutes: 15, buffer_after_minutes: 15 };
    const rules = [{ organization_id: "org_1", professional_id: "pro_1", day_of_week: 1, start_time: "09:00", end_time: "18:00", break_start_time: "12:00", break_end_time: "13:00", active: true }];
    const appointments = [{ organization_id: "org_1", professional_id: "pro_1", start_at: "2026-07-13T14:00:00.000Z", end_at: "2026-07-13T15:00:00.000Z", status: "confirmed" }];
    expect(isSlotAvailable({ organizationId: "org_1", professionalId: "pro_1", startAt: "2026-07-13T09:00:00.000Z", service, rules, appointments: [] })).toBe(true);
    expect(isSlotAvailable({ organizationId: "org_1", professionalId: "pro_1", startAt: "2026-07-13T12:15:00.000Z", service, rules, appointments: [] })).toBe(false);
    expect(isSlotAvailable({ organizationId: "org_1", professionalId: "pro_1", startAt: "2026-07-13T13:50:00.000Z", service, rules, appointments })).toBe(false);
  });
});
