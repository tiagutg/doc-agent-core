import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes do Tailwind de forma segura, evitando conflitos
 * (ex: "p-2" + "p-4" vira apenas "p-4"). Usado por todos os componentes ui/*.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um tamanho em bytes para uma string legível (KB, MB, GB...).
 * Ex: formatFileSize(1536) -> "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const unidades = ["B", "KB", "MB", "GB"];
  const indice = Math.floor(Math.log(bytes) / Math.log(1024));
  const valor = bytes / Math.pow(1024, indice);

  return `${valor.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}

/**
 * Retorna a extensão de um arquivo em minúsculas (sem o ponto).
 * Ex: getFileExtension("Main.PY") -> "py"
 */
export function getFileExtension(fileName: string): string {
  const partes = fileName.split(".");
  if (partes.length < 2) return "";
  return partes.pop()!.toLowerCase();
}

/**
 * Gera um ID curto e único para uso em listas (chaves do React, ids de job, etc).
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
