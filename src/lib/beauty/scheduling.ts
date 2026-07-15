type Appointment = { organization_id: string; professional_id: string; start_at: string; end_at: string; status: string };
type AvailabilityRule = { organization_id: string; professional_id: string; day_of_week: number; start_time: string; end_time: string; break_start_time?: string | null; break_end_time?: string | null; active: boolean };
type Service = { duration_minutes: number; buffer_before_minutes?: number | null; buffer_after_minutes?: number | null };
const minutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
const add = (date: Date, amount: number) => new Date(date.getTime() + amount * 60000);
const overlaps = (a: Date, b: Date, c: Date, d: Date) => a < d && c < b;
export function appointmentEnd(startAt: string, service: Service) { return add(new Date(startAt), service.duration_minutes).toISOString(); }
export function isSlotAvailable(input: { organizationId: string; professionalId: string; startAt: string; service: Service; rules: AvailabilityRule[]; appointments: Appointment[] }) {
  const start = new Date(input.startAt);
  const end = add(start, input.service.duration_minutes + (input.service.buffer_after_minutes ?? 0));
  const bufferedStart = add(start, -(input.service.buffer_before_minutes ?? 0));
  const day = start.getDay();
  const startMinute = start.getHours() * 60 + start.getMinutes();
  const endMinute = end.getHours() * 60 + end.getMinutes();
  const rule = input.rules.find((r) => r.organization_id === input.organizationId && r.professional_id === input.professionalId && r.day_of_week === day && r.active);
  if (!rule) return false;
  if (startMinute < minutes(rule.start_time) || endMinute > minutes(rule.end_time)) return false;
  if (rule.break_start_time && rule.break_end_time && startMinute < minutes(rule.break_end_time) && endMinute > minutes(rule.break_start_time)) return false;
  return !input.appointments.some((a) => a.organization_id === input.organizationId && a.professional_id === input.professionalId && !["cancelled", "no_show"].includes(a.status) && overlaps(bufferedStart, end, new Date(a.start_at), new Date(a.end_at)));
}
