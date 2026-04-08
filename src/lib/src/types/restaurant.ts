export interface Restaurant {
  id?: string
  nom: string
  adreca?: string
  barri?: string
  ciutat?: string
  tipus_cuina?: string
  rang_preu?: string
  puntuacio_global?: number
  puntuacio_menjar?: number
  puntuacio_servei?: number
  puntuacio_ambient?: number
  telefon?: string
  web?: string
  google_maps_url?: string
  afegit_per?: string
  notes?: string
  visitat?: boolean
  created_at?: string
}