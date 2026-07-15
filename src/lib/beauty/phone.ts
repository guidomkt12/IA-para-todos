export function normalizePhoneToE164(input: string, defaultCountryCode = "55") {
  const digits = input.replace(/\D/g, "");
  if (!digits) throw new Error("phone_empty");
  if (input.trim().startsWith("+")) return `+${digits}`;
  if (digits.length >= 12 && digits.startsWith(defaultCountryCode)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+${defaultCountryCode}${digits}`;
  throw new Error("phone_invalid");
}
