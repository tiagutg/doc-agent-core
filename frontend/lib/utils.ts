import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const unidades = ["B", "KB", "MB", "GB"];
  const indice = Math.floor(Math.log(bytes) / Math.log(1024));
  const valor = bytes / Math.pow(1024, indice);

  return `${valor.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}

export function getFileExtension(fileName: string): string {
  const partes = fileName.split(".");
  if (partes.length < 2) return "";
  return partes.pop()!.toLowerCase();
}


export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
