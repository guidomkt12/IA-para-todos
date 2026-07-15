import type { Appointment, AvailabilityRule, ProfessionalService, Service } from "./types";

const minutesOfDay = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

export function getAppointmentEnd(startAt: string, service: Service): string {
  return addMinutes(new Date(startAt), service.durationMinutes).toISOString();
}

export function isProfessionalAllowedForService(links: ProfessionalService[], organizationId: string, professionalId: string, serviceId: string): boolean {
  return links.some((link) => link.organizationId === organizationId && link.professionalId === professionalId && link.serviceId === serviceId && link.active);
}

export function isSlotAvailable(input: { organizationId: string; professionalId: string; service: Service; startAt: string; rules: AvailabilityRule[]; appointments: Appointment[] }): boolean {
  const start = new Date(input.startAt);
  const end = addMinutes(start, input.service.durationMinutes + input.service.bufferAfterMinutes);
  const startWithBuffer = addMinutes(start, -input.service.bufferBeforeMinutes);
  const day = start.getDay();
  const minute = start.getHours() * 60 + start.getMinutes();
  const endMinute = end.getHours() * 60 + end.getMinutes();
  const rule = input.rules.find((r) => r.organizationId === input.organizationId && r.professionalId === input.professionalId && r.dayOfWeek === day && r.active);
  if (!rule) return false;
  if (minute < minutesOfDay(rule.startTime) || endMinute > minutesOfDay(rule.endTime)) return false;
  if (rule.breakStartTime && rule.breakEndTime && minute < minutesOfDay(rule.breakEndTime) && endMinute > minutesOfDay(rule.breakStartTime)) return false;
  return !input.appointments.some((appointment) => appointment.organizationId === input.organizationId && appointment.professionalId === input.professionalId && !["cancelled", "no_show"].includes(appointment.status) && overlaps(startWithBuffer, end, new Date(appointment.startAt), new Date(appointment.endAt)));
}
