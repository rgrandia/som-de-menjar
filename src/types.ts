export interface Restaurant {
  id: string
  nom: string
  adreca?: string
  barri?: string
  ciutat?: string
  tipus_cuina?: string
  preu?: string
  puntuacio?: number
  puntuacio_menjar?: number
  puntuacio_servei?: number
  puntuacio_ambient?: number
  telefon?: string
  web?: string
  maps_url?: string
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
  visitat: "tots" | "si" | "no"
  ordre: string
  ordre_dir: "ASC" | "DESC"
}

export interface Opcions {
  barris: string[]
  ciutats: string[]
  tipus_cuina: string[]
  persones: string[]
}