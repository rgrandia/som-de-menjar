import { useState, useEffect, useCallback, useRef } from "react"
import type { Restaurant, Filtres, Opcions } from "./types"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Plus, UtensilsCrossed, Loader2 } from "lucide-react"
import FiltresCerca from "./components/FiltresCerca"
import RestaurantCard from "./components/RestaurantCard"
import AfegirRestaurant from "./components/AfegirRestaurant"
import { supabase } from "./lib/supabase"

const FILTRES_INICIALS: Filtres = {
  cerca: "",
  barri: "",
  ciutat: "",
  tipus_cuina: "",
  preu: [],
  puntuacio_min: null,
  visitat: "tots",
  ordre: "created_at",
  ordre_dir: "DESC",
}

function buildQuery(f: Filtres): string {
  const params = new URLSearchParams()
  if (f.cerca) params.set("cerca", f.cerca)
  if (f.barri) params.set("barri", f.barri)
  if (f.ciutat) params.set("ciutat", f.ciutat)
  if (f.tipus_cuina) params.set("tipus_cuina", f.tipus_cuina)
  if (f.preu.length > 0) params.set("preu", f.preu.join(","))
  if (f.puntuacio_min !== null) params.set("puntuacio_min", String(f.puntuacio_min))
  if (f.visitat !== "tots") params.set("visitat", f.visitat === "si" ? "true" : "false")
  params.set("ordre", f.ordre)
  params.set("ordre_dir", f.ordre_dir)
  return params.toString()
}

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_INICIALS)
  const [opcions, setOpcions] = useState<Opcions>({ barris: [], ciutats: [], tipus_cuina: [], persones: [] })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editant, setEditant] = useState<Restaurant | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
    [...new Set(values.filter((v): v is string => typeof v === "string" && v.length > 0))]

  const fetchRestaurants = useCallback(async (f: Filtres) => {
    setLoading(true)
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .order(f.ordre, { ascending: f.ordre_dir === "ASC" })

      // Aplicar filtres
      if (f.cerca) {
        query = query.or(`nom.ilike.%${f.cerca}%,barri.ilike.%${f.cerca}%,tipus_cuina.ilike.%${f.cerca}%,notes.ilike.%${f.cerca}%`)
      }
      if (f.barri) {
        query = query.ilike('barri', `%${f.barri}%`)
      }
      if (f.ciutat) {
        query = query.ilike('ciutat', `%${f.ciutat}%`)
      }
      if (f.tipus_cuina) {
        query = query.ilike('tipus_cuina', `%${f.tipus_cuina}%`)
      }
      if (f.preu.length > 0) {
        query = query.in('rang_preu', f.preu)
      }
      if (f.puntuacio_min !== null) {
        query = query.gte('puntuacio_global', f.puntuacio_min)
      }
      if (f.visitat !== "tots") {
        query = query.eq('visitat', f.visitat === "si")
      }

      const { data, error } = await query

      if (error) throw error
      
      setRestaurants(data as Restaurant[])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en carregar els restaurants")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOpcions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('barri, ciutat, tipus_cuina, afegit_per')

      if (error) throw error

      const barris = uniqueStrings(data?.map((x) => x.barri))
      const ciutats = uniqueStrings(data?.map((x) => x.ciutat))
      const tipus = uniqueStrings(data?.map((x) => x.tipus_cuina))
      const persones = uniqueStrings(data?.map((x) => x.afegit_per))

      setOpcions({ barris, ciutats, tipus_cuina: tipus, persones })
    } catch {
      // silenci
    }
  }, [])

  useEffect(() => {
    fetchOpcions()
  }, [fetchOpcions])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchRestaurants(filtres), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filtres, fetchRestaurants])

  async function handleSave(data: Omit<Restaurant, 'id' | 'created_at'>) {
    if (editant) {
      // Actualitzar
      const { error } = await supabase
        .from('restaurants')
        .update(data)
        .eq('id', editant.id)

      if (error) throw new Error(error.message)
      toast.success("Restaurant actualitzat!")
    } else {
      // Crear nou
      const { error } = await supabase
        .from('restaurants')
        .insert([data])

      if (error) throw new Error(error.message)
      toast.success("Restaurant afegit!")
    }
    
    setEditant(null)
    fetchRestaurants(filtres)
    fetchOpcions()
  }

  async function handleDelete(id: string) {
    if (!confirm("Vols eliminar aquest restaurant?")) return
    
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error en eliminar")
      return
    }
    
    toast.success("Restaurant eliminat")
    fetchRestaurants(filtres)
    fetchOpcions()
  }

  function handleEdit(r: Restaurant) {
    setEditant(r)
    setDialogOpen(true)
  }

  function handleOpenAdd() {
    setEditant(null)
    setDialogOpen(true)
  }

  return (
    <TooltipProvider>
      <Toaster richColors position="bottom-right" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-none">
                SomDeMenjar
              </h1>
              <p className="text-muted-foreground text-xs">La meva col·lecció personal</p>
            </div>
          </div>

          <Button onClick={handleOpenAdd} size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Afegir restaurant</span>
            <span className="sm:hidden">Afegir</span>
          </Button>
        </div>
      </header>

      {/* Layout principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filtres */}
          <FiltresCerca
            filtres={filtres}
            onChange={setFiltres}
            opcions={opcions}
            total={restaurants.length}
          />

          {/* Llista de restaurants */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Carregant...
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground text-lg font-medium">
                  Cap restaurant trobat
                </p>
                <p className="text-muted-foreground text-sm">
                  Prova de canviar els filtres o afegeix el primer restaurant.
                </p>
                <Button onClick={handleOpenAdd} variant="outline" className="mt-2 gap-2">
                  <Plus className="h-4 w-4" />
                  Afegir restaurant
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {restaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Diàleg afegir/editar */}
      <AfegirRestaurant
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditant(null)
        }}
        onSave={handleSave}
        initial={editant}
        persones={opcions.persones}
      />
    </TooltipProvider>
  )
}