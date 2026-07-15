type Appointment = { organization_id: string; professional_id: string; start_at: string; end_at: string; status: string };
type AvailabilityRule = { organization_id: string; professional_id: string; day_of_week: number; start_time: string; end_time: string; break_start_time?: string | null; break_end_time?: string | null; active: boolean };
type Service = { duration_minutes: number; buffer_before_minutes?: number | null; buffer_after_minutes?: number | null };

const minutesOfDay = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const addMinutes = (date: Date, amount: number) => new Date(date.getTime() + amount * 60_000);
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

export function appointmentEnd(startAt: string, service: Service) {
  return addMinutes(new Date(startAt), service.duration_minutes).toISOString();
}

export function isSlotAvailable(input: { organizationId: string; professionalId: string; startAt: string; service: Service; rules: AvailabilityRule[]; appointments: Appointment[] }) {
  const start = new Date(input.startAt);
  const end = addMinutes(start, input.service.duration_minutes + (input.service.buffer_after_minutes ?? 0));
  const bufferedStart = addMinutes(start, -(input.service.buffer_before_minutes ?? 0));
  const startMinute = start.getHours() * 60 + start.getMinutes();
  const endMinute = end.getHours() * 60 + end.getMinutes();
  const rule = input.rules.find((item) => item.organization_id === input.organizationId && item.professional_id === input.professionalId && item.day_of_week === start.getDay() && item.active);
  if (!rule) return false;
  if (startMinute < minutesOfDay(rule.start_time) || endMinute > minutesOfDay(rule.end_time)) return false;
  if (rule.break_start_time && rule.break_end_time && startMinute < minutesOfDay(rule.break_end_time) && endMinute > minutesOfDay(rule.break_start_time)) return false;
  return !input.appointments.some((appointment) => appointment.organization_id === input.organizationId && appointment.professional_id === input.professionalId && !["cancelled", "no_show"].includes(appointment.status) && overlaps(bufferedStart, end, new Date(appointment.start_at), new Date(appointment.end_at)));
}
