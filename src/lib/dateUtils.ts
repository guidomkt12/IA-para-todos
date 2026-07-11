import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Robust date parser for mixed Brazilian/ISO formats.
 * Uses manual parsing to avoid date-fns misinterpretation.
 */
export function parseMixedDate(raw: unknown): Date | null {
  if (!raw) return null;

  // Limpa a string: remove "às", "T" e espaços extras
  let cleanStr = String(raw).replace(/às/gi, '').trim();
  if (!cleanStr) return null;

  // Caso 1: Formato ISO ou Padrão DB (Começa com Ano: YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    if (cleanStr.includes(' ') && !cleanStr.includes('T')) {
      cleanStr = cleanStr.replace(' ', 'T'); // Força padrão ISO estrito
    }
    const parsed = new Date(cleanStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Caso 2: Formato Brasileiro (Começa com Dia: DD/MM/YYYY)
  const brRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+)?(\d{2}:\d{2}(?::\d{2})?)?/;
  const match = cleanStr.match(brRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // O mês no JS começa em 0
    const year = parseInt(match[3], 10);

    let hours = 0, minutes = 0, seconds = 0;
    if (match[4]) {
      const timeParts = match[4].split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
      seconds = parseInt(timeParts[2], 10) || 0;
    }

    const parsed = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Caso 3: Formato curto DD/MM (sem ano)
  const shortRegex = /^(\d{1,2})\/(\d{1,2})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?$/;
  const shortMatch = cleanStr.match(shortRegex);
  if (shortMatch) {
    const day = parseInt(shortMatch[1], 10);
    const month = parseInt(shortMatch[2], 10) - 1;
    const year = new Date().getFullYear();

    let hours = 0, minutes = 0, seconds = 0;
    if (shortMatch[3]) {
      const timeParts = shortMatch[3].split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
      seconds = parseInt(timeParts[2], 10) || 0;
    }

    const parsed = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/** Format a mixed date string to "dd/MM/yyyy HH:mm" */
export function formatDateBR(raw: unknown): string {
  const d = parseMixedDate(raw);
  return d ? format(d, "dd/MM/yyyy HH:mm") : String(raw || "—");
}

/** Format a mixed date string to short "dd/MM" */
export function formatDateShort(raw: unknown): string {
  const d = parseMixedDate(raw);
  return d ? format(d, "dd/MM") : "";
}

/** Format to full Brazilian date string */
export function formatDateFull(raw: unknown): string {
  const d = parseMixedDate(raw);
  return d ? format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : String(raw || "—");
}

/** Format time only */
export function formatTime(raw: unknown): string {
  const d = parseMixedDate(raw);
  return d ? format(d, "HH:mm") : "";
}
