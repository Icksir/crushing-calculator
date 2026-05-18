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

