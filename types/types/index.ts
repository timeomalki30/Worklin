export type UserRole = 'client' | 'artisan'

export interface Profile {
  id: string
  role: UserRole
  nom: string
  prenom: string
  email?: string
  phone?: string
  avatar_url?: string
  created_at: string
}

export interface Artisan {
  id: string
  profile_id: string
  metier: string
  description?: string
  ville?: string
  siret?: string
  tva?: string
  entreprise?: string
  adresse?: string
  tarif_horaire?: number
  certifications?: Record<string, boolean>
  note_moyenne?: number
  nb_avis?: number
  actif: boolean
  created_at: string
  profiles?: Profile
}

export interface Disponibilite {
  id: string
  artisan_id: string
  date: string
  heure_debut: string
  heure_fin: string
  disponible: boolean
}

export type ReservationStatut = 'en_attente' | 'confirmee' | 'annulee' | 'terminee'

export interface Reservation {
  id: string
  client_id: string
  artisan_id: string
  date: string
  heure: string
  statut: ReservationStatut
  description_travaux?: string
  created_at: string
  artisans?: Artisan
  profiles?: Profile
}

export type DevisStatut = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'

export interface LigneDocument {
  description: string
  quantite: number
  unite?: string
  prix_unitaire: number
  tva_pct: number
}

export interface Devis {
  id: string
  artisan_id: string
  client_id?: string
  numero: string
  titre: string
  statut: DevisStatut
  lignes: LigneDocument[]
  total_ht: number
  tva: number
  total_ttc: number
  date_emission: string
  date_validite: string
  notes?: string
  created_at: string
  clients_artisan?: ClientArtisan
}

export type FactureStatut = 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee'

export interface Facture {
  id: string
  artisan_id: string
  client_id?: string
  devis_id?: string
  numero: string
  statut: FactureStatut
  lignes: LigneDocument[]
  total_ht: number
  tva: number
  total_ttc: number
  date_emission: string
  date_echeance: string
  notes?: string
  created_at: string
  clients_artisan?: ClientArtisan
}

export interface ClientArtisan {
  id: string
  artisan_id: string
  nom: string
  prenom?: string
  email?: string
  phone?: string
  adresse?: string
  notes?: string
  created_at: string
}

export interface Avis {
  id: string
  reservation_id: string
  client_id: string
  artisan_id: string
  note: number
  commentaire?: string
  created_at: string
  profiles?: Profile
}
