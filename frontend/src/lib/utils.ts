import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mask phone number for PII protection & IDOR security
 * e.g., "0899999999" -> "089-***-9999"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'จองแล้ว';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 9) return phone;
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 3)}-***-${cleanPhone.slice(-4)}`;
  }
  return `${cleanPhone.slice(0, 3)}-***-${cleanPhone.slice(-3)}`;
}

/**
 * Format Date to DD/MM/YYYY in Asia/Bangkok timezone
 */
export function formatDate(d?: string | Date | null): string {
  if (!d) return '-';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '-';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(dateObj);

  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';

  return `${day}/${month}/${year}`;
}

/**
 * Format Date + Time with SRS slot label in Asia/Bangkok timezone
 * e.g., "15/07/2026 · ☀️ รอบกลางวัน (13:30 น.)"
 */
export function formatDateTime(d?: string | Date | null): string {
  if (!d) return '-';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '-';

  const dateStr = formatDate(dateObj);

  const timeStr = dateObj.toLocaleTimeString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  });

  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour: 'numeric',
    hour12: false,
  }).format(dateObj);
  const hour = parseInt(hourStr, 10);

  let slotLabel = '';
  if (hour < 12) slotLabel = '🌅 รอบเช้า';
  else if (hour < 16) slotLabel = '☀️ รอบกลางวัน';
  else if (hour < 19) slotLabel = '🌆 รอบเย็น';
  else slotLabel = '🌙 รอบดึก';

  return `${dateStr} · ${slotLabel} (${timeStr} น.)`;
}
