export type ApiStatus = "checking" | "connected" | "error"

export interface HealthResponse {
  ok: boolean
}

export interface Restaurant {
  id: number
  nom: string
  adreca: string | null
  barri: string | null
  ciutat: string | null
  tipus_cuina: string | null
  preu: string | null
  puntuacio: number | null
  puntuacio_menjar: number | null
  puntuacio_servei: number | null
  puntuacio_ambient: number | null
  telefon: string | null
  web: string | null
  maps_url: string | null
  afegit_per: string | null
  notes: string | null
  visitat: boolean
  data_afegit: string
}

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

export interface Filtres {
  cerca: string
  barri: string
  ciutat: string
  tipus_cuina: string
  preu: string[]
  puntuacio_min: number | null
  visitat: string // "tots" | "si" | "no"
  ordre: string
  ordre_dir: string
}

export interface Opcions {
  barris: string[]
  ciutats: string[]
  tipus_cuina: string[]
  persones: string[]
}
