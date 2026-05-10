export type UserRole = 'client' | 'artisan' | 'admin'

export interface Profile {
  id: string
  email?: string
  nom: string
  prenom: string
  phone?: string
  avatar_url?: string
  role: UserRole
  created_at: string
}

export interface Artisan {
  id: string
  profile_id: string
  slug: string
  metier: string
  description?: string
  ville?: string
  adresse?: string
  siret?: string
  tva?: string
  entreprise?: string
  tarif_horaire?: number
  note_moyenne?: number
  nb_avis?: number
  certifications?: Record<string, any>
  plan?: 'free' | 'pro' | 'business'
  actif?: boolean
  photo_url?: string
  cover_url?: string
  created_at: string
  profiles?: Profile
}

export interface Client {
  id: string
  artisan_id: string
  nom: string
  prenom?: string
  email?: string
  phone?: string
  adresse?: string
  type?: 'particulier' | 'pro'
  notes?: string
  created_at: string
}

// Alias — the CRM clients table is named "clients" in Worklin (previously "clients_artisan")
export type ClientArtisan = Client

export interface Disponibilite {
  id: string
  artisan_id: string
  date: string
  heure_debut: string
  heure_fin: string
  disponible?: boolean
  created_at?: string
}

export interface LigneDocument {
  description: string
  quantite: number
  unite?: string
  prix_unitaire: number
  tva_pct: number
}

export type DevisStatut = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'relance'

export interface CertificationEntry {
  active: boolean
  expires_at?: string // ISO date string
}

export interface Notification {
  id: string
  type: 'demande' | 'devis_expire' | 'certif_expire'
  message: string
  href: string
  read: boolean
  created_at: string
}
export type FactureStatut = 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee'

export interface Devis {
  id: string
  artisan_id: string
  client_id?: string
  numero: string
  titre?: string
  notes?: string
  statut: DevisStatut
  lignes: LigneDocument[]
  total_ht: number
  tva: number
  total_ttc: number
  date_emission: string
  date_validite?: string
  created_at: string
  clients?: Client
}

export interface Facture {
  id: string
  artisan_id: string
  client_id?: string
  devis_id?: string
  numero: string
  titre?: string
  notes?: string
  statut: FactureStatut
  lignes: LigneDocument[]
  total_ht: number
  tva: number
  total_ttc: number
  date_emission: string
  date_echeance?: string
  created_at: string
  clients?: Client
}

export type ChantierStatut = 'en_cours' | 'planifie' | 'termine' | 'suspendu'

export interface Chantier {
  id: string
  artisan_id: string
  client_id?: string
  titre: string
  statut: ChantierStatut
  notes?: string
  photos?: string[]
  date_debut?: string
  date_fin?: string
  created_at: string
  clients?: Client
}

export interface Agenda {
  id: string
  artisan_id: string
  client_id?: string
  titre?: string
  date: string
  heure: string
  duree?: number
  type?: 'rdv' | 'chantier' | 'autre'
  statut?: 'planifie' | 'confirme' | 'annule' | 'termine'
  notes?: string
  created_at: string
  clients?: Client
}

export interface Demande {
  id: string
  artisan_id: string
  nom: string
  email?: string
  phone?: string
  description: string
  statut?: 'nouveau' | 'en_cours' | 'traite' | 'refuse' | 'contacte' | 'converti'
  source?: string
  created_at: string
}

export interface Avis {
  id: string
  artisan_id: string
  client_nom: string
  note: number
  commentaire?: string
  source?: string
  created_at: string
}
