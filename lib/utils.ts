import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', options || { day: 'numeric', month: 'long', year: 'numeric' })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateNumero(prefix: string, count: number): string {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`
}

export const TVA_RATES = [0, 5.5, 10, 20]

export function calcTotals(lignes: { quantite: number; prix_unitaire: number; tva_pct: number }[]) {
  const total_ht = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)
  const tva = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire * (l.tva_pct / 100), 0)
  return { total_ht, tva, total_ttc: total_ht + tva }
}
