import { cn } from '@/lib/utils'

type BadgeVariant = 'navy' | 'terra' | 'green' | 'yellow' | 'red' | 'gray' | 'blue'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  navy: 'bg-navy-100 text-navy-800',
  terra: 'bg-terra-50 text-terra-700',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-800',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  )
}

// Status-specific badges
export function statusBadge(statut: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    brouillon: { label: 'Brouillon', variant: 'gray' },
    envoye: { label: 'Envoyé', variant: 'blue' },
    accepte: { label: 'Accepté', variant: 'green' },
    refuse: { label: 'Refusé', variant: 'red' },
    expire: { label: 'Expiré', variant: 'yellow' },
    envoyee: { label: 'Envoyée', variant: 'blue' },
    payee: { label: 'Payée', variant: 'green' },
    en_retard: { label: 'En retard', variant: 'red' },
    annulee: { label: 'Annulée', variant: 'gray' },
    en_cours: { label: 'En cours', variant: 'terra' },
    planifie: { label: 'Planifié', variant: 'blue' },
    termine: { label: 'Terminé', variant: 'green' },
    suspendu: { label: 'Suspendu', variant: 'yellow' },
    nouveau: { label: 'Nouveau', variant: 'terra' },
    en_attente: { label: 'En attente', variant: 'yellow' },
    traite: { label: 'Traité', variant: 'green' },
  }
  const cfg = map[statut] || { label: statut, variant: 'gray' }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
