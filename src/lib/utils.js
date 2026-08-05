import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format US phone input as (xxx) xxx-xxxx while typing. */
export function formatPhoneNumber(value) {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function phoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}
