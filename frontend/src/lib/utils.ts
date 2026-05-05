import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "Fecha desconocida";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return "Error fecha";
  }
}

export function formatShortDate(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return "";
  }
}

/**
 * Strip leading zeros from numeric strings.
 * Preserves empty strings, minus sign, and standalone zeros.
 * Examples:
 *   "0150" -> "150"
 *   "007" -> "7"
 *   "0" -> "0"
 *   "00" -> "0"
 *   "-0150" -> "-150"
 *   "10" -> "10"
 *   "" -> ""
 *   "-" -> "-"
 */
export function stripLeadingZeros(val: string): string {
  if (val === '' || val === '-' || val === '0' || val === '-0') return val;
  return val.replace(/^(-?)0+(?=\d)/, '$1');
}

/**
 * Prevent typing a leading zero in numeric inputs.
 * Call this from onKeyDown handlers for all numeric inputs.
 * It blocks the keystroke if it would create a leading zero pattern.
 * Examples:
 *   typing '6' when value is "0"  → blocked (would become "06")
 *   typing '0' when value is "60" → allowed (would become "600")
 *   typing '0' when value is ""   → allowed (would become "0")
 */
export function preventLeadingZeros(e: React.KeyboardEvent<HTMLInputElement>) {
  if (/^[0-9]$/.test(e.key)) {
    const input = e.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const wouldBecome = input.value.slice(0, start) + e.key + input.value.slice(end);
    if (/^-?0\d/.test(wouldBecome)) {
      e.preventDefault();
    }
  }
}

/**
 * Select all text on focus when the input value is "0" or empty.
 * This makes the input behave like a placeholder: typing any digit
 * replaces the zero entirely instead of appending to it.
 * Use this onFocus handler for all numeric inputs.
 */
export function selectOnFocusIfZero(e: React.FocusEvent<HTMLInputElement>) {
  const input = e.target;
  if (input.value === '0' || input.value === '') {
    setTimeout(() => input.select(), 0);
  }
}

