import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility funkce pro spojování Tailwind CSS tříd
 * Kombinuje clsx pro podmíněné třídy a tailwind-merge pro řešení konfliktů
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
